#!/usr/bin/env python3
"""Apply narrow, offline original-company Guided repairs from reviewed evidence.

No legacy pipeline is run. No network or missing-to-zero conversion is performed.
Use --data-dir for an isolated verification copy before applying to dist/data.
"""
import argparse
import copy
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'scripts/guided-filing-data/originals'


def urls(*facts):
    result = []
    for fact in facts:
        for url in (fact or {}).get('sourceUrls', []) or [(fact or {}).get('sourceUrl')]:
            if url and url not in result:
                result.append(url)
    return result


def capital(row):
    facts = row['facts']
    parts = ['bookEquity', 'mappedDebt', 'cashAndEquivalents']
    values = [facts.get(k, {}).get('value') for k in parts]
    complete = all(v is not None for v in values)
    facts['bookCapitalProxy'] = {
        'value': values[0] + values[1] - values[2] if complete else None,
        'unit': row['currency'] + ' millions',
        'formula': 'Book equity + mapped debt − cash and cash equivalents',
        'components': parts, 'sourceUrls': urls(*(facts.get(k) for k in parts)),
        'filedAt': max((facts.get(k, {}).get('filedAt', '') for k in parts), default=''),
        'sourceType': 'Derived from reviewed filing facts',
        'reason': None if complete else 'At least one required source component is unavailable.',
        'note': 'Cash-only book-capital proxy; operating leases and expensed R&D are not capitalized.'
    }


def refresh_metrics(rows):
    for i, row in enumerate(rows):
        f = row['facts']; metrics = row.setdefault('metrics', {})
        p = rows[i - 1] if i else None
        if p and not 330 <= (dt.date.fromisoformat(row['periodEnd']) - dt.date.fromisoformat(p['periodEnd'])).days <= 380:
            p = None
        pf = p['facts'] if p else {}
        def v(key, facts=f): return facts.get(key, {}).get('value')
        def setratio(key, num, den, formula, parts, evidence, reason=None):
            value = num / den if num is not None and den is not None and den > 0 and not reason else None
            prior = metrics.get(key, {})
            excluded = bool(prior.get('comparabilityNote')) and prior.get('rangeEligible') is False
            metrics[key] = {**prior, 'value': value, 'numerator': num, 'denominator': den,
                            'formula': formula, 'components': parts, 'classification': 'proxy' if 'Proxy' in key else 'derived',
                            'rangeEligible': value is not None and not excluded,
                            'reason': reason or (None if value is not None else 'Missing numerator or positive denominator.'),
                            'sourceUrls': urls(*evidence),
                            'availableFrom': max((x.get('filedAt', '') or '' for x in evidence if x), default='') or None}
        revenue, previous_revenue = v('revenue'), v('revenue', pf)
        delta_revenue = revenue - previous_revenue if revenue is not None and previous_revenue is not None else None
        # Only new opening rows need these existing noncapital metrics reconstructed.
        if not metrics.get('operatingMargin'):
            setratio('growth', delta_revenue, previous_revenue, '(Revenue − prior fiscal-year revenue) / prior fiscal-year revenue', ['revenue'], [f.get('revenue'), pf.get('revenue')])
            setratio('operatingMargin', v('operatingIncome'), revenue, 'Operating income / revenue', ['operatingIncome','revenue'], [f.get('operatingIncome'),f.get('revenue')])
            setratio('effectiveTaxRate', v('incomeTaxExpense'), v('pretaxIncome'), 'Income tax expense / pretax income', ['incomeTaxExpense','pretaxIncome'], [f.get('incomeTaxExpense'),f.get('pretaxIncome')])
        if p and metrics.get('growth', {}).get('value') is None and delta_revenue is not None:
            setratio('growth', delta_revenue, previous_revenue, '(Revenue − prior fiscal-year revenue) / prior fiscal-year revenue', ['revenue'], [f.get('revenue'),pf.get('revenue')])
            metrics['growth']['priorPeriodEnd'] = p['periodEnd']
        current_capital, previous_capital = v('bookCapitalProxy'), v('bookCapitalProxy', pf)
        delta_capital = current_capital - previous_capital if current_capital is not None and previous_capital is not None else None
        setratio('bookSalesCapitalProxy', revenue, current_capital, 'Revenue / end-of-year cash-only book-capital proxy', ['revenue','bookCapitalProxy'], [f.get('revenue'),f.get('bookCapitalProxy')])
        setratio('incrementalBookSalesCapitalProxy', delta_revenue, delta_capital, 'Change in revenue / change in cash-only book-capital proxy', ['revenue','bookCapitalProxy'], [f.get('revenue'),f.get('bookCapitalProxy'),pf.get('revenue'),pf.get('bookCapitalProxy')], 'Book capital did not increase; not interpretable as a marginal reinvestment ratio.' if delta_capital is not None and delta_capital <= 0 else None)
        tax = metrics.get('effectiveTaxRate', {}).get('value')
        meaningful_tax = tax is not None and 0 <= tax <= 1 and not row.get('excludeNormalizedTax', False)
        nopat = v('operatingIncome') * (1 - tax) if v('operatingIncome') is not None and meaningful_tax else None
        setratio('bookROICProxy', nopat, previous_capital, 'Operating income × (1 − reported effective tax rate) / prior-year cash-only book-capital proxy', ['operatingIncome','incomeTaxExpense','pretaxIncome','bookCapitalProxy'], [f.get('operatingIncome'),f.get('incomeTaxExpense'),f.get('pretaxIncome'),pf.get('bookCapitalProxy')], None if meaningful_tax else 'Effective tax rate is unavailable or unsuitable for operating-tax normalization this year.')
        for key in ['incrementalBookSalesCapitalProxy','bookROICProxy']:
            metrics[key]['priorPeriodEnd'] = p['periodEnd'] if p else None


