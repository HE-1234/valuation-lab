#!/usr/bin/env python3
"""Add requested companies to Guided without rebuilding existing company records.

Source statements/history remain separate from labelled valuation proxies. This
builder reuses the existing snapshot/history schema and never writes annual
research packages. Reruns replace only records tagged guided-additions-v1.
"""
import copy
import json
import os
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'dist/data'
FILINGS = ROOT / 'scripts/guided-filing-data'
ADDITIONS = FILINGS / 'additions'
ASOF = os.environ.get('GUIDED_CUTOFF', '2026-10-21')
TAG = 'guided-additions-v1'
REQUESTED = ['MA', 'SPGI', 'DUOL', 'RDDT', 'HOOD', 'RKLB', 'NKE', 'CMG', 'CRWD', 'PANW', 'BAM', 'APP', 'COST', 'QCOM', 'ORCL', 'DELL', 'ALAB', 'ADBE', 'SNOW', 'BE']
BASE = runpy.run_path(str(ROOT / 'scripts/build-guided-reviewed-cases.py'))
PAIRS = BASE['pairs']


def read(p):
    return json.loads(p.read_text())


def paired(v, fallback=''):
    if isinstance(v, dict):
        en = v.get('en', fallback)
        zh = v.get('zh-Hans') or v.get('zh')
        if zh and en:
            PAIRS[en] = zh
        return en
    return v or fallback


def extra_pairs(obj):
    if isinstance(obj, dict):
        PAIRS.update(obj.get('localizationPairs', {}))
        for key, value in obj.items():
            if key.endswith('Zh'):
                original = obj.get(key[:-2])
                if isinstance(original, str) and isinstance(value, str):
                    PAIRS[original] = value
                elif isinstance(original, list) and isinstance(value, list):
                    PAIRS.update(zip(original, value))
        if isinstance(obj.get('en'), str):
            paired(obj)
        for key, value in obj.items():
            if key != 'localizationPairs':
                extra_pairs(value)
    elif isinstance(obj, list):
        for value in obj:
            extra_pairs(value)


