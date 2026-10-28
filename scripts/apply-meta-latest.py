#!/usr/bin/env python3
"""Apply the source-dated Meta earnings update after legacy original repairs.

September's release is provisional, not a full 10-Q. Reported values, carried
ownership/lease proxies, EBIT normalization and legal reserves remain separate.
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/guided-filing-data/originals/META_Q3_UPDATE.json'
SID = 'META-TTM-2026-09-30'


def apply_meta_latest(universe, cases):
    if not SOURCE.exists():
        return
    d = json.loads(SOURCE.read_text())
    company = next(c for c in universe['companies'] if c['ticker'] == 'META')
    copytext = {k: v['en'] for k, v in d['copy'].items()}
    company['guidedEarningsUpdate'] = {
        'periodEnd': d['periodEnd'], 'publishedAt': d['publishedAt'],
        'sourceUrl': d['sourceUrl'], **copytext,
        'appliesToSnapshotId': SID if d['enableProvisional'] else None,
        'legalClaimScenarios': d['legalSettlement']['claimScenarios']}
    company.setdefault('guidedRefreshCheck', {})['latestEarningsRelease'] = {
        'periodEnd': d['periodEnd'], 'publishedAt': d['publishedAt'],
        'sourceForm': d['sourceForm'], 'sourceUrl': d['sourceUrl'],
        'fullQuarterlyFilingAvailable': False}
    pairs = dict(d['localizationPairs'])
    pairs.update({v['en']: v['zh'] for v in d['copy'].values()})
    if d['enableProvisional']:
        p = d['proxies']
        facts = {k: v['ttm'] for k, v in d['flows'].items()}
        facts.update(d['balance'])
        facts.update({'EBIT': facts['operatingIncome'],
                      'cash': facts['cashAndEquivalents'] + facts['marketableSecuritiesCurrent'],
                      'debt': None, 'financeLeaseLiabilityTotal': None,
                      'periodEndShares': None, 'unvestedNonOptionAwards': None,
                      'shares': None, 'dilutedShares': None,
                      'operatingLeaseLiabilityTotal': facts['operatingLeaseLiabilityCurrent'] + facts['operatingLeaseLiabilityNoncurrent']})
        evidence = {}
        def ev(locator):
            return {'sourceUrl': d['sourceUrl'], 'periodEnd': d['periodEnd'],
                    'filedAt': d['publishedAt'], 'accession': d['accession'],
                    'unit': 'USD millions', 'sourceType': d['sourceForm'], 'locator': locator,
                    'originalDocumentVerified': True}
        for k, f in d['flows'].items():
            evidence[k] = {**ev(f['locator']), 'formula': 'annual + current YTD - comparable prior YTD',
                           'componentValues': [f['annual'], f['currentYTD'], f['priorYTD']],
                           'sourceUrls': [d['annualSourceUrl'], d['sourceUrl']],
                           'componentPeriods': ['2025-01-01/2025-12-31', '2026-01-01/2026-09-30', '2025-01-01/2025-09-30']}
        for k, locator in d['balanceLocators'].items():
            evidence[k] = ev(locator)
        evidence['EBIT'] = copy.deepcopy(evidence['operatingIncome'])
        for k, components in [('cash', ['cashAndEquivalents', 'marketableSecuritiesCurrent']),
                              ('operatingLeaseLiabilityTotal', ['operatingLeaseLiabilityCurrent', 'operatingLeaseLiabilityNoncurrent'])]:
            evidence[k] = {**ev('Sum of separately reported balance-sheet components'),
                           'formula': ' + '.join(components), 'components': components}
        for k in ['debt', 'financeLeaseLiabilityTotal', 'periodEndShares', 'unvestedNonOptionAwards', 'shares', 'dilutedShares']:
            evidence[k] = ev('Not separately available from the release; model proxies are documented separately. Weighted-average EPS shares are not a dated ownership denominator.')
        model_shares = p['commonShares'] + p['unvestedAwards']
        model_debt = d['balance']['longTermDebtTotal'] + p['financeLeaseDebt']
        debt_proxy = {'status': 'explicit-proxy', 'periodEnd': d['periodEnd'], 'reportedDebt': None,
                      'modelDebt': model_debt, 'note': copytext['debt'],
                      'proxyComponents': [{'component': 'financeLeaseLiability', 'value': p['financeLeaseDebt'],
                                           'sourceDate': p['leaseSourceDate'], 'sourceUrl': p['leaseSourceUrl']}],
                      'sensitivity': {'lowDebt': d['balance']['longTermDebtTotal'],
                                      'baseDebt': model_debt,
                                      'highDebt': d['balance']['longTermDebtTotal'] + 2*p['financeLeaseDebt'],
                                      'perShareChange': p['financeLeaseDebt']/model_shares,
                                      'lowDebtPerShareChange': p['financeLeaseDebt']/model_shares,
                                      'highDebtPerShareChange': -p['financeLeaseDebt']/model_shares,
                                      'classification': 'Zero-to-double carried liability stress, not a factual bound'}}
        limits = [copytext[k] for k in ['status', 'normalization', 'reserve', 'shares', 'debt', 'cash', 'split']]
        raw = {'id': SID, 'fiscalYear': 2026, 'fiscalLabel': 'Provisional TTM through 2026-09-30',
               'snapshotMode': 'ttm', 'periodEnd': d['periodEnd'], 'fiscalPeriodEnd': d['periodEnd'],
               'filedAt': d['publishedAt'], 'filingDate': d['publishedAt'], 'acceptedAt': d['acceptedAt'],
               'availableFrom': d['acceptedAt'], 'sourceUrl': d['sourceUrl'], 'sourceURL': d['sourceUrl'],
               'accession': d['accession'], 'form': 'derived', 'sourceForm': d['sourceForm'],
               'currency': 'USD', 'reportingCurrency': 'USD', 'quoteCurrency': 'USD',
               'units': {'financials': 'USD millions', 'shares': 'millions'},
               'facts': facts, 'factEvidence': evidence, 'missingFields': [k for k, v in facts.items() if v is None],
               'ttmComponents': {'annualRevenue': d['flows']['revenue']['annual'],
                                 'ytdRevenue': d['flows']['revenue']['currentYTD'],
                                 'priorYtdRevenue': d['flows']['revenue']['priorYTD'],
                                 'annualOperatingIncome': d['flows']['operatingIncome']['annual'],
                                 'ytdOperatingIncome': d['flows']['operatingIncome']['currentYTD'],
                                 'priorYtdOperatingIncome': d['flows']['operatingIncome']['priorYTD'],
                                 'ytdStart': '2026-01-01', 'ytdEnd': d['periodEnd'],
                                 'priorYtdStart': '2025-01-01', 'priorYtdEnd': '2025-09-30'},
               'revenue': facts['revenue'], 'EBIT': facts['operatingIncome'], 'cash': facts['cash'],
               'debt': model_debt, 'shares': model_shares, 'sharesDate': p['shareSourceDate'],
               'sharesAsOf': p['shareSourceDate'], 'coverShareDate': p['shareSourceDate'],
               'shareBasis': 'META common share before the planned Class C distribution; June ownership carried as a proxy',
               'guidedDebtProxy': debt_proxy,
               'guidedModelProxies': {'shares': {'value': model_shares, 'commonShares': p['commonShares'],
                                                'unvestedAwards': p['unvestedAwards'], 'sourceDate': p['shareSourceDate'],
                                                'sourceUrl': p['shareSourceUrl'], 'note': copytext['shares']}},
               'cashDefinition': copytext['cash'], 'debtDefinition': copytext['debt'],
               'derivation': copytext['status'], 'provisionalEarningsRelease': True,
               'provisionalBridge': True, 'backtestEligible': False, 'builtBy': 'meta-q3-release-v1',
               'reviewRequired': limits, 'interpretationNotes': limits,
               'hardBlockers': [], 'fatalBlockers': [], 'valuationBlockers': [],
               'legalSettlementEvidence': copy.deepcopy(d['legalSettlement'])}
        company['snapshots'] = [s for s in company['snapshots'] if s['id'] != SID] + [raw]
        company['currentSnapshotId'] = SID
        company['guidedOnlyResearch'] = True
        old = cases['companies']['META']
        prior = old.get('bySnapshot', {}).get('META-TTM-2026-06-30', old)
        prior = copy.deepcopy(prior)
        alternatives = copy.deepcopy(old.get('bySnapshot', {}))
        alternatives.update(copy.deepcopy(prior.pop('bySnapshot', {})))
        alternatives['META-TTM-2026-06-30'] = prior
        # The legacy builder derives annual cases from the current TTM case.
        # A Q3-only legal adjustment must never leak into FY2025 starting EBIT.
        preserved_annual = copy.deepcopy(d['preservedAnnualCase'])
        assert preserved_annual['snapshotId'] == 'META-CURRENT-2025-12-31'
        alternatives[preserved_annual['snapshotId']] = preserved_annual
        new = copy.deepcopy(prior)
        for k in ['economicChecks', 'stressIllustrations', 'bridgeEvidence', 'bridgeComponents', 'normalization', 'bySnapshot']:
            new.pop(k, None)
        new.update({'snapshotId': SID, 'asOf': d['publishedAt'], 'summary': copytext['summary'],
                    'classification': 'Earnings-release inputs with dated balance and ownership proxies',
                    'displayLabel': 'Provisional Q3 research case',
                    'bridgePolicy': copytext['reserve'], 'bridgeLimitations': limits, 'modelLimits': limits,
                    'bySnapshot': alternatives,
                    'normalization': {'normalizationDelta': d['legalSettlement']['quarterCharge'],
                                      'adjustmentReason': copytext['normalization'], 'adjustmentSource': d['sourceUrl']},
                    'sourceIds': ['META-q3-release', 'META-filing', 'META-annual-filing'],
                    'reportedAnchors': [{'periodEnd': d['periodEnd'], 'publishedAt': d['publishedAt'], 'snapshotId': SID,
                                         'currency': 'USD', 'revenue': facts['revenue'], 'operatingIncome': facts['operatingIncome'],
                                         'operatingMargin': facts['operatingIncome']/facts['revenue'], 'sourceIds': ['META-q3-release']}]})
        new['assumptions'].update({'otherClaims': d['legalSettlement']['claimProxy'], 'otherAssets': d['balance']['otherLongTermInvestments']})
        for field, key in [('growth', 'growth'), ('targetMargin', 'margin'), ('salesCapital', 'capital'),
                           ('normalizationDelta', 'normalization'), ('otherClaims', 'reserve')]:
            new['rationale'][field] = copytext[key]
        assets_note = 'Add the release’s $32,624m of nonmarketable equity investments once; current marketable securities are already included in cash.'
        new['rationale']['otherAssets'] = assets_note
        pairs[assets_note] = '公告披露的326.24亿美元非上市股权投资仅加值一次；流动有价证券已计入现金。'
        pairs['Provisional Q3 research case'] = '暂定第三季度研究情景'
        cases['companies']['META'] = new
        cases['sources']['META-q3-release'] = {'title': 'Meta Q3 2026 earnings release · provisional',
                                              'url': d['sourceUrl'], 'publishedAt': d['publishedAt']}
    universe['asOf'] = max(universe['asOf'], d['cutoff'])
    cases['asOf'] = max(cases['asOf'], d['cutoff'])
    dictionary = ROOT / 'dist/locales/guided-case-pairs.js'
    text = dictionary.read_text()
    existing = dict(json.loads(text.split('export default ', 1)[1].strip().rstrip(';')))
    existing.update(pairs)
    dictionary.write_text('// Generated Guided English / Simplified Chinese case prose.\nexport default ' + json.dumps(sorted(existing.items()), ensure_ascii=False, indent=1) + ';\n')


if __name__ == '__main__':
    paths = [ROOT/'dist/data/current-universe.json', ROOT/'dist/data/company-base-cases.json']
    universe, cases = (json.loads(p.read_text()) for p in paths)
    apply_meta_latest(universe, cases)
    for path, content in zip(paths, [universe, cases]):
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2)+'\n')
    print('META latest earnings update applied.')
