#!/usr/bin/env python3
"""Bring the reviewed companies into Guided valuation, and give every Guided company a
researched case for both of its financial baselines.

Each company can be valued from its last full fiscal year or from the trailing twelve
months through its latest filed quarter. Each baseline has its own sourced flows,
balance sheet, shares and claims (scripts/guided-filing-data/<TICKER>.json). The Guided
assumptions restate each company's reviewed annual research as the Guided value drivers,
so the two baselines tell the same story from different starting points:

- growth: first-year growth (fading linearly to stable growth by year 10) that reaches the
  research's revenue five years after the baseline's period end;
- target margin, tax, stable growth, terminal ROIC: the research's mature state;
- sales/capital: the research's ten-year revenue added per unit of net reinvestment;
- WACC: the average of the research's annual discount rates;
- other claims: disclosed option intrinsic value, convertible fair value above carrying
  value, noncontrolling and preferred interests and other dilutive claims; unvested
  restricted share units are counted as shares;
- other assets: noncurrent investments that are not in cash.

The original Guided companies keep their researched TTM case; their last-full-year case
uses the same assumptions with first-year growth set so the revenue path meets the TTM
case's five years out.

Rerunning replaces what this script added and leaves everything else unchanged.
"""
import json, math, re, glob, os
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'dist/data'
FILINGS = ROOT / 'scripts/guided-filing-data'
ASOF = os.environ.get('GUIDED_CUTOFF') or date.today().isoformat()
TAG = 'guided-reviewed-v1'
ORIGINALS = ['AAPL', 'MSFT', 'AMZN', 'GOOG', 'META', 'NVDA', 'TSLA', 'COHR', 'LITE', 'AAOI', 'NBIS', 'MU', 'AVGO', 'TSM']
pairs = {}


def pair(en, zh):
    pairs[en] = zh
    return en


def pct(x, d=1):
    s = f'{x * 100:.{d}f}'
    return s.rstrip('0').rstrip('.') if '.' in s else s


def money(x):
    return f'{x:,.0f}' if abs(x) >= 100 else f'{x:,.1f}'


def iso(s):
    return date.fromisoformat(s[:10])


# ---------- the reviewed research packages ----------
def package_items(d):
    if isinstance(d, list):
        return d
    cs = d['companies']
    cs = list(cs.values()) if isinstance(cs, dict) else cs
    out = []
    for c in cs:
        out += c if isinstance(c, list) else [c]
    return out


def packages():
    latest = {}
    for f in sorted(glob.glob(str(DATA / 'incremental-*/cases.json'))):
        for c in package_items(json.loads(Path(f).read_text())):
            if not isinstance(c, dict):
                continue
            ac = c.get('annualCase', c)
            t = ac.get('ticker') or c.get('ticker')
            if t and ac.get('scenario', 'base') == 'base':
                latest[t] = (Path(f), ac, c)
    return latest


MONTHS = {m: i for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 1)}


def month_end(y, m):
    return (date(y + (m == 12), m % 12 + 1, 1) - timedelta(days=1))


def row_date(r, fiscal_end):
    """The end of a forecast row's twelve months, or None for a part-year stub."""
    period = str(r.get('period', ''))
    if re.match(r'^H\d', period) or 'stub' in period.lower() or re.search(r'half', str(r.get('periodBasis', '')), re.I):
        return None
    for k in ('periodEnd', 'fiscalEnd', 'end'):
        v = r.get(k)
        if isinstance(v, str) and re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            return iso(v)
    m = re.search(r'(\d{4}-\d{2}-\d{2})', period)
    if m:
        return iso(m.group(1))
    m = re.match(r'^12M (\w{3}) (\d{4})$', period)
    if m:
        return month_end(int(m.group(2)), MONTHS[m.group(1)])
    m = re.match(r'^FY(\d{4})$', period)
    if m:
        y = int(m.group(1))
        try:
            return fiscal_end.replace(year=y)
        except ValueError:
            return fiscal_end.replace(year=y, day=28)
    if re.match(r'^\d{4}$', period):
        return date(int(period), 12, 31)
    raise ValueError(f'unrecognised forecast period {period!r}')


def research_path(ac, fiscal_end):
    rows = []
    for r in ac['annual']:
        d = row_date(r, fiscal_end)
        if d:
            rows.append((d, float(r['revenue']), r))
    rows.sort(key=lambda x: x[0])
    return rows


def revenue_at(rows, when):
    """Twelve-month revenue ending on a date, log-interpolated between research rows."""
    if when <= rows[0][0]:
        (d0, r0, _), (d1, r1, _) = rows[0], rows[1]
    elif when >= rows[-1][0]:
        (d0, r0, _), (d1, r1, _) = rows[-2], rows[-1]
    else:
        i = next(i for i in range(1, len(rows)) if rows[i][0] >= when)
        (d0, r0, _), (d1, r1, _) = rows[i - 1], rows[i]
    span = (d1 - d0).days or 365
    return r0 * (r1 / r0) ** ((when - d0).days / span)


# ---------- the Guided engine (engine.js valueCompany) ----------
def engine(revenue, ebit, a):
    rows, pv, disc, rev, margin = [], 0.0, 1.0, revenue, ebit / revenue
    n = a['years']
    for year in range(1, n + 1):
        fade = (year - 1) / max(1, n - 1)
        g = a['growth'] + (a['terminalGrowth'] - a['growth']) * fade
        nxt = rev * (1 + g)
        m = margin + (a['targetMargin'] - margin) * year / n
        e = nxt * m
        nopat = e - max(0, e) * a['tax']
        reinv = max(0, (nxt - rev) / a['salesCapital'])
        fcff = nopat - reinv
        disc *= 1 + a['wacc']
        pv += fcff / disc
        rows.append({'revenue': nxt, 'fcff': fcff})
        rev = nxt
    tn = rev * (1 + a['terminalGrowth']) * a['targetMargin'] * (1 - a['tax'])
    terminal = tn * (1 - a['terminalGrowth'] / a['terminalROIC']) / (a['wacc'] - a['terminalGrowth'])
    tpv = terminal / disc
    return {'rows': rows, 'enterprise': pv + tpv, 'terminalPV': tpv}


def revenue_after(revenue, a, years):
    rev = revenue
    for year in range(1, years + 1):
        g = a['growth'] + (a['terminalGrowth'] - a['growth']) * (year - 1) / 9
        rev *= 1 + g
    return rev


def solve_growth(revenue, target, a, years=5):
    lo, hi = -0.5, 1.0
    f = lambda g: revenue_after(revenue, {**a, 'growth': g}, years) - target
    if f(lo) > 0:
        return lo
    if f(hi) < 0:
        return hi
    for _ in range(200):
        mid = (lo + hi) / 2
        (lo, hi) = (mid, hi) if f(mid) < 0 else (lo, mid)
    return round((lo + hi) / 2, 4)