def model_claims(t, source, meta, kind, raw):
    """Existing awards are allocated at the model price, never market intrinsic."""
    s = source['snapshots'][kind]
    policy = meta.get('claimsPolicy', {})
    policy = policy.get(kind, policy) if isinstance(policy, dict) else {}
    options = s.get('options') or {}
    count = options.get('count') or 0
    tranches = copy.deepcopy(policy.get('optionTranches', []))
    if count and not tranches:
        strike = options.get('weightedExercisePrice')
        if strike is None:
            raise ValueError(f'{t} {kind}: options require a supported strike or explicit allocation proxy')
        tranches = [{'shares': count, 'strike': strike,
                     'years': options.get('weightedRemainingYears') or 5,
                     'volatility': policy.get('volatility', .5), 'rate': policy.get('rate', .04)}]
    src = copy.deepcopy(s)
    src['options'] = {}  # market-quote intrinsic is evidence, not a DCF deduction
    parts, fixed, assets = BASE['claims_of'](src, t)
    if meta.get('investmentsIncludedInEarnings') or meta.get('assetTreatment', {}).get('excludeLongTermInvestmentsFromBridge'):
        assets = 0
    fixed = policy.get('fixedClaims', fixed)
    if not tranches and not policy.get('forceOverlay') and not policy.get('convertibleScenarios'):
        # A very small disclosed option intrinsic amount can be a flagged claim
        # proxy when the filing rounds the option count below display precision.
        if count == 0 and options.get('aggregateIntrinsicValue'):
            fixed += options['aggregateIntrinsicValue']
        return None, fixed, assets
    # Convertible premiums remain in fixed claims unless the source explicitly
    # supplies a separate mutually exclusive conversion model.
    note = BASE['pair'](
        'Existing employee options are allocated once using an all-vesting option-value proxy at the modeled share price. Weighted strikes and disclosed remaining life simplify individual awards; missing life uses five years, volatility 50% and rate 4% are analyst assumptions. Intrinsic-only and free-share scenarios test this uncertainty. Reported market-price intrinsic value is not deducted again.',
        '现有员工期权按模型股价采用假设全部归属的期权价值估算，仅分配一次。加权行权价与披露的剩余期限简化了各项奖励；缺失期限采用五年，50%的波动率和4%的利率为分析假设。仅内在价值及免费股份情景用于测试不确定性。不会再次扣除按市场股价披露的内在价值。')
    definition = {'id': f'{t}-{s["periodEnd"]}-guided-claims-v1', 'type': 'resolved-awards', 'ticker': t,
                  'snapshotIds': [raw['id']], 'periodEnd': s['periodEnd'], 'filedAt': s['filedAt'],
                  'sourceUrl': s['sourceUrl'], 'cash': raw['cash'], 'mappedDebt': raw['debt'],
                  'capturedShares': raw['shares'], 'commonShares': s['sharesOutstanding'],
                  'employeeAwardShares': (s.get('unvestedRSUs') or 0) + (policy.get('additionalAwardShares', 0) if t != 'RKLB' else 0), 'optionTranches': tranches,
                  'fixedClaims': fixed, 'evidenceAsOf': meta.get('reviewedThrough', ASOF), 'description': paired(policy.get('note'), note),
                  'evidencePath': './data/guided-additions-evidence.json',
                  'cautions': [paired(policy.get('note'), note), *([note] if not policy.get('optionTranches') and tranches else []), *[paired(x) for x in policy.get('cautions', [])]],
                  'sources': [{'title': f'{t} · {s["form"]} · {s["periodEnd"]}', 'url': s['sourceUrl']}]}
    raw['guidedClaimsResolutionId'] = definition['id']
    if policy.get('commonEquivalentShares'):
        definition['commonEquivalentShares'] = policy.get('commonEquivalentShares', 0)
    if policy.get('convertibleScenarios'):
        definition['convertibleScenarios'] = policy['convertibleScenarios']
    for key in ['cappedCalls', 'forwardSettlement', 'mandatoryConversion', 'operatingCashReserve']:
        if policy.get(key):
            definition[key] = copy.deepcopy(policy[key])
    if definition.get('mandatoryConversion'):
        mc = definition['mandatoryConversion']
        assert 0 < mc['minimumShares'] <= mc['maximumShares'], (t, kind, 'mandatory share collar')
        assert abs(definition['commonEquivalentShares'] - mc['maximumShares']) < 1e-7
        assert 0 <= mc['dividendPresentValue'] <= mc['undiscountedDividends']
        assert mc['conversionDate'] > s['periodEnd'], (t, kind, 'expired mandatory conversion')
    return definition, 0, assets