def apply_bridge_supplement(universe, cases, supplement):
    """Apply dated supplemental claims after narrow repairs, preserving unknowns.

    The dedicated GOOG/AAOI overlays depend on exact raw source tuples and are
    intentionally outside this supplement's scope.
    """
    by_id = {s['id']: s for c in universe['companies'] for s in c['snapshots']}
    case_by_id = {}
    if cases:
        for company in cases['companies'].values():
            for case in [company, *company.get('bySnapshot', {}).values()]:
                if case.get('snapshotId'):
                    case_by_id[case['snapshotId']] = case
    for sid, change in supplement.get('snapshotPatches', {}).items():
        if change.get('ticker') in ['AAOI', 'GOOG']:
            raise ValueError('Dedicated overlay source tuples must not be changed by bridge supplement: ' + sid)
        snapshot = by_id[sid]
        if snapshot['periodEnd'] != change['periodEnd']:
            raise ValueError('Supplement and snapshot period mismatch: ' + sid)
        prior_limitations = snapshot.get('guidedBridgeLimitations', [])
        prior_blockers = snapshot.get('guidedBridgeBlockers', [])
        for key in ['interpretationNotes', 'reviewRequired', 'sourceValuationWarnings']:
            snapshot[key] = [x for x in snapshot.get(key, []) if x not in prior_limitations]
        snapshot['hardBlockers'] = [x for x in snapshot.get('hardBlockers', []) if x not in prior_blockers]
        limitations = list(dict.fromkeys(change.get('limitations', [])))
        blockers = []
        for key, source in change.get('facts', {}).items():
            if source.get('periodEnd') != snapshot['periodEnd']:
                raise ValueError('Supplement fact period mismatch: ' + sid + ' ' + key)
            value = source['value']
            snapshot['facts'][key] = value
            if key in snapshot or key in ['cash', 'debt', 'shares', 'revenue', 'EBIT']:
                snapshot[key] = value
            snapshot.setdefault('factEvidence', {})[key] = copy.deepcopy(source)
            snapshot.setdefault('fieldMapping', {})[key] = source.get('tag', 'reviewed filing table')
            if value is None:
                if key not in snapshot.setdefault('missingFields', []):
                    snapshot['missingFields'].append(key)
                if key in ['cash', 'debt', 'shares', 'revenue', 'EBIT']:
                    blockers.extend(limitations or [source.get('note') or source['locator']])
            else:
                snapshot['missingFields'] = [x for x in snapshot.get('missingFields', []) if x != key]
        snapshot['bridgeComponents'] = copy.deepcopy(change.get('bridgeComponents', {}))
        if change.get('shareBasis'):
            snapshot['shareBasis'] = change['shareBasis']
        # This is the actual source date of the modeled denominator, not a later
        # filing-cover count. Preserve coverShareDate as separate provenance.
        snapshot['sharesDate'] = change['periodEnd']
        snapshot['sharesAsOf'] = change['periodEnd']
        case = case_by_id.get(sid)
        for key, source in change.get('caseAssumptions', {}).items():
            if source.get('periodEnd') != snapshot['periodEnd']:
                raise ValueError('Supplement assumption period mismatch: ' + sid + ' ' + key)
            if case:
                # null deliberately overwrites any stale numeric default.
                case.setdefault('assumptions', {})[key] = source['value']
                case.setdefault('bridgeEvidence', {})[key] = copy.deepcopy(source)
                case.setdefault('rationale', {})[key] = source.get('note') or source['locator']
            if source['value'] is None:
                explanation = source.get('note') or source['locator']
                limitations.append(explanation)
                blockers.append(explanation)
        limitations = list(dict.fromkeys(limitations))
        blockers = list(dict.fromkeys(blockers))
        snapshot['guidedBridgeLimitations'] = limitations
        snapshot['guidedBridgeBlockers'] = blockers
        for key in ['interpretationNotes', 'reviewRequired', 'sourceValuationWarnings']:
            snapshot[key] = list(dict.fromkeys([*snapshot[key], *limitations]))
        snapshot['hardBlockers'] = list(dict.fromkeys([*snapshot['hardBlockers'], *blockers]))
        if case:
            case['bridgeLimitations'] = copy.deepcopy(limitations)
            case['bridgeComponents'] = copy.deepcopy(change.get('bridgeComponents', {}))


