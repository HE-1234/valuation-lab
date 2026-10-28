#!/usr/bin/env python3
"""Check one guided-data/<TICKER>.json against SCHEMA.md. Usage: python3 validate.py TICKER"""
import json, os, re, sys
from datetime import date as _date
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
NUM = ['revenue', 'operatingIncome', 'cashAndEquivalents', 'shortTermInvestments', 'longTermInvestments',
       'debtCurrent', 'debtNoncurrent', 'operatingLeaseLiabilities', 'noncontrollingInterest', 'preferredEquity',
       'sharesOutstanding']
# Latest filing date allowed; defaults to today. Override with GUIDED_CUTOFF=YYYY-MM-DD.
CUTOFF = os.environ.get('GUIDED_CUTOFF') or _date.today().isoformat()


def num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and x == x and abs(x) != float('inf')


def check(t):
    errs, warns = [], []
    p = HERE / f'{t}.json'
    try:
        d = json.loads(p.read_text())
    except Exception as e:
        return [f'cannot read {p.name}: {e}'], []
    if d.get('ticker') != t: errs.append('ticker mismatch')
    for k in ['name', 'cik', 'currency', 'filerType', 'shareBasis', 'listedUnit']:
        if not isinstance(d.get(k), str) or not d[k].strip(): errs.append(f'{k} missing')
    if not re.fullmatch(r'\d{10}', str(d.get('cik', ''))): errs.append('cik must be 10 digits')
    if d.get('filerType') not in ('domestic', 'foreign'): errs.append('filerType must be domestic or foreign')
    if not num(d.get('adrRatio')) or d['adrRatio'] <= 0: errs.append('adrRatio must be positive')
    snaps = d.get('snapshots') or {}
    for kind in ['annual', 'ttm']:
        s = snaps.get(kind)
        if not isinstance(s, dict): errs.append(f'snapshots.{kind} missing'); continue
        P = f'{kind}.'
        for k in ['periodEnd', 'filedAt', 'sharesDate']:
            if not DATE.match(str(s.get(k, ''))): errs.append(P + k + ' must be YYYY-MM-DD')
        if DATE.match(str(s.get('filedAt', ''))) and s['filedAt'] > CUTOFF: errs.append(P + 'filedAt after cutoff ' + CUTOFF)
        if DATE.match(str(s.get('periodEnd', ''))) and DATE.match(str(s.get('filedAt', ''))) and s['periodEnd'] > s['filedAt']:
            errs.append(P + 'periodEnd after filedAt')
        if s.get('acceptedAt') is not None and not re.match(r'^\d{4}-\d{2}-\d{2}T', str(s['acceptedAt'])):
            errs.append(P + 'acceptedAt must be ISO timestamp or null')
        if not str(s.get('sourceUrl', '')).startswith('https://'): errs.append(P + 'sourceUrl must be https')
        if not s.get('form'): errs.append(P + 'form missing')
        if not s.get('label'): errs.append(P + 'label missing')
        for k in NUM:
            v = s.get(k)
            if v is None:
                if not s.get('note') and not (s.get('evidence') or {}).get(k): errs.append(P + k + ' unknown value needs a note or evidence locator')
                else: warns.append(P + k + ' unknown; not zero-filled and may withhold valuation')
            elif not num(v): errs.append(P + k + ' must be a finite number or documented null')
            elif k in ('revenue', 'sharesOutstanding') and v <= 0: errs.append(P + k + ' must be positive')
            elif k not in ('operatingIncome',) and v < 0: errs.append(P + k + ' cannot be negative')
            ev = (s.get('evidence') or {}).get(k)
            if num(v) and v != 0 and not (isinstance(ev, dict) and str(ev.get('url', '')).startswith('http') and ev.get('locator')):
                if k not in (s.get('carriedFrom') or {}):
                    errs.append(P + k + ' needs evidence {url, locator}')
        if s.get('unvestedRSUs') is not None and not num(s.get('unvestedRSUs')): errs.append(P + 'unvestedRSUs must be number or null')
        o = s.get('options')
        if not isinstance(o, dict): errs.append(P + 'options object missing')
        else:
            for k in ['count', 'weightedExercisePrice', 'weightedRemainingYears', 'aggregateIntrinsicValue']:
                if o.get(k) is not None and not num(o[k]): errs.append(P + 'options.' + k + ' must be number or null')
        cv = s.get('convertibles')
        if not isinstance(cv, list): errs.append(P + 'convertibles must be a list')
        else:
            for i, c in enumerate(cv):
                for k in ['principal', 'carrying']:
                    if not num(c.get(k)): errs.append(P + f'convertibles[{i}].{k} must be a number')
                if c.get('fairValue') is not None and not num(c['fairValue']): errs.append(P + f'convertibles[{i}].fairValue')
        oc = s.get('otherClaims')
        if not isinstance(oc, list): errs.append(P + 'otherClaims must be a list')
        else:
            for i, c in enumerate(oc):
                if c.get('value') is None:
                    if not (c.get('note') or c.get('basis') or c.get('evidence')): errs.append(P + f'otherClaims[{i}] unknown value requires explanation')
                    else: warns.append(P + f'otherClaims[{i}] value undisclosed, not zero')
                elif not num(c.get('value')): errs.append(P + f'otherClaims[{i}].value must be a number or documented null')
        tc = s.get('ttmComponents')
        if kind == 'annual' and tc not in (None, {}): warns.append('annual.ttmComponents should be null')
        if kind == 'ttm':
            if not isinstance(tc, dict): errs.append('ttm.ttmComponents required')
            else:
                for a, b in [('Revenue', 'revenue'), ('OperatingIncome', 'operatingIncome')]:
                    parts = [tc.get('annual' + a), tc.get('ytd' + a), tc.get('priorYtd' + a)]
                    if not all(num(x) for x in parts): errs.append(f'ttm.ttmComponents {a} parts must be numbers'); continue
                    if num(s.get(b)) and abs(parts[0] + parts[1] - parts[2] - s[b]) > 0.011:
                        errs.append(f'ttm.{b} {s[b]} != annual + ytd - priorYtd = {parts[0] + parts[1] - parts[2]:.3f}')
                annual = snaps.get('annual') or {}
                if num(tc.get('annualRevenue')) and num(annual.get('revenue')) and abs(tc['annualRevenue'] - annual['revenue']) > 0.011:
                    warns.append('ttm annualRevenue differs from annual.revenue (fine only if the TTM uses a different annual base)')
        if DATE.match(str(s.get('sharesDate', ''))) and DATE.match(str(s.get('periodEnd', ''))):
            from datetime import date
            gap = (date.fromisoformat(s['sharesDate']) - date.fromisoformat(s['periodEnd'])).days
            if abs(gap) > 60 and 'sharesOutstanding' not in (s.get('carriedFrom') or {}): warns.append(P + f'sharesDate is {gap} days from periodEnd')
    a, q = snaps.get('annual') or {}, snaps.get('ttm') or {}
    if DATE.match(str(a.get('periodEnd', ''))) and DATE.match(str(q.get('periodEnd', ''))) and q['periodEnd'] < a['periodEnd']:
        errs.append('ttm.periodEnd earlier than annual.periodEnd')
    return errs, warns


if __name__ == '__main__':
    bad = 0
    for t in sys.argv[1:] or sorted(p.stem for p in HERE.glob('*.json') if p.stem.isupper()):
        e, w = check(t)
        print(f'{t}: ' + ('OK' if not e else 'FAIL'))
        for x in e: print('  ERROR', x)
        for x in w: print('  warn ', x)
        bad += bool(e)
    sys.exit(1 if bad else 0)