def add_owner_history(h):
    """Add separately named owner metrics; preserve every GAAP history fact."""
    values = {str(y['fiscalYear']): y for y in h['modelHistory']['years']}
    previous = None
    metrics = ['ownerRevenueGrowth', 'ownerMargin', 'ownerSalesEquity', 'ownerROE']
    for row in h['annual']:
        y = values.get(row['period'][2:], {})
        for field, key in [('ownerRevenue', 'revenue'), ('ownerPretaxIncome', 'pretaxIncome'),
                           ('ownerNetIncome', 'netIncomeAttributableCommon'), ('commonBookEquity', 'bookCommonEquity')]:
            row['facts'][field] = {'value': y.get(key), 'unit': h['currency'] + ' millions',
                                   'periodEnd': row['periodEnd'], 'filedAt': y.get('filedAt'),
                                   'sourceUrl': y.get('sourceUrl'), 'accession': y.get('accession'),
                                   'locator': y.get('locator'), 'sourceType': 'Separately identified owner-earnings evidence',
                                   'formula': 'Source-identified owner-business metric; see filed reconciliation and locator',
                                   'components': [key], 'sourceUrls': [y['sourceUrl']] if y.get('sourceUrl') else [],
                                   'reason': None if y.get(key) is not None else BASE['pair']('Comparable owner earnings are not separately established for this historical period.', '本历史期间未单独确认可比的股东收益。')}
        prior = previous
        def metric(key, numerator, denominator, formula, fields, prior_period=False, comparable=True):
            usable = BASE['finite'](numerator) and BASE['finite'](denominator) and denominator > 0
            facts = [row['facts'][k] for k in fields]
            if prior_period and prior:
                facts.extend(prior['facts'][k] for k in ['ownerRevenue', 'commonBookEquity'])
            dates = [f.get('filedAt') for f in facts if f.get('filedAt')]
            row['metrics'][key] = {'value': numerator / denominator if usable else None,
                                  'numerator': numerator, 'denominator': denominator, 'formula': formula,
                                  'components': fields, 'sourceUrls': sorted({f['sourceUrl'] for f in facts if f.get('sourceUrl')}),
                                  'availableFrom': max(dates) if dates else None, 'classification': 'proxy',
                                  'rangeEligible': usable and comparable,
                                  'reason': None if usable else BASE['pair']('Comparable owner earnings or positive common equity are unavailable; no capital amount is inferred.', '缺少可比股东收益或正值普通股权益，不会推算资本金额。')}
            if prior_period:
                row['metrics'][key]['priorPeriodEnd'] = prior['periodEnd'] if prior else None
        revenue, profit, equity, ni = (y.get(k) for k in ['revenue', 'pretaxIncome', 'bookCommonEquity', 'netIncomeAttributableCommon'])
        p_revenue = prior['facts']['ownerRevenue']['value'] if prior else None
        p_equity = prior['facts']['commonBookEquity']['value'] if prior else None
        metric('ownerRevenueGrowth', revenue - p_revenue if all(BASE['finite'](v) for v in [revenue, p_revenue]) else None,
               p_revenue, 'Change in model-compatible owner revenue / prior-year owner revenue', ['ownerRevenue'], True)
        metric('ownerMargin', profit, revenue, 'Pretax owner earnings / model-compatible revenue', ['ownerPretaxIncome', 'ownerRevenue'])
        metric('ownerSalesEquity', revenue, equity, 'Model-compatible revenue / ending common book equity', ['ownerRevenue', 'commonBookEquity'], comparable=y.get('capitalComparable', True))
        metric('ownerROE', ni, p_equity, 'Net income attributable to common / prior-year common book equity', ['ownerNetIncome', 'commonBookEquity'], True, y.get('roeComparable', y.get('capitalComparable', True)))
        previous = row
    for key in metrics:
        h['coverage']['metricAvailability'][key] = {'availableYears': sum(BASE['finite'](r['metrics'][key]['value']) for r in h['annual']),
                                                   'rangeYears': sum(r['metrics'][key]['rangeEligible'] for r in h['annual'])}