def economic_checks(revenue, ebit, a):
    v = engine(revenue, ebit, a)
    neg = [i + 1 for i, r in enumerate(v['rows']) if r['fcff'] < 0]
    y10 = v['rows'][-1]['revenue']
    return {
        'classification': 'computed consequences of assumptions; not reported outcomes or probabilities',
        'startingRevenue': revenue, 'startingModelMargin': ebit / revenue,
        'firstYearRevenue': v['rows'][0]['revenue'], 'year10Revenue': y10,
        'revenueMultiple10Years': y10 / revenue, 'impliedRevenueCAGR10Years': (y10 / revenue) ** 0.1 - 1,
        'negativeFCFFYears': neg, 'firstPositiveFCFFYear': next((i + 1 for i, r in enumerate(v['rows']) if r['fcff'] > 0), None),
        'terminalROIC': a['terminalROIC'],
        'terminalValueShareOfOperatingEV': v['terminalPV'] / v['enterprise'] if v['enterprise'] else None,
        'operatingEVPositive': v['enterprise'] > 0,
        'note': 'Operating math only; the equity bridge uses the baseline’s sourced cash, debt, shares and claims.'}


# ---------- filing data -> Guided snapshots ----------
# Investments whose earnings already sit inside operating income would be counted twice.
ASSETS_IN_EBIT = {'MCD': 'equity-method earnings are part of McDonald’s operating income'}


def claims_of(s, t=None):
    """Other claims and other assets at the baseline's own period end, with their parts."""
    parts = []
    o = s.get('options') or {}
    if o.get('aggregateIntrinsicValue'):
        parts.append(('options', o['aggregateIntrinsicValue']))
    for c in s.get('convertibles') or []:
        fv, cv = c.get('fairValue'), c.get('carrying')
        if finite(fv) and finite(cv) and fv > cv:
            parts.append(('convertible', fv - cv))
    if s.get('noncontrollingInterest'):
        parts.append(('noncontrolling', s['noncontrollingInterest']))
    if s.get('preferredEquity'):
        parts.append(('preferred', s['preferredEquity']))
    for c in s.get('otherClaims') or []:
        # Contingent guarantees and items the filing data marks as context are not deducted.
        if re.search(r'contingent|guarantee|not (to be )?deduct|informational', f"{c.get('name', '')} {c.get('basis', '')}", re.I):
            continue
        if c.get('value'):
            parts.append(('other', c['value']))
    return parts, sum(v for _, v in parts), 0 if t in ASSETS_IN_EBIT else (s.get('longTermInvestments') or 0)


def filing_limitations(s):
    notes = []
    if s.get('carriedFrom'):
        notes.append(pair('Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.',
                          '部分股数、奖励、租赁或请求权输入沿用较早披露。请查看来源日期；这些金额并非已核实的期末金额。'))
    if any(not finite(s.get(k)) for k in ('cashAndEquivalents', 'shortTermInvestments', 'debtCurrent', 'debtNoncurrent')):
        notes.append(pair('A cash or debt component is not disclosed for this base. The equity bridge is withheld rather than treating the missing amount as zero.',
                          '此基期的现金或债务组成部分未披露。权益价值计算暂不提供，不会把缺失金额当作零。'))
    if s.get('longTermInvestments') is None:
        notes.append(pair('Noncurrent investments exist but their separate carrying amount is unavailable. No value is added for this unquantified asset; this is an omission, not a reported zero.',
                          '存在非流动投资，但其单独账面金额不可得。未对这项无法量化的资产加值；这是遗漏，并非申报值为零。'))
    if s.get('unvestedRSUs') is None or any(c.get('fairValue') is None for c in s.get('convertibles', [])) or any(c.get('value') is None for c in s.get('otherClaims', [])):
        notes.append(pair('Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.',
                          '部分稀释性请求权或可转换证券价值未披露。所示案例仅包含已量化的请求权，并非完整的期末请求权估值。'))
    return notes


