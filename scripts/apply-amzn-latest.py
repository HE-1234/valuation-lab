#!/usr/bin/env python3
"""Select Amazon's Q3-release TTM, with reported facts and carried proxies separate."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/guided-filing-data/originals/AMZN_Q3_UPDATE.json'
SID = 'AMZN-TTM-2026-09-30'
PRIOR = 'AMZN-TTM-2026-06-30'


def apply_amzn_latest(universe, cases):
    d = json.loads(SOURCE.read_text())
    company = next(c for c in universe['companies'] if c['ticker'] == 'AMZN')
    june = next(s for s in company['snapshots'] if s['id'] == PRIOR)
    model = d['provisionalModel']
    pairs = {v['en']: v['zh'] for v in model['copy'].values()}
    copytext = {k: v['en'] for k, v in model['copy'].items()}
    facts = {k: d['ttm'][k] for k in ['revenue', 'operatingIncome', 'netIncome', 'stockBasedCompensation', 'operatingCashFlow']}
    facts.update(capitalExpenditure=d['ttm']['grossCapitalExpenditure'],
                 incomeTaxExpense=d['annual2025']['incomeTaxExpense'] + d['currentYTD']['incomeTaxExpense'] - d['priorYTD']['incomeTaxExpense'],
                 pretaxIncome=d['annual2025']['pretaxIncome'] + d['currentYTD']['pretaxIncome'] - d['priorYTD']['pretaxIncome'],
                 cashAndEquivalents=d['balance']['cashAndEquivalents'],
                 marketableSecuritiesCurrent=d['balance']['marketableSecuritiesCurrent'],
                 longTermDebtNoncurrent=d['balance']['longTermDebtNoncurrent'],
                 periodEndShares=d['balance']['commonSharesOutstanding'],
                 unvestedNonOptionAwards=d['balance']['stockBasedAwardsOutstandingRounded'],
                 shares=d['balance']['commonSharesAndAwardsRounded'],
                 debt=None, longTermDebtCurrent=None, shortTermBorrowings=None,
                 financeLeaseLiabilityTotal=None, financingObligations=None,
                 otherLongTermInvestments=None, researchAndDevelopment=None, dilutedShares=None)
    facts.update(EBIT=facts['operatingIncome'], cash=facts['cashAndEquivalents'] + facts['marketableSecuritiesCurrent'])

    def evidence(locator, unit='USD millions'):
        return {'sourceUrl': d['sourceUrl'], 'periodEnd': d['periodEnd'], 'filedAt': d['publishedAt'],
                'accession': d['accession'], 'sourceType': d['sourceForm'], 'unit': unit,
                'locator': locator, 'originalDocumentVerified': True}

    ev = {}
    flow_keys = ['revenue', 'operatingIncome', 'netIncome', 'operatingCashFlow', 'incomeTaxExpense', 'pretaxIncome']
    for k in flow_keys + ['capitalExpenditure']:
        source_key = 'grossCapitalExpenditure' if k == 'capitalExpenditure' else k
        ev[k] = {**evidence(d['locators']['ttm']), 'formula': 'annual + current YTD - comparable prior YTD',
                 'componentValues': [d['annual2025'][source_key], d['currentYTD'][source_key], d['priorYTD'][source_key]],
                 'sourceUrls': [d['annualSourceUrl'], d['sourceUrl']],
                 'componentPeriods': ['2025-01-01/2025-12-31', '2026-01-01/2026-09-30', '2025-01-01/2025-09-30']}
    for k in facts:
        if k in ev:
            continue
        shares = k in ['shares', 'periodEndShares', 'unvestedNonOptionAwards', 'dilutedShares']
        locator = ('Not separately disclosed for September in this release; no reported value is inferred.'
                   if facts[k] is None else d['locators']['ttm'] if k == 'stockBasedCompensation' else d['locators']['balance'])
        ev[k] = evidence(locator, 'million shares' if shares else 'USD millions')
    ev['EBIT'] = copy.deepcopy(ev['operatingIncome'])
    ev['cash'].update(formula='cash and equivalents + current marketable securities', components=['cashAndEquivalents', 'marketableSecuritiesCurrent'])
    ev['shares'].update(formula='period-end common shares + rounded stock-based awards', components=['periodEndShares', 'unvestedNonOptionAwards'], precision='rounded to million shares in release')
    carried = copy.deepcopy(model['carriedDebtComponents'])
    model_debt = facts['longTermDebtNoncurrent'] + sum(x['value'] for x in carried)
    limits = [copytext[k] for k in ['status', 'debt', 'assets', 'shares', 'forecast']]
    raw = {'id': SID, 'fiscalYear': 2026, 'fiscalLabel': 'Provisional TTM through 2026-09-30',
           'periodStart': '2025-10-01', 'periodEnd': d['periodEnd'], 'fiscalPeriodEnd': d['periodEnd'],
           'snapshotMode': 'ttm', 'filedAt': d['publishedAt'], 'filingDate': d['publishedAt'],
           'acceptedAt': d['acceptedAt'], 'availableFrom': d['acceptedAt'], 'form': 'derived',
           'sourceForm': d['sourceForm'], 'sourceUrl': d['sourceUrl'], 'sourceURL': d['sourceUrl'],
           'accession': d['accession'], 'currency': 'USD', 'reportingCurrency': 'USD', 'quoteCurrency': 'USD',
           'units': {'financials': 'USD millions', 'shares': 'millions'}, 'adrRatio': 1,
           'facts': facts, 'factEvidence': ev, 'missingFields': [k for k, v in facts.items() if v is None],
           'revenue': facts['revenue'], 'EBIT': facts['operatingIncome'], 'cash': facts['cash'],
           'debt': model_debt, 'shares': facts['shares'], 'sharesDate': d['periodEnd'],
           'sharesAsOf': d['periodEnd'], 'coverShareDate': d['periodEnd'],
           'shareBasis': 'AMZN common shares plus disclosed stock-based awards; release counts rounded to millions',
           'cashDefinition': copytext['cash'], 'debtDefinition': copytext['debt'],
           'provisionalEarningsRelease': True, 'provisionalBridge': True, 'backtestEligible': False,
           'rawFilingSha256': d['sourceSha256'], 'builtBy': 'amzn-q3-release-v1',
           'reviewRequired': limits, 'interpretationNotes': limits, 'guidedBridgeLimitations': limits,
           'hardBlockers': [], 'fatalBlockers': [], 'valuationBlockers': [], 'guidedBridgeBlockers': [],
           'guidedDebtProxy': {'status': 'explicit-proxy', 'periodEnd': d['periodEnd'], 'reportedDebt': None,
                               'modelDebt': model_debt, 'note': copytext['debt'], 'proxyComponents': carried},
           'guidedModelProxies': {'otherAssets': copy.deepcopy(model['investmentProxy'])},
           'ttmComponents': {'annualRevenue': d['annual2025']['revenue'], 'ytdRevenue': d['currentYTD']['revenue'],
                             'priorYtdRevenue': d['priorYTD']['revenue'], 'annualOperatingIncome': d['annual2025']['operatingIncome'],
                             'ytdOperatingIncome': d['currentYTD']['operatingIncome'], 'priorYtdOperatingIncome': d['priorYTD']['operatingIncome'],
                             'ytdStart': '2026-01-01', 'ytdEnd': d['periodEnd'], 'priorYtdStart': '2025-01-01', 'priorYtdEnd': '2025-09-30'},
           'latestQuarterFacts': copy.deepcopy(d['quarter']), 'latestQuarterNote': copytext['status']}
    company['snapshots'] = [s for s in company['snapshots'] if s['id'] != SID] + [raw]
    company['currentSnapshotId'] = SID
    company['guidedOnlyResearch'] = True
    company['guidedRefreshCheck'].update(cutoff=d['checkedAsOf'], basesMoved=True)
    company['guidedEarningsUpdate'].update(priorBase=copytext['status'] + ' ' + copytext['debt'] + ' ' + copytext['assets'])
    pairs[company['guidedEarningsUpdate']['priorBase']] = ' '.join(model['copy'][k]['zh'] for k in ['status', 'debt', 'assets'])
    company['latestEarningsRelease'] = copy.deepcopy(d)

    old = cases['companies']['AMZN']
    previous = copy.deepcopy(old.get('bySnapshot', {}).get(PRIOR, old))
    alternatives = copy.deepcopy(old.get('bySnapshot', {}))
    alternatives.update(previous.pop('bySnapshot', {}))
    alternatives[PRIOR] = previous
    new = copy.deepcopy(previous)
    for key in ['economicChecks', 'stressIllustrations', 'bridgeEvidence', 'bridgeComponents']:
        new.pop(key, None)
    new.update(snapshotId=SID, asOf=d['publishedAt'], summary=copytext['summary'],
               classification='Q3 earnings-release TTM with explicit June debt and investment proxies',
               displayLabel='Provisional Q3 research case', bridgePolicy=copytext['status'],
               bridgeLimitations=limits, modelLimits=limits, bySnapshot=alternatives,
               sourceIds=['AMZN-q3-release', 'AMZN-filing', 'AMZN-annual-filing'],
               reportedAnchors=[{'periodEnd': d['periodEnd'], 'publishedAt': d['publishedAt'], 'snapshotId': SID,
                                 'currency': 'USD', 'revenue': facts['revenue'], 'operatingIncome': facts['operatingIncome'],
                                 'operatingMargin': facts['operatingIncome']/facts['revenue'], 'sourceIds': ['AMZN-q3-release']}])
    new['assumptions']['otherAssets'] = model['investmentProxy']['value']
    new['rationale']['otherAssets'] = copytext['assets']
    new['rationale']['targetMargin'] = copytext['margin']
    new['bridgeEvidence'] = {'otherAssets': copy.deepcopy(model['investmentProxy'])}
    new['modelSuitability'] = {'status': 'provisional-release-with-carried-bridge', 'economicallyValidated': False, 'note': copytext['status']}
    cases['companies']['AMZN'] = new
    cases['sources']['AMZN-q3-release'] = {'title': 'Amazon Q3 2026 earnings release · provisional TTM', 'url': d['sourceUrl'], 'publishedAt': d['publishedAt']}
    universe['asOf'] = max(universe['asOf'], d['checkedAsOf'])
    cases['asOf'] = max(cases['asOf'], d['checkedAsOf'])
    dictionary = ROOT / 'dist/locales/guided-case-pairs.js'
    text = dictionary.read_text()
    existing = dict(json.loads(text.split('export default ', 1)[1].strip().rstrip(';')))
    existing.update(pairs)
    dictionary.write_text('// Generated Guided English / Simplified Chinese case prose.\nexport default ' + json.dumps(sorted(existing.items()), ensure_ascii=False, indent=1) + ';\n')


if __name__ == '__main__':
    paths = [ROOT/'dist/data/current-universe.json', ROOT/'dist/data/company-base-cases.json']
    universe, cases = (json.loads(p.read_text()) for p in paths)
    apply_amzn_latest(universe, cases)
    for path, content in zip(paths, [universe, cases]):
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2)+'\n')
    print('AMZN-TTM-2026-09-30 is the selected provisional financial period.')