def apply(data_dir):
    evidence = json.loads((SOURCES / 'patches.json').read_text())
    checks = json.loads((SOURCES / 'refresh-checks.json').read_text())
    universe_path = data_dir / 'current-universe.json'
    history_path = data_dir / 'company-history.json'
    cases_path = data_dir / 'company-base-cases.json'
    universe = json.loads(universe_path.read_text())
    history = json.loads(history_path.read_text())
    cases = json.loads(cases_path.read_text()) if cases_path.exists() else None
    for company in universe['companies']:
        ticker = company['ticker']
        if ticker not in checks: continue
        company['guidedRefreshCheck'] = copy.deepcopy(checks[ticker])
        for snapshot in company['snapshots']:
            change = evidence['snapshotPatches'].get(snapshot['id'])
            if not change: continue
            snapshot.update(copy.deepcopy(change.get('fields', {})))
            for key, source in change['facts'].items():
                value = source['value']; snapshot['facts'][key] = value
                if key in snapshot or key == 'debt': snapshot[key] = value
                snapshot.setdefault('factEvidence', {})[key] = copy.deepcopy(source)
                snapshot.setdefault('fieldMapping', {})[key] = source.get('tag', source.get('formula', 'reviewed filing table'))
                if value is not None:
                    snapshot['missingFields'] = [x for x in snapshot.get('missingFields', []) if x != key]
                elif key not in snapshot.setdefault('missingFields', []):
                    snapshot['missingFields'].append(key)
            snapshot['guidedRepairNote'] = change['note']
    if cases:
        for company in cases['companies'].values():
            for case in [company, *company.get('bySnapshot', {}).values()]:
                change = evidence.get('casePatches', {}).get(case.get('snapshotId'))
                if change:
                    case.update(copy.deepcopy(change.get('fields', {})))
                    case.setdefault('assumptions', {}).update(copy.deepcopy(change['assumptions']))
                    case.setdefault('rationale', {}).update(copy.deepcopy(change['rationale']))
                    case.setdefault('bridgeEvidence', {}).update(copy.deepcopy(change['evidence']))
    supplement_path = SOURCES / 'bridge-supplement.json'
    if supplement_path.exists():
        apply_bridge_supplement(universe, cases, json.loads(supplement_path.read_text()))
    for ticker, edits in evidence['historyPatches'].items():
        company = history['companies'][ticker]
        if ticker in evidence['openingObservations']:
            company['baseObservation'] = copy.deepcopy(evidence['openingObservations'][ticker])
        rows = ([company['baseObservation']] if company.get('baseObservation') else []) + company['annual']
        for row in rows:
            if row['periodEnd'] in edits:
                row['facts'].update(copy.deepcopy(edits[row['periodEnd']]))
            capital(row)
        refresh_metrics(rows)
        if ticker == 'AVGO':
            first = company['annual'][0]
            for key in ['growth','incrementalBookSalesCapitalProxy','bookROICProxy']:
                first['metrics'][key]['rangeEligible'] = False
                first['metrics'][key]['comparabilityNote'] = 'FY2015 denominator is predecessor Avago before the FY2016 Broadcom acquisition; displayed as reported, excluded from summary ranges.'
        coverage = company.setdefault('coverage', {})
        if isinstance(coverage, dict):
            coverage['openingPeriod'] = company['baseObservation']['period'] if company.get('baseObservation') else None
            coverage['openingPeriodReason'] = None if company.get('baseObservation') else 'No reviewed adjacent opening observation.'
            coverage['metricAvailability'] = {key: {'availableYears': sum(row['metrics'].get(key, {}).get('value') is not None for row in company['annual']), 'rangeYears': sum(row['metrics'].get(key, {}).get('value') is not None and row['metrics'][key].get('rangeEligible', True) for row in company['annual'])} for key in company['annual'][0]['metrics']}
    nbis = history['companies']['NBIS']
    nbis['guidedCoverageReview'] = copy.deepcopy(checks['NBIS']['coverageEvidence'])
    for row in nbis['annual']:
        if row['periodEnd'] == '2023-12-31':
            reason = 'FY2023 balance sheet is disclosed in FY2024 20-F but includes disposed Yandex net assets and predates FY2025 TripleTen recast; comparable current-business book capital is not verified.'
            for key in ['bookEquity','cashAndEquivalents','mappedDebt','bookCapitalProxy']:
                if row['facts'].get(key, {}).get('value') is None:
                    row['facts'].setdefault(key, {})['reason'] = reason
            for key in ['bookSalesCapitalProxy','incrementalBookSalesCapitalProxy','bookROICProxy']:
                if row['metrics'][key]['value'] is None: row['metrics'][key]['reason'] = reason
    if cases:
        import runpy
        runpy.run_path(str(ROOT / 'scripts/apply-guided-resolutions.py'))['apply_resolutions'](universe, cases)
        latest_meta = ROOT / 'scripts/apply-meta-latest.py'
        if latest_meta.exists():
            runpy.run_path(str(latest_meta))['apply_meta_latest'](universe, cases)
        latest_amzn = ROOT / 'scripts/apply-amzn-latest.py'
        if latest_amzn.exists():
            runpy.run_path(str(latest_amzn))['apply_amzn_latest'](universe, cases)
    outputs = [(universe_path, universe),(history_path, history)]
    if cases: outputs.append((cases_path, cases))
    for path, content in outputs:
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
    print('Applied original Guided repairs: AVGO annual debt; META, TSLA, LITE, AVGO history; 14 filing freshness checks.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=ROOT / 'dist/data')
    args = parser.parse_args()
    apply(args.data_dir)