def snapshot(t, d, kind, s):
    pe = s['periodEnd']
    sid = f'{t}-CURRENT-{pe}' if kind == 'annual' else f'{t}-TTM-{pe}'
    accepted = s.get('acceptedAt')
    available = max(x for x in [accepted, s['filedAt'] + 'T00:00:00.000Z'] if x)
    cash = sum(s[k] for k in ('cashAndEquivalents', 'shortTermInvestments')) if all(finite(s.get(k)) for k in ('cashAndEquivalents', 'shortTermInvestments')) else None
    debt = sum(s[k] for k in ('debtCurrent', 'debtNoncurrent')) if all(finite(s.get(k)) for k in ('debtCurrent', 'debtNoncurrent')) else None
    rsu = s.get('unvestedRSUs') or 0
    shares = s['sharesOutstanding'] + rsu
    cur = d['currency']
    unit = d.get('listedUnit') or 'common share'
    basis = (f'Actual {"ordinary" if d.get("adrRatio", 1) != 1 else "common"} shares on {s["sharesDate"]}'
             + (f' plus {money(rsu)}m unvested restricted share units' if rsu else '')
             + (f'; one US {unit} = {d["adrRatio"]:g} ordinary shares' if d.get('adrRatio', 1) != 1 else ''))
    label = f'Annual ended {pe}' if kind == 'annual' else f'TTM through {pe}'
    ev = s.get('evidence') or {}
    raw = {
        'id': sid, 'fiscalYear': iso(pe).year, 'fiscalLabel': label,
        'periodEnd': pe, 'fiscalPeriodEnd': pe, 'filedAt': s['filedAt'], 'filingDate': s['filedAt'],
        **({'acceptedAt': accepted} if accepted else {}),
        'sourceURL': s['sourceUrl'], 'sourceUrl': s['sourceUrl'], 'accession': s.get('accession'),
        'form': s['form'] if kind == 'annual' else 'derived', 'sourceForm': s['form'],
        'currency': cur, 'units': {'financials': f'{cur} millions', 'shares': 'millions'},
        'facts': {
            'revenue': s['revenue'], 'operatingIncome': s['operatingIncome'], 'EBIT': s['operatingIncome'],
            'cashAndEquivalents': s['cashAndEquivalents'], 'shortTermInvestments': s['shortTermInvestments'],
            'longTermInvestments': s['longTermInvestments'], 'debtCurrent': s['debtCurrent'], 'debtNoncurrent': s['debtNoncurrent'],
            'operatingLeaseLiabilityTotal': s['operatingLeaseLiabilities'], 'noncontrollingInterest': s['noncontrollingInterest'],
            'preferredEquity': s['preferredEquity'], 'periodEndShares': s['sharesOutstanding'], 'unvestedNonOptionAwards': s.get('unvestedRSUs'),
            'optionsOutstanding': (s.get('options') or {}).get('count'), 'cash': cash, 'debt': debt, 'shares': shares},
        'factEvidence': ev, 'ttmComponents': s.get('ttmComponents'), 'carriedFrom': s.get('carriedFrom') or {},
        'options': s.get('options'), 'convertibles': s.get('convertibles') or [], 'otherClaims': s.get('otherClaims') or [],
        'coverShareDate': s['sharesDate'], 'sharesAsOf': s['sharesDate'], 'sharesDate': s['sharesDate'],
        'reportingCurrency': cur, 'quoteCurrency': 'USD', 'adrRatio': d.get('adrRatio', 1),
        'shareBasis': pair(basis, basis),  # translated below with the rest of the copy
        'cashDefinition': 'Cash and equivalents plus short-term investments. Noncurrent investments are other assets.',
        'debtDefinition': 'Current and noncurrent borrowings at carrying value, including convertible notes and finance leases. Operating leases are not added.',
        'snapshotMode': 'annual-reference' if kind == 'annual' else 'ttm', 'provisionalBridge': True, 'backtestEligible': False,
        'revenue': s['revenue'], 'EBIT': s['operatingIncome'], 'cash': cash, 'debt': debt, 'shares': shares,
        'derivation': ('Last full fiscal year as filed.' if kind == 'annual' else
                       'Latest annual + current year-to-date − prior-year comparable year-to-date; balance sheet and shares from the latest filing.'),
        'availableFrom': available, 'fatalBlockers': [], 'valuationBlockers': filing_limitations(s),
        'reviewRequired': filing_limitations(s),
        'interpretationNotes': [x for x in [s.get('note')] if x] + list(d.get('notes') or []),
        'builtBy': TAG}


    # Alias and aggregate facts retain explicit component evidence instead of
    # losing their source when translated to the Guided schema.
    aliases = {'EBIT': 'operatingIncome', 'operatingLeaseLiabilityTotal': 'operatingLeaseLiabilities',
               'periodEndShares': 'sharesOutstanding', 'unvestedNonOptionAwards': 'unvestedRSUs',
               'optionsOutstanding': 'options.count'}
    raw['factEvidence'] = dict(ev)
    for key, source_key in aliases.items():
        if source_key in ev:
            raw['factEvidence'][key] = dict(ev[source_key])
        elif source_key.startswith('options.') and 'options' in ev:
            raw['factEvidence'][key] = dict(ev['options'])
        else:
            carried = (s.get('carriedFrom') or {}).get(source_key) or ((s.get('carriedFrom') or {}).get('options') if source_key.startswith('options.') else None)
            if carried:
                raw['factEvidence'][key] = {'url': carried.get('sourceUrl'), 'sourceUrl': carried.get('sourceUrl'), 'locator': carried.get('why'), 'periodEnd': carried.get('date'), 'carried': True}
    for key, components, formula in [
        ('cash', ['cashAndEquivalents', 'shortTermInvestments'], 'cashAndEquivalents + shortTermInvestments'),
        ('debt', ['debtCurrent', 'debtNoncurrent'], 'debtCurrent + debtNoncurrent'),
        ('shares', ['sharesOutstanding', 'unvestedRSUs'], 'sharesOutstanding + disclosed unvestedRSUs')]:
        raw['factEvidence'][key] = {'formula': formula, 'componentEvidenceFields': components,
            'sourceUrls': sorted({ev[k]['url'] for k in components if k in ev and ev[k].get('url')}),
            'note': 'Only disclosed quantities are included; see carriedFrom and reviewRequired for unresolved amounts.'}
    raw['facts']['dilutedShares'] = None  # An EPS weighted average is never a dated ownership denominator.
    raw['missingFields'] = [key for key, value in raw['facts'].items() if value is None]
    return raw


# ---------- copy ----------
def share_basis_zh(d, s):
    rsu = s.get('unvestedRSUs') or 0
    kind = '普通股' if d.get('adrRatio', 1) == 1 else '普通股（原股）'
    text = f'{s["sharesDate"]} 的实际{kind}股数' + (f'，加上 {money(rsu)} 百万股未归属限制性股票单位' if rsu else '')
    if d.get('adrRatio', 1) != 1:
        text += f'；每 1 单位美国存托凭证 = {d["adrRatio"]:g} 股普通股'
    return text


# Claims the filings disclose without a value; named on the page instead of silently ignored.
CLAIM_NOTES = {
    'AMD': ('Not included: warrants issued to OpenAI and Meta (up to 160M shares each at $0.01) vest only on deployment and share-price milestones and carry no disclosed value; vesting would dilute holders materially.',
            '未计入：发给 OpenAI 与 Meta 的认股权证（各最多 1.6 亿股，行权价 0.01 美元）须达成部署及股价里程碑才归属，且未披露价值；一旦归属将显著稀释股东。'),
    'MRVL': ('Not included: the Google warrant issued 2026-08-18 (up to 59M shares at $206.58) after the period end, with no disclosed value. Customer warrants use their disclosed grant-date fair value.',
             '未计入：期末后于 2026-08-18 发给 Google 的认股权证（最多 5,900 万股，行权价 206.58 美元），未披露价值。客户认股权证按披露的授予日公允价值计列。'),
    'SNDK': ('Not included: the contingent guarantee of half of Flash Ventures’ lease obligations ($923M), an off-balance-sheet commitment.',
             '未计入：对 Flash Ventures 一半租赁义务的或有担保（9.23 亿美元），属表外承诺。'),
    'UMC': ('Includes the cash dividend declared and unpaid at period end; the restricted-stock authorization (up to 67M shares) was not yet issued.',
            '包含期末已宣告未支付的现金股利；限制性股票授权（最多 6,700 万股）尚未发行。'),
    'MCD': ('Equity-method investments are not added as other assets, because their earnings are already in operating income.',
            '权益法投资未列为其他资产，因其收益已计入营业利润。'),
}


def claims_text(parts, total, assets, s, cur, t=None):
    names = {'options': ('employee options at disclosed intrinsic value', '员工期权（按披露的内在价值）'),
             'convertible': ('convertible notes: fair value above carrying value', '可转换票据：公允价值高于账面价值的部分'),
             'noncontrolling': ('noncontrolling interests', '非控制性权益'),
             'preferred': ('preferred equity', '优先股权益'),
             'other': ('other dilutive claims', '其他稀释性请求权')}
    pe = s['periodEnd']
    rsu = s.get('unvestedRSUs') or 0
    rsu_en = f' Unvested restricted share units ({money(rsu)}m) are counted in shares instead.' if rsu else ''
    rsu_zh = f'未归属限制性股票单位（{money(rsu)} 百万股）改为计入股数。' if rsu else ''
    if parts:
        en = (f'{money(total)}m {cur} at {pe}: ' + '; '.join(f'{names[k][0]} {money(v)}m' for k, v in parts)
              + '. Option intrinsic value understates time value.' + rsu_en)
        zh = (f'{pe} 时为 {money(total)} 百万 {cur}：' + '；'.join(f'{names[k][1]} {money(v)} 百万' for k, v in parts)
              + '。期权内在价值未包含时间价值，可能低估。' + rsu_zh)
    else:
        en = f'0 of quantified additional claims at {pe}. Undisclosed claim values are unresolved, not verified zero.' + rsu_en
        zh = f'{pe} 时已量化的额外请求权为 0。未披露的请求权价值仍待解决，并非已核实为零。' + rsu_zh
    a_en = (f'{money(assets)}m {cur} of noncurrent investments at {pe}, kept out of cash.' if assets else
            f'0 at {pe}: no noncurrent investments outside cash were reported.')
    a_zh = (f'{pe} 时有 {money(assets)} 百万 {cur} 的非流动投资，未计入现金。' if assets else
            f'{pe} 时为 0：财报未列示现金以外的非流动投资。')
    if s.get('longTermInvestments') is None:
        a_en = 'Noncurrent investment value is undisclosed. The model adds no unquantified asset; zero is an explicit omission, not a filing fact.'
        a_zh = '非流动投资价值未披露。模型不加入无法量化的资产；零为明确省略，并非申报事实。'
    if t in CLAIM_NOTES:
        en, zh = en + ' ' + CLAIM_NOTES[t][0], zh + CLAIM_NOTES[t][1]
    return pair(en, zh), pair(a_en, a_zh)