def main(tickers=None):
    universe, library, history = (read(DATA / p) for p in ['current-universe.json', 'company-base-cases.json', 'company-history.json'])
    ui_path = ADDITIONS / 'UI.json'
    if ui_path.exists():
        extra_pairs(read(ui_path))
    claims, financial, added, metadata = [], [], [], {}
    selected = tickers or REQUESTED
    if tickers:
        # A single-company refresh must not redate or regenerate unrelated
        # source-matched claims, assumptions or financial-company definitions.
        previous = read(DATA / 'guided-additions-evidence.json')
        claims = [d for d in previous.get('claims', []) if d['ticker'] not in selected]
        financial = [d for d in previous.get('financialModels', []) if d['ticker'] not in selected]
        metadata = {t: m for t, m in previous.get('companyResearch', {}).items() if t not in selected}
    for t in selected:
        path, metadata_path = FILINGS / f'{t}.json', ADDITIONS / f'{t}.json'
        if not path.exists() or not metadata_path.exists() or not (FILINGS / 'history' / f'{t}.json').exists():
            if tickers:
                raise ValueError(f'{t}: selected source, metadata and history packages must all exist')
            continue
        existing = next((c for c in universe['companies'] if c['ticker'] == t), None)
        if existing and existing.get('builtBy') != TAG:
            continue
        source, meta = read(path), read(metadata_path)
        reviewed_asof = meta.get('reviewedThrough', ASOF)
        metadata[t] = meta
        extra_pairs(source)
        extra_pairs(meta)
        sources, snapshots, cases = {}, {}, {}
        for kind in ['annual', 'ttm']:
            s = source['snapshots'][kind]
            if kind == 'ttm' and s['periodEnd'] == source['snapshots']['annual']['periodEnd']:
                continue
            raw = BASE['snapshot'](t, source, kind, s)
            raw['builtBy'] = TAG
            if meta.get('debtDefinition'):
                raw['debtDefinition'] = paired(meta['debtDefinition'])
            if meta.get('quoteScope'):
                raw['quoteScope'] = copy.deepcopy(meta['quoteScope'])
            PAIRS[raw['shareBasis']] = BASE['share_basis_zh'](source, s)
            for field, proxy in meta.get('modelProxies', {}).get(kind, {}).items():
                raw.setdefault('guidedModelProxies', {})[field] = copy.deepcopy(proxy)
                raw[field] = proxy['value']
                note = paired(proxy.get('note'))
                raw['reviewRequired'].append(note)
            proxies = meta.get('modelProxies', {}).get(kind, {})
            if any(k in proxies for k in ['debtCurrent', 'debtNoncurrent']):
                raw['debt'] = sum(proxies.get(k, {}).get('value', s.get(k)) for k in ['debtCurrent', 'debtNoncurrent'])
                raw['valuationBlockers'] = [n for n in raw['valuationBlockers'] if not n.startswith('A cash or debt component')]
                raw['reviewRequired'] = [n for n in raw['reviewRequired'] if not n.startswith('A cash or debt component')]
            policy = meta.get('claimsPolicy', {}).get(kind, {})
            raw['shares'] += policy.get('additionalAwardShares', 0) + policy.get('commonEquivalentShares', 0) + policy.get('forwardSettlement', {}).get('shares', 0)
            if any(policy.get(k) for k in ['additionalAwardShares', 'commonEquivalentShares', 'forwardSettlement']):
                raw['guidedModelShares'] = {'reportedCommon': s['sharesOutstanding'], 'reportedOrCarriedEmployeeAwards': s.get('unvestedRSUs'),
                                            'additionalAwards': policy.get('additionalAwardShares', 0), 'commonEquivalentPreferred': policy.get('commonEquivalentShares', 0),
                                            'futureForwardShares': policy.get('forwardSettlement', {}).get('shares', 0), 'allocationShares': raw['shares']}
                raw['shareBasis'] = BASE['pair'](f'{t} common share; modeled allocation includes disclosed employee awards, common-equivalent claims and contracted future shares where applicable',
                                               f'{t}普通股；模型分配包括适用的已披露员工奖励、普通股等价索偿及已签约未来股份')
            if policy.get('note'):
                raw['reviewRequired'].append(paired(policy['note']))
            raw['reviewRequired'].extend(paired(x) for x in meta.get('limitations', []))
            fm = copy.deepcopy(meta.get('financialModels', {}).get(kind))
            if fm:
                # Never automatically rebind an old economic model to a newer
                # filing. A refreshed source needs a matching reviewed model.
                assert fm['periodEnd'] == s['periodEnd'] and fm['sourceUrl'] == s['sourceUrl'], (t, kind, 'stale financial model')
                for model_key, source_key in [('reportedRevenue', 'revenue'), ('reportedOperatingIncome', 'operatingIncome'), ('commonShares', 'sharesOutstanding')]:
                    assert abs(fm[model_key] - s[source_key]) < 1e-7, (t, kind, model_key)
                assert abs(fm['commonShares'] + fm['unvestedAwards'] + fm['dilutionProxyShares'] - fm['modelShareCount']) < 1e-7
                if t == 'HOOD':
                    assert fm['unvestedAwards'] == s['unvestedRSUs']
                for key in ['modelRevenue', 'modelPretaxIncome', 'modelShareCount', 'surplusCash', 'modeledDebt']:
                    assert BASE['finite'](fm[key]), (t, kind, key)
                assert fm['modelRevenue'] > 0 and fm['modelShareCount'] > 0
                fm.update({'id': f'{t}-{s["periodEnd"]}-equity-v1', 'ticker': t, 'currency': source['currency'],
                           'snapshotIds': [raw['id']], 'periodEnd': s['periodEnd'], 'sourceUrl': s['sourceUrl'], 'evidenceAsOf': ASOF,
                           'reportedTuple': {k: raw[k] for k in ['revenue', 'EBIT', 'cash', 'debt', 'shares']},
                           'financingClaim': fm['modeledDebt'], 'allocationShares': fm['modelShareCount'],
                           'shareBasis': BASE['pair'](f'{t} common share; dated shareholder earnings and explicit dilution proxy', f'{t}普通股；注明日期的股东收益与明确标注的稀释估算')})
                raw['financialModelId'] = fm['id']
                raw['reviewRequired'] = [fm['note'], fm['excludedCashDebtNote'], *[paired(x) for x in fm.get('cautions', [])]]
                raw['valuationBlockers'] = [n for n in raw['valuationBlockers'] if not n.startswith(('A cash or debt component', 'Some dilution or convertible values'))]
                financial.append(fm)
                definition, fixed, assets = None, fm['otherClaims'], fm['otherAssets']
            else:
                definition, fixed, assets = model_claims(t, source, meta, kind, raw)
            if definition:
                claims.append(definition)
                raw['reviewRequired'].extend(definition['cautions'])
            assumptions = copy.deepcopy(meta['assumptions'])
            if 'taxRate' in assumptions:
                assumptions['tax'] = assumptions.pop('taxRate')
            assumptions.update(meta.get('assumptionsByBase', {}).get(kind, {}))
            assumptions.update({'otherClaims': fixed, 'otherAssets': assets, 'years': 10})
            rationale_source = meta.get('rationaleByField', meta.get('rationale', {}))
            rationale = {k: paired(v) for k, v in rationale_source.items()} if isinstance(rationale_source, dict) else {}
            for k in assumptions:
                if k not in rationale:
                    rationale[k] = BASE['pair'](
                        f'{t}: {k} = {assumptions[k]:g} is an explicit analyst starting assumption, not a reported future outcome. See the company sources and sensitivities.',
                        f'{t}：{k} = {assumptions[k]:g}为明确标注的分析起始假设，并非已披露的未来结果。请参阅公司来源与敏感性分析。')
            rationale['otherClaims'] = BASE['pair']('Disclosed minority, preferred and other claims are included once. Existing employee options, when present, use the separate dated allocation model.', '已披露的少数权益、优先股及其他索偿仅计入一次。若存在员工期权，则使用独立的注明日期的分配模型。')
            rationale['otherAssets'] = BASE['pair']('Nonoperating investments use the selected filing amount or an explicitly documented omission. Assets whose earnings are already included are not added again.', '非经营性投资采用所选申报金额，或明确说明遗漏。收益已计入模型的资产不会重复加值。')
            src_id = f'guided-addition-{t}-{kind}'
            sources[src_id] = {'title': f'{source["name"]} · {s["form"]} · {s["periodEnd"]}', 'url': s['sourceUrl'], 'publishedAt': s['filedAt'], 'builtBy': TAG}
            source_ids = [src_id]
            for i, item in enumerate(meta.get('sources', [])):
                if isinstance(item, str):
                    item = {'url': item, 'title': f'{t} source {i + 1}'}
                key = f'guided-addition-{t}-context-{i}'
                sources[key] = {**item, 'title': item.get('title') or f'{t} · source {i + 1}', 'publishedAt': item.get('publishedAt') or item.get('filedAt'), 'builtBy': TAG}
                source_ids.append(key)
            summary = paired(meta.get('summary') or meta.get('businessSummary'), f'{source["name"]}: dated filing data with explicit company-specific analyst assumptions.')
            case = {'ticker': t, 'name': source['name'], 'snapshotId': raw['id'], 'asOf': reviewed_asof, 'currency': source['currency'],
                    'summary': summary, 'classification': 'Dated filing evidence with explicit analyst assumptions',
                    'assumptions': assumptions, 'rationale': rationale, 'sourceIds': source_ids, 'builtBy': TAG,
                    'modelLimits': [paired(x) for x in meta.get('limitations', [])], 'bridgeLimitations': raw['reviewRequired'],
                    'reportedAnchors': [{'periodEnd': s['periodEnd'], 'snapshotId': raw['id'], 'sourceIds': [src_id], 'currency': source['currency'], 'revenue': s['revenue'], 'operatingIncome': s['operatingIncome']}]}
            if meta.get('normalizationByBase', {}).get(kind):
                case['normalization'] = meta['normalizationByBase'][kind]
            snapshots[kind], cases[kind] = raw, case
        main_kind = 'ttm' if 'ttm' in cases else 'annual'
        case = cases[main_kind]
        if main_kind == 'ttm':
            case['bySnapshot'] = {cases['annual']['snapshotId']: cases['annual']}
        company = {'ticker': t, 'name': source['name'], 'cik': source['cik'], 'currency': source['currency'],
                   'sector': meta.get('sector', ''), 'modelType': 'equity-cashflow' if meta.get('financialModels') else 'operating-fcff',
                   'currentSnapshotId': snapshots[main_kind]['id'], 'snapshots': list(snapshots.values()),
                   'builtBy': TAG, 'guidedOnlyResearch': True, 'freshnessReview': meta.get('freshness', meta.get('sourceFreshness'))}
        universe['companies'] = [c for c in universe['companies'] if c['ticker'] != t] + [company]
        library['companies'][t] = case
        library['sources'].update(sources)
        h = BASE['history_entry'](t, source, {}, source['currency'])
        BASE['add_capital_history'](t, h, source['currency'])
        history_source = read(FILINGS / 'history' / f'{t}.json')
        for row in h['annual']:
            original = next((r for r in history_source['years'].values() if r.get('periodEnd') == row['periodEnd']), {})
            for key, reason in original.get('metricRangeExclusions', {}).items():
                row['metrics'][key]['rangeEligible'] = False
                row['metrics'][key]['comparabilityNote'] = reason
            row['metricRangeExclusions'] = copy.deepcopy(original.get('metricRangeExclusions', {}))
        for key, coverage in h['coverage']['metricAvailability'].items():
            coverage['rangeYears'] = sum(BASE['finite'](r['metrics'][key]['value']) and r['metrics'][key]['rangeEligible'] for r in h['annual'])
        h['builtBy'] = TAG
        if meta.get('historicalShortfallReason'):
            h['coverage']['shortfallReason'] = meta['historicalShortfallReason']
        h['modelHistory'] = copy.deepcopy(meta.get('financialHistory'))
        if h['modelHistory']:
            add_owner_history(h)
        history['companies'][t] = h
        added.append(t)
    reviewed_latest = max([ASOF, *[m.get('reviewedThrough', ASOF) for m in metadata.values()]])
    universe['asOf'] = max(universe['asOf'], reviewed_latest)
    library['asOf'] = max(library['asOf'], reviewed_latest)
    history['asOf'] = max(history['asOf'], reviewed_latest)
    for name, obj in [('current-universe.json', universe), ('company-base-cases.json', library), ('company-history.json', history)]:
        (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'dist/added-claims-data.js').write_text('// Generated by scripts/build-guided-additions.py.\nexport const addedClaims=' + json.dumps(claims, ensure_ascii=False, indent=2) + ';\n')
    (ROOT / 'dist/financial-model-data.js').write_text('// Generated by scripts/build-guided-additions.py.\nexport const financialModels=' + json.dumps(financial, ensure_ascii=False, indent=2) + ';\n')
    (DATA / 'guided-additions-evidence.json').write_text(json.dumps({'asOf': reviewed_latest, 'claims': claims, 'financialModels': financial, 'companyResearch': metadata}, ensure_ascii=False, indent=2) + '\n')
    dictionary_path = ROOT / 'dist/locales/guided-case-pairs.js'
    content = dictionary_path.read_text()
    pairs = dict(json.loads(content[content.index('export default ') + len('export default '):].strip().rstrip(';')))
    pairs.update(PAIRS)
    dictionary_path.write_text('// Generated Guided English / Simplified Chinese case prose.\nexport default ' + json.dumps(sorted(pairs.items()), ensure_ascii=False, indent=1) + ';\n')
    print('Guided additions:', ', '.join(added))


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tickers', nargs='+', choices=REQUESTED, help='Build only these companies, preserving every other record and dated claims definition')
    main(parser.parse_args().tickers)