def reviewed_rationale(a, base_rev, base_ebit, label, when5, rev5, cur, sc_parts, wacc_range):
    g, tg = a['growth'], a['terminalGrowth']
    r = {}
    r['growth'] = pair(
        f'{pct(g)}% in year 1, fading to {pct(tg)}% by year 10, takes revenue from {money(base_rev)}m {cur} ({label}) to the reviewed research’s {money(rev5)}m for the twelve months to {when5}.',
        f'第 1 年 {pct(g)}%，至第 10 年逐步降至 {pct(tg)}%，使营收由 {money(base_rev)} 百万 {cur}（{label}）增至已审阅研究中截至 {when5} 的十二个月 {money(rev5)} 百万。')
    m0 = base_ebit / base_rev
    r['targetMargin'] = pair(
        f'{pct(a["targetMargin"])}% is the reviewed research’s mature operating margin; the model starts from {pct(m0)}%. The margin moves there in a straight line over ten years.',
        f'{pct(a["targetMargin"])}% 为已审阅研究的成熟期营业利润率；模型起点为 {pct(m0)}%。利润率在十年内线性调整至该水平。')
    r['tax'] = pair(f'{pct(a["tax"])}% is the reviewed research’s long-run operating tax rate.',
                    f'{pct(a["tax"])}% 为已审阅研究的长期营业税率。')
    added, invested = sc_parts
    r['salesCapital'] = pair(
        f'{a["salesCapital"]:.2f}x: from this base to the reviewed research’s final forecast year, revenue grows by {money(added)}m for {money(invested)}m of net reinvestment.',
        f'{a["salesCapital"]:.2f} 倍：从此基期到已审阅研究的最后预测年度，营收以 {money(invested)} 百万的净再投资增加 {money(added)} 百万。')
    lo, hi = wacc_range
    r['wacc'] = pair(
        f'{pct(a["wacc"])}% is the average of the reviewed research’s annual discount rates ({pct(lo)}%–{pct(hi)}%).' if hi - lo > 1e-6 else
        f'{pct(a["wacc"])}% is the reviewed research’s discount rate.',
        f'{pct(a["wacc"])}% 为已审阅研究各年折现率（{pct(lo)}%–{pct(hi)}%）的平均值。' if hi - lo > 1e-6 else
        f'{pct(a["wacc"])}% 为已审阅研究的折现率。')
    r['terminalGrowth'] = pair(f'{pct(tg)}% is the reviewed research’s stable growth rate after year 10.',
                               f'{pct(tg)}% 为已审阅研究第 10 年后的稳定成长率。')
    r['terminalROIC'] = pair(f'{pct(a["terminalROIC"])}% is the reviewed research’s return on new capital in the stable state.',
                             f'{pct(a["terminalROIC"])}% 为已审阅研究在稳定期对新增资本的报酬率。')
    r['years'] = pair('10 years is the common model horizon, so companies can be compared; it is a modeling convention, not a source fact.',
                      '10 年为共同的模型期间，便于比较各公司；这是建模惯例，并非来源事实。')
    return r


# ---------- build ----------
def main():
    universe = json.loads((DATA / 'current-universe.json').read_text())
    library = json.loads((DATA / 'company-base-cases.json').read_text())
    history = json.loads((DATA / 'company-history.json').read_text())
    pk = packages()
    files = sorted(FILINGS.glob('*.json'))
    added = []

    # drop what an earlier run added
    universe['companies'] = [c for c in universe['companies'] if c.get('builtBy') != TAG]
    for t in list(library['companies']):
        c = library['companies'][t]
        if c.get('builtBy') == TAG:
            del library['companies'][t]
        elif isinstance(c.get('bySnapshot'), dict):
            c['bySnapshot'] = {k: v for k, v in c['bySnapshot'].items() if v.get('builtBy') != TAG}
            if not c['bySnapshot']:
                del c['bySnapshot']
    library['sources'] = {k: v for k, v in library['sources'].items() if v.get('builtBy') != TAG}
    history['companies'] = {k: v for k, v in history['companies'].items() if v.get('builtBy') != TAG}

    for f in files:
        d = json.loads(f.read_text())
        t = d['ticker']
        if t in ORIGINALS or t not in pk:
            continue
        _, ac, pkg = pk[t]
        cur = d['currency']
        snaps = {}
        a_s = d['snapshots']['annual']
        snaps['annual'] = snapshot(t, d, 'annual', a_s)
        q_s = d['snapshots']['ttm']
        if q_s['periodEnd'] != a_s['periodEnd']:
            snaps['ttm'] = snapshot(t, d, 'ttm', q_s)
        fiscal_end = iso(a_s['periodEnd'])
        path = research_path(ac, fiscal_end)
        term = ac['terminal']
        waccs = [float(r['wacc']) for r in ac['annual']]
        invested = sum(max(0, float(r['reinvestment'])) for r in ac['annual'])
        first_margin = float(path[0][2]['operatingMargin'])
        base = {'targetMargin': round(term['operatingMargin'], 4), 'tax': round(term['taxRate'], 4),
                'wacc': round(sum(waccs) / len(waccs), 4), 'terminalGrowth': term['growth'], 'terminalROIC': term['ROIC'],
                'years': 10}
        sources = {}
        cases = {}
        for kind, raw in snaps.items():
            s = d['snapshots'][kind]
            when5 = iso(s['periodEnd']).replace(year=iso(s['periodEnd']).year + 5)
            rev5 = revenue_at(path, when5)
            # Revenue added from this baseline to the research's last year, per unit of all its reinvestment.
            added_rev = path[-1][1] - s['revenue']
            sc = added_rev / invested if invested > 0 and added_rev > 0 else term['ROIC'] / (term['operatingMargin'] * (1 - term['taxRate']))
            a = {**base, 'salesCapital': round(min(10, max(0.2, sc)), 2), 'growth': 0.0}
            a['growth'] = solve_growth(s['revenue'], rev5, a)
            # The research forecasts from an economic margin; a large gap to the reported margin
            # becomes the Guided starting-EBIT normalization, with its reason on the page.
            reported_margin = s['operatingIncome'] / s['revenue']
            normalization = None
            if abs(first_margin - reported_margin) > 0.03:
                delta = round(s['revenue'] * first_margin - s['operatingIncome'], 3)
                reason = pair(f'Starting operating income restated from the reported {pct(reported_margin)}% margin to the reviewed research’s first-year economic margin of {pct(first_margin)}%. The research removes items it treats as non-recurring or non-cash, such as acquired-intangible amortization, restructuring and one-off charges or gains.',
                              f'起始营业利润由申报的 {pct(reported_margin)}% 利润率，调整为已审阅研究第一年的经济利润率 {pct(first_margin)}%。研究剔除其视为非经常性或非现金的项目，例如收购无形资产摊销、重组费用及一次性损益。')
                normalization = {'normalizationDelta': delta, 'adjustmentReason': reason, 'adjustmentSource': s['sourceUrl']}
            parts, claims, assets = claims_of(s, t)
            a['otherClaims'] = round(claims, 3)
            a['otherAssets'] = round(assets, 3)
            label = 'last full year' if kind == 'annual' else 'TTM'
            label_zh = '最近完整年度' if kind == 'annual' else '近十二个月'
            rationale = reviewed_rationale(a, s['revenue'], s['operatingIncome'] + (normalization or {}).get('normalizationDelta', 0), label, when5.isoformat(), rev5, cur, (added_rev, invested),
                                           (min(waccs), max(waccs)))
            # the label inside the sentence has its own translation
            pairs[rationale['growth']] = pairs[rationale['growth']].replace(f'（{label}）', f'（{label_zh}）')
            rationale['otherClaims'], rationale['otherAssets'] = claims_text(parts, claims, assets, s, cur, t)
            src_id = f'{t}-{kind}-filing'
            sources[src_id] = {'title': f'{d["name"]} {s["form"]} for the period ended {s["periodEnd"]}', 'url': s['sourceUrl'],
                               'publishedAt': s['filedAt'], 'retrievedAt': ASOF, 'classification': 'issuer-reported evidence', 'builtBy': TAG}
            pairs[raw['shareBasis']] = share_basis_zh(d, s)
            summary = pair(f'{d["name"]}: the reviewed annual research restated as Guided value drivers, starting from the {label} ({s["periodEnd"]}).',
                           f'{d["name"]}：将已审阅的年度研究改写为引导式价值驱动因素，以{label_zh}（{s["periodEnd"]}）为起点。')
            cases[kind] = {
                'ticker': t, 'name': d['name'], 'snapshotId': raw['id'], 'asOf': ASOF, 'currency': cur,
                'classification': 'assistant judgment / educational default derived from the reviewed annual research',
                'summary': summary, 'assumptions': a, 'rationale': rationale,
                'reportedAnchors': [{'classification': 'reported or directly derived from reported financials', 'periodEnd': s['periodEnd'],
                                     'publishedAt': s['filedAt'], 'snapshotId': raw['id'], 'currency': cur, 'revenue': s['revenue'],
                                     'operatingIncome': s['operatingIncome'], 'operatingMargin': s['operatingIncome'] / s['revenue'],
                                     'sourceIds': [src_id]}],
                'sourceIds': [src_id],
                'bridgePolicy': {'status': 'filing-claims', 'zeroMeansVerifiedAbsent': False, 'preserveExistingGates': True,
                                 'note': pair('Balance-sheet amounts follow the selected filing; carried awards, leases or claims retain their earlier disclosure dates. Unknown values remain unresolved. Operating leases stay out of debt; option intrinsic value excludes time value.',
                                              '资产负债表金额遵循所选申报；沿用的奖励、租赁或请求权保留较早披露日期。未知价值仍待解决。营业租赁不计入债务；期权内在价值不含时间价值。')},
                'modelLimits': [pair('A single growth fade and a straight-line margin path simplify the reviewed research’s year-by-year forecast; Year-by-year keeps the full research case.',
                                     '单一的成长率递减与线性利润率路径，简化了已审阅研究的逐年预测；逐年模型保留完整研究案例。')],
                'uncertainties': [],
                'modelSuitability': {'status': 'provisional-simplified-operating-case', 'economicallyValidated': False,
                                     'note': 'An internally checked conditional model, not proof that business assumptions will be realized.'},
                **({'normalization': normalization} if normalization else {}),
                'economicChecks': economic_checks(s['revenue'], s['operatingIncome'] + (normalization or {}).get('normalizationDelta', 0), a),
                'builtBy': TAG}
        main_kind = 'ttm' if 'ttm' in cases else 'annual'
        entry = cases[main_kind]
        if main_kind == 'ttm':
            entry['bySnapshot'] = {cases['annual']['snapshotId']: cases['annual']}
        library['companies'][t] = entry
        library['sources'].update(sources)
        universe['companies'].append({'ticker': t, 'name': d['name'], 'cik': d['cik'], 'currency': cur,
                                      'currentSnapshotId': snaps[main_kind]['id'], 'snapshots': list(snaps.values()), 'builtBy': TAG})
        h = history_entry(t, d, pkg, cur)
        if h:
            add_capital_history(t, h, cur)
            history['companies'][t] = h
        added.append(t)

    # the original companies: a researched case for their last full year as well
    for t in ORIGINALS:
        c = library['companies'].get(t)
        comp = next((x for x in universe['companies'] if x['ticker'] == t), None)
        if not c or not comp:
            continue
        ttm = next((s for s in comp['snapshots'] if s['id'] == c['snapshotId']), None)
        annual = [s for s in comp['snapshots'] if s.get('snapshotMode') == 'annual-reference' and s['id'] != c['snapshotId']]
        if not ttm or not annual:
            continue
        fy = max(annual, key=lambda s: s['periodEnd'])
        a0 = c['assumptions']
        f_rev, f_ebit = fy.get('revenue') or fy['facts']['revenue'], fy.get('EBIT') or fy['facts']['operatingIncome']
        t_rev = ttm.get('revenue') or ttm['facts']['revenue']
        # the TTM case's revenue path, dated, so the annual case can meet it five years out
        gap = (iso(ttm['periodEnd']) - iso(fy['periodEnd'])).days / 365.25
        target_when = 5 + 0  # years after the annual period end
        k = 5 - gap
        lo_y, frac = int(math.floor(k)), k - math.floor(k)
        r_lo = revenue_after(t_rev, a0, lo_y)
        r_hi = revenue_after(t_rev, a0, lo_y + 1)
        target = r_lo * (r_hi / r_lo) ** frac
        a = {**a0}
        for field in ('otherAssets', 'otherClaims'):
            evidence = (c.get('bridgeEvidence') or {}).get(field) or {}
            if evidence.get('periodEnd') and evidence['periodEnd'] != fy['periodEnd']:
                a[field] = None  # The original-company patch must supply this base's own evidence.
        a['growth'] = solve_growth(f_rev, target, a)
        label = fy.get('fiscalLabel') or fy['periodEnd']
        when5 = iso(fy['periodEnd']).replace(year=iso(fy['periodEnd']).year + 5).isoformat()
        g_en = (f'{pct(a["growth"])}% in year 1, fading to {pct(a["terminalGrowth"])}% by year 10, tells the same story as the TTM case from the last full year: '
                f'revenue reaches {money(target)}m {c["currency"]} in the twelve months to {when5}, where the TTM case’s path is at that date.')
        g_zh = (f'第 1 年 {pct(a["growth"])}%，至第 10 年逐步降至 {pct(a["terminalGrowth"])}%，从最近完整年度出发讲述与近十二个月案例相同的故事：'
                f'截至 {when5} 的十二个月营收达 {money(target)} 百万 {c["currency"]}，与近十二个月案例在该日期的路径一致。')
        case = {k2: v for k2, v in c.items() if k2 not in ('bySnapshot', 'bridgeEvidence', 'bridgeComponents', 'bridgeLimitations', 'bridgePolicy')}
        case.update({'snapshotId': fy['id'], 'asOf': max(c['asOf'], fy['filedAt'][:10]), 'assumptions': a,
                     'rationale': {**c['rationale'], 'growth': pair(g_en, g_zh)},
                     'reportedAnchors': [{'classification': 'reported or directly derived from reported financials', 'periodEnd': fy['periodEnd'],
                                          'publishedAt': fy['filedAt'], 'snapshotId': fy['id'], 'currency': c['currency'], 'revenue': f_rev,
                                          'operatingIncome': f_ebit, 'operatingMargin': f_ebit / f_rev,
                                          'sourceIds': [s for s in c['sourceIds'] if s.endswith('annual-filing')] or c['sourceIds'][:1]}],
                     'economicChecks': economic_checks(f_rev, f_ebit, a), 'builtBy': TAG})
        case.pop('stressIllustrations', None)
        # The AAOI capacity profile is explicitly tied to its June TTM source.
        # An annual case uses its documented scalar path until separately researched.
        case.pop('operatingProfile', None)
        c.setdefault('bySnapshot', {})[fy['id']] = case

    history['asOf'] = ASOF
    library['asOf'] = ASOF
    library['version'] = f'{ASOF}.1'
    library['revision'] = {'priorVersion': library.get('version'), 'summary': 'Reviewed companies added to Guided with last-full-year and TTM baselines; original companies gain a last-full-year case.'}
    universe['asOf'] = max(universe['asOf'], ASOF)
    (DATA / 'current-universe.json').write_text(json.dumps(universe, ensure_ascii=False, indent=1) + '\n')
    (DATA / 'company-base-cases.json').write_text(json.dumps(library, ensure_ascii=False, indent=1) + '\n')
    (DATA / 'company-history.json').write_text(json.dumps(history, ensure_ascii=False, indent=1) + '\n')
    # copy shown on the Guided page, in English and Simplified Chinese
    pairs.update({
        '/ ordinary share': '/ 普通股',
        'Disclosed unvested employee awards': '已披露的未归属员工奖励',
        'Disclosed unvested employee awards are counted as shares; future financing and issuance remain unmodeled. GAAP operating compensation stays in EBIT.': '已披露的未归属员工奖励计入股数；未来融资和发行尚未建模。按会计准则确认的营业薪酬仍计入营业利润。',
        'The $7,100m noncontrolling-interest proxy includes $824m redeemable NCI; it is not added twice. Investment values are gross before realization taxes; no separate exit-tax reserve is deducted. The balance-sheet deferred tax liability mixes items and is not mechanically deducted in full. Employee award valuation beyond the disclosed share count and liquidity discounts remain uncertain.': '71亿美元的非控制性权益代理金额包含8.24亿美元可赎回非控制性权益，未重复计入。投资价值为变现税前金额，未另扣退出税准备。资产负债表递延所得税负债包含混合项目，不会机械地全额扣除。已披露股数以外的员工奖励估值及流动性折价仍不确定。',
        'Cash and equivalents plus short-term investments. Noncurrent investments are other assets.': '现金及约当现金加短期投资。非流动投资列为其他资产。',
        'Current and noncurrent borrowings at carrying value, including convertible notes and finance leases. Operating leases are not added.': '按账面价值计列的流动及非流动借款，包括可转换票据与融资租赁；营业租赁不计入。',
        'Last full fiscal year as filed.': '最近完整会计年度，依申报数据。',
        'Latest annual + current year-to-date − prior-year comparable year-to-date; balance sheet and shares from the latest filing.': '最近年度 + 本年迄今 − 上年同期迄今；资产负债表与股数取自最新财报。',
        'Reviewed research history; annual facts as filed': '已审阅研究的历史资料；年度数据依申报',
        'An internally checked conditional model, not proof that business assumptions will be realized.': '经内部检查的条件式模型，并不证明业务假设将会实现。'})
    for source_path in sorted([*(FILINGS / 'originals').glob('*.json'), *(FILINGS / 'claims-resolution').glob('*.json')]):
        supplemental = json.loads(source_path.read_text())
        pairs.update(supplemental.get('localizationPairs', {}))
    out = ROOT / 'dist/locales/guided-case-pairs.js'
    out.write_text('// English and Simplified Chinese copy for the Guided cases built by scripts/build-guided-reviewed-cases.py.\nexport default '
                   + json.dumps(sorted([[k, v] for k, v in pairs.items() if k != v]), ensure_ascii=False, indent=1) + ';\n')
    print('added', len(added), added)


def finite(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def history_sources(*facts):
    return sorted({u for f in facts if isinstance(f, dict)
                   for u in (f.get('sourceUrls') or [f.get('sourceUrl')]) if u})


def history_missing(field):
    labels = {'revenue': ('revenue', '营业收入'), 'operatingIncome': ('operating income', '营业利润'),
              'pretaxIncome': ('pretax income', '税前利润'), 'incomeTaxExpense': ('income tax expense', '所得税费用'),
              'bookEquity': ('book equity', '账面权益'), 'cashAndEquivalents': ('cash and equivalents', '现金及现金等价物'),
              'mappedDebt': ('mapped debt', '已映射债务'), 'bookCapitalProxy': ('book capital', '账面资本'),
              'longTermDebtNoncurrent': ('noncurrent debt', '非流动债务'), 'shortTermBorrowings': ('current borrowings', '流动借款')}
    en, zh = labels.get(field, (field, field))
    return pair(f'No sourced annual {en} for this fiscal period; missing is not zero.', f'本会计期间缺少有来源的年度{zh}；缺失不代表零。')


def history_fact(e, key, cur, end, start=None):
    """Retain the field's own source, date and accounting period, not a row's first URL."""
    if not isinstance(e, dict) or not finite(e.get('value')):
        return {'value': None, 'reason': history_missing(key), 'note': e.get('reason') or e.get('note') if isinstance(e, dict) else None}
    f = dict(e)
    f['unit'] = f'{cur} millions'
    f['filedAt'] = e.get('filedAt') or e.get('filed') or e.get('filing_date')
    f['sourceUrl'] = e.get('sourceUrl') or e.get('source_url')
    f['periodEnd'] = e.get('periodEnd') or e.get('period_end') or end
    f['periodStart'] = e.get('periodStart') or e.get('period_start') or (start if key in ('revenue', 'operatingIncome', 'pretaxIncome', 'incomeTaxExpense') else None)
    f['accession'] = e.get('accession') or e.get('accn')
    f['sourceType'] = e.get('sourceType') or 'Filing evidence; latest reported annual observation'
    if f['filedAt'] and f['filedAt'] > ASOF:
        return {'value': None, 'reason': pair('Annual evidence was filed after the refresh cutoff.', '年度证据的申报日晚于本次更新截止日。')}
    if f['periodEnd'] != end:
        return {'value': None, 'reason': pair('The source fact does not match this fiscal period end.', '来源数据与本会计期间结束日不一致。'), 'sourceUrl': f['sourceUrl']}
    # Raw numeric scale is a unit conversion only; verification is never upgraded.
    if e.get('tag') and not e.get('formula'):
        f['rawValue'] = e.get('rawValue', e.get('raw_value', e['value'] * 1e6))
    if e.get('formula'):
        component_facts = [x for x in e.get('components', []) if isinstance(x, dict)]
        f['sourceUrls'] = history_sources(e, *component_facts)
        dates = [x.get('filedAt') or x.get('filed') for x in [e, *component_facts]]
        f['filedAt'] = max((x for x in dates if x), default=None)
    f.setdefault('originalDocumentVerified', False)
    return f


def history_derived(value, formula, components, facts, cur, end, reason=None):
    dates = [f.get('filedAt') for f in facts if f and f.get('filedAt')]
    return {'value': value, 'unit': f'{cur} millions', 'periodEnd': end,
            'formula': formula, 'components': components, 'sourceUrls': history_sources(*facts),
            'filedAt': max(dates) if dates else None, 'sourceType': 'Derived from dated annual filing facts',
            'reason': reason if value is None else None}


def history_entry(t, d, pkg, cur):
    # Source files carry the accounting basis and actual fiscal-year dates. The research
    # forecast is never an evidence substitute for missing historical facts.
    path = FILINGS / 'history' / f'{t}.json'
    source = json.loads(path.read_text()) if path.exists() else {}
    pairs.update(source.get('localizationPairs', {}))
    if source.get('accountingBasisZh'): pair(source['accountingBasis'], source['accountingBasisZh'])
    if source.get('shortfallReasonZh') and source.get('shortfallReason'): pair(source['shortfallReason'], source['shortfallReasonZh'])
    for en, zh in zip(source.get('cautions', []), source.get('cautionsZh', [])): pair(en, zh)
    years = source.get('years', {})
    out = []
    for year, r in years.items():
        end = r.get('periodEnd') or next((v.get('periodEnd') for v in r.values() if isinstance(v, dict) and v.get('periodEnd')), None)
        start = r.get('periodStart') or next((r.get(k, {}).get('periodStart') for k in ('revenue', 'operatingIncome', 'pretaxIncome') if isinstance(r.get(k), dict) and r[k].get('periodStart')), None)
        if not end or not start:
            # No guessed 365-day dates for 52/53-week issuers.
            continue
        if not 330 <= (iso(end) - iso(start)).days <= 380 or end > d['snapshots']['annual']['periodEnd']:
            continue
        facts = {k: history_fact(r.get(k), k, cur, end, start) for k in
                 ('revenue', 'operatingIncome', 'bookEquity', 'cashAndEquivalents', 'pretaxIncome', 'incomeTaxExpense')}
        row = {'period': f'FY{r.get("fiscalYear", year)}', 'periodStart': start, 'periodEnd': end,
               'periodType': 'annual', 'currency': cur, 'facts': facts, 'metrics': {}}
        for k in ('accountingBasis', 'rangeEligible', 'comparabilityNote', 'excludeNormalizedTax', 'taxCaution'):
            if k in r: row[k] = r[k]
        row['_capitalSource'] = r
        out.append(row)
    out.sort(key=lambda r: r['periodEnd'])
    if len({r['periodEnd'] for r in out}) != len(out):
        raise ValueError(f'{t}: duplicate annual periods in history source')
    out = out[-11:]
    basis = source.get('accountingBasis') or pair('Annual filing history; latest reported evidence', '年度申报历史；最新申报证据')
    caution = pair('Book capital is equity plus mapped debt minus cash. It is an accounting proxy, not adjusted invested capital; missing amounts are never zero-filled.',
                   '账面资本为权益加已映射债务减现金。这是会计代理指标，并非调整后投入资本；缺失金额不会填零。')
    shortfall = source.get('shortfallReason')
    entry = {'ticker': t, 'name': d['name'], 'currency': cur, 'accountingBasis': basis,
             'backtestEligible': False, 'annual': out[-10:], 'baseObservation': out[0] if len(out) > 10 else None,
             'cautions': [caution, *source.get('cautions', [])], 'builtBy': TAG,
             '_shortfallReason': shortfall}
    return entry


def add_capital_history(t, entry, cur):
    """One consistent evidence and ratio contract for all reviewed annual histories."""
    rows = ([entry['baseObservation']] if entry.get('baseObservation') else []) + entry['annual']
    for row in rows:
        src, fs, end = row.pop('_capitalSource', {}), row['facts'], row['periodEnd']
        if isinstance(src.get('mappedDebt'), dict):
            fs['mappedDebt'] = history_fact(src['mappedDebt'], 'mappedDebt', cur, end)
            for k in src['mappedDebt'].get('components', []):
                if isinstance(k, str) and isinstance(src.get(k), dict):
                    fs[k] = history_fact(src[k], k, cur, end)
        else:
            fields = ['longTermDebtNoncurrent', 'shortTermBorrowings']
            debt_facts = [history_fact(src.get(k), k, cur, end) for k in fields]
            fs.update(zip(fields, debt_facts))
            values = [f['value'] for f in debt_facts]
            debt = sum(values) if all(finite(v) for v in values) else None
            fs['mappedDebt'] = history_derived(debt, 'Noncurrent debt + current borrowings', fields, debt_facts, cur, end, history_missing('mappedDebt'))
        fields = ['bookEquity', 'mappedDebt', 'cashAndEquivalents']
        eq, debt, cash = (fs[k]['value'] for k in fields)
        cap = eq + debt - cash if all(finite(v) for v in (eq, debt, cash)) else None
        fs['bookCapitalProxy'] = history_derived(cap, 'Book equity + mapped debt − cash and cash equivalents', fields,
                                                [fs[k] for k in fields], cur, end, history_missing('bookCapitalProxy'))
    for i, row in enumerate(rows):
        fs, m = row['facts'], row['metrics']
        candidate = rows[i - 1] if i else None
        adjacent = bool(candidate and 330 <= (iso(row['periodEnd']) - iso(candidate['periodEnd'])).days <= 380
                        and 0 <= (iso(row['periodStart']) - iso(candidate['periodEnd'])).days <= 8)
        same_basis = not candidate or not row.get('accountingBasis') or not candidate.get('accountingBasis') or row['accountingBasis'] == candidate['accountingBasis']
        prev = candidate if adjacent and same_basis else None
        def val(k, r=row):
            return (r.get('facts', {}).get(k) or {}).get('value') if r else None
        def ratio(key, num, den, formula, components, reason=None, proxy=False, prior=False):
            usable = finite(num) and finite(den) and den > 0 and not reason
            value = num / den if usable else None
            facts = [fs.get(k) for k in components]
            if prior and prev:
                facts += [prev['facts'].get(k) for k in ('revenue', 'bookCapitalProxy')]
            dates = [f['filedAt'] for f in facts if f and f.get('filedAt')]
            missing = [f.get('reason') for f in facts if f and f.get('value') is None and f.get('reason')]
            why = reason or (missing[0] if missing else pair('The denominator is missing, zero or negative.', '分母缺失、为零或为负。'))
            m[key] = {'value': value, 'numerator': num, 'denominator': den, 'formula': formula,
                      'components': components, 'classification': 'proxy' if proxy else 'derived',
                      'rangeEligible': value is not None and row.get('rangeEligible', True),
                      'reason': why if value is None else None, 'sourceUrls': history_sources(*facts),
                      'availableFrom': max(dates) if dates else None}
            if prior: m[key]['priorPeriodEnd'] = prev['periodEnd'] if prev else None
        no_prior = None if prev else pair('No adjacent comparable preceding fiscal year is included; multi-year changes are not annual growth.', '缺少相邻且可比的上一会计年度；多年变化不能视为年度增长。')
        rev, p_rev = val('revenue'), val('revenue', prev)
        drev = rev - p_rev if finite(rev) and finite(p_rev) else None
        ratio('growth', drev, p_rev, '(Revenue − prior fiscal-year revenue) / prior fiscal-year revenue', ['revenue'], no_prior, prior=True)
        ratio('operatingMargin', val('operatingIncome'), rev, 'Operating income / revenue', ['operatingIncome', 'revenue'])
        pretax, tax = val('pretaxIncome'), val('incomeTaxExpense')
        reason = pair('Pretax income is zero or negative; a useful effective tax-rate comparison is unavailable.', '税前利润为零或为负，无法进行有意义的有效税率比较。') if finite(pretax) and pretax <= 0 else None
        ratio('effectiveTaxRate', tax, pretax, 'Income tax expense / pretax income', ['incomeTaxExpense', 'pretaxIncome'], reason)
        rate = m['effectiveTaxRate']['value']
        tax_ok = finite(rate) and 0 <= rate <= 1 and not row.get('excludeNormalizedTax', False)
        m['effectiveTaxRate']['rangeEligible'] = tax_ok and row.get('rangeEligible', True)
        m['effectiveTaxRate']['rawRatio'] = tax / pretax if finite(tax) and finite(pretax) and pretax != 0 else None
        if finite(rate) and not tax_ok:
            m['effectiveTaxRate']['caution'] = pair('Tax benefit or rate above 100%; displayed as reported, excluded from range and ROIC proxy.', '税收收益或税率超过100%；按申报值展示，但不纳入区间或资本回报率代理指标。')
        cap, p_cap = val('bookCapitalProxy'), val('bookCapitalProxy', prev)
        ratio('bookSalesCapitalProxy', rev, cap, 'Revenue / end-of-year cash-only book-capital proxy', ['revenue', 'bookCapitalProxy'], proxy=True)
        dcap = cap - p_cap if finite(cap) and finite(p_cap) else None
        reason = no_prior or (pair('Book capital did not increase; not interpretable as a marginal reinvestment ratio.', '账面资本未增加，不能解读为边际再投资比率。') if finite(dcap) and dcap <= 0 else None)
        ratio('incrementalBookSalesCapitalProxy', drev, dcap, 'Change in revenue / change in cash-only book-capital proxy', ['revenue', 'bookCapitalProxy'], reason, proxy=True, prior=True)
        oi = val('operatingIncome')
        nopat = oi * (1 - rate) if finite(oi) and tax_ok else None
        reason = no_prior or (pair('Effective tax rate is unavailable or unsuitable for operating-tax normalization this year.', '本年度有效税率缺失，或不适用于营业税费正常化。') if not tax_ok else None)
        ratio('bookROICProxy', nopat, p_cap, 'Operating income × (1 − reported effective tax rate) / prior-year cash-only book-capital proxy', ['operatingIncome', 'incomeTaxExpense', 'pretaxIncome'], reason, proxy=True, prior=True)
    annual, base = entry['annual'], entry.get('baseObservation')
    n = len(annual)
    label = pair(f'{annual[0]["period"]}–{annual[-1]["period"]} · {n} reported fiscal years', f'{annual[0]["period"]}–{annual[-1]["period"]} · {n}个已申报会计年度') if annual else pair('No reviewed annual evidence', '尚无已审核年度证据')
    shortfall = entry.pop('_shortfallReason', None)
    if n < 10:
        shortfall = shortfall or pair('Fewer than ten annual periods have sourced evidence on this accounting basis; older or different businesses are not substituted.', '此会计口径下有来源证据的年度不足十年；不会用更早或不同业务的数据替代。')
    entry['coverage'] = {'requestedYears': 10, 'annualYears': n, 'periodStart': annual[0]['periodStart'] if annual else None,
                         'periodEnd': annual[-1]['periodEnd'] if annual else None, 'label': label, 'shortfallReason': shortfall,
                         'comparableAnnualYears': sum(r.get('rangeEligible') is not False for r in annual),
                         'comparabilityNote': None, 'openingPeriod': base['period'] if base else None,
                         'openingPeriodReason': None if base else pair('No sourced adjacent opening annual observation; first-year growth and beginning-capital returns may be unavailable.', '缺少有来源的相邻期初年度数据；首年增长率及期初资本回报率可能不可用。'),
                         'metricAvailability': {k: {'availableYears': sum(finite(r['metrics'][k]['value']) for r in annual),
                                                    'rangeYears': sum(finite(r['metrics'][k]['value']) and r['metrics'][k]['rangeEligible'] for r in annual)}
                                                for k in annual[0]['metrics']} if annual else {}}


if __name__ == '__main__':
    main()
    # Guided-only additions have no Year-by-year package. Rebuild their own
    # source-matched records and bilingual copy after the original pipeline.
    if (ROOT / 'scripts/build-guided-additions.py').exists():
        import runpy
        runpy.run_path(str(ROOT / 'scripts/build-guided-additions.py'))['main']()
