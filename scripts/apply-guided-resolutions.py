#!/usr/bin/env python3
"""Apply authorized model proxies without changing the underlying filing facts."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'scripts/guided-filing-data/claims-resolution'


def apply_resolutions(universe, cases):
    snapshots = {s['id']: s for c in universe['companies'] for s in c['snapshots']}
    case_map = {c['snapshotId']: c for company in cases['companies'].values()
                for c in [company, *company.get('bySnapshot', {}).values()]}
    definitions = []

    def resolve_notes(s, replacement, all_claims=False):
        # Only blockers addressed by the dated evidence are removed. Archive the
        # exact text so a proxy never masquerades as a newly disclosed fact.
        old = list(s.get('guidedBridgeBlockers', []))
        if all_claims:
            old += [x for x in s.get('fatalBlockers', []) if 'Avride' in x]
        old += ['A cash or debt component is not disclosed for this base. The equity bridge is withheld rather than treating the missing amount as zero.']
        s['resolvedGuidedBlockers'] = list(dict.fromkeys([*s.get('resolvedGuidedBlockers', []), *old]))
        for key in ['hardBlockers', 'fatalBlockers', 'reviewRequired', 'interpretationNotes', 'sourceValuationWarnings', 'guidedBridgeLimitations', 'guidedBridgeBlockers']:
            s[key] = [x for x in s.get(key, []) if x not in old]
        for key in ['reviewRequired', 'interpretationNotes', 'sourceValuationWarnings']:
            s[key] = list(dict.fromkeys([*s[key], replacement]))

    debt = json.loads((SOURCES / 'DEBT_PROXIES.json').read_text())
    for sid, proxy in debt['snapshotPatches'].items():
        if sid not in snapshots:
            continue
        s = snapshots[sid]
        assert s['periodEnd'] == proxy['periodEnd']
        assert s.get('sourceUrl', s.get('sourceURL')) in proxy['sourceUrls']
        assert s['facts'].get('debt') is None  # the reported unknown stays null
        s['debt'] = proxy['modelDebt']
        s['guidedDebtProxy'] = copy.deepcopy(proxy)
        resolve_notes(s, proxy['note'])
        if sid in case_map:
            case_map[sid]['bridgeLimitations'] = [proxy['note']]
            case_map[sid]['bridgePolicy'] = 'Explicit model proxy; reported debt remains unknown.'

    for ticker in ['TSLA', 'NBIS']:
        path = SOURCES / (ticker + '.json')
        if not path.exists():
            continue
        source = json.loads(path.read_text())
        bases = source.get('bases') or [{'definition': d} for d in source['definitions']]
        for base in bases:
            d = copy.deepcopy(base['definition'])
            d['evidenceAsOf'] = source.get('asOf', source.get('cutoff'))
            if ticker == 'NBIS':
                d['type'] = 'resolved-awards'
                d['perimeterVerified'] = source['perimeter']['verified']
                d['fixedClaims'] = d['knownOtherClaimsTotal']
                d['subsidiaryReserve'] = d['avrideReserve']
                d['subsidiaryReserveStress'] = 1000
                d['notes'] = {'en': source['localizationPairs'][0][0], 'zh-Hans': source['localizationPairs'][0][1]}
                d['cautions'] = [x[0] for x in source['localizationPairs']]
                d['operatingReview'] = source['operatingReview']
                for t in d['optionTranches']:
                    t['years'], t['rate'] = t['life'], t['riskFree']
            d.setdefault('description', d['notes']['en'])
            d.setdefault('cautions', [d['notes']['en']])
            for src in d['sources']:
                src.setdefault('title', src.get('id', ticker))
            definitions.append(d)
            for sid in d['snapshotIds']:
                if sid not in snapshots:
                    continue
                s = snapshots[sid]
                assert s['periodEnd'] == d['periodEnd']
                assert s.get('sourceUrl', s.get('sourceURL')) == d['sourceUrl']
                assert s['cash'] == d['cash'] and s['debt'] == d['mappedDebt']
                s['shares'] = d['capturedShares']
                s['guidedClaimsResolutionId'] = d['id']
                s['guidedClaimsResolution'] = {'status': 'explicit-model-proxy', 'periodEnd': d['periodEnd'], 'modelId': d['id'], 'note': d['notes']['en']}
                resolve_notes(s, d['notes']['en'], all_claims=True)
                s['shareBasis'] = f"{ticker} common share; dated ownership allocation with explicit award proxies"
                if sid in case_map:
                    c = case_map[sid]
                    c['assumptions']['otherClaims'] = 0
                    c['rationale']['otherClaims'] = d['notes']['en']
                    c['bridgeEvidence']['otherClaims'] = {'value': 0, 'periodEnd': d['periodEnd'], 'status': 'additional-claims-only-known-claims-in-separate-model', 'sourceUrl': d['sourceUrl'], 'note': d['notes']['en']}
                    c['bridgeLimitations'] = d['cautions']
                    c['bridgePolicy'] = 'Dated ownership model; existing awards and convertible claims allocated once.'
                    if ticker == 'NBIS':
                        c['displayLabel'] = 'Conditional funding stress'
                        c['summary'] = d['notes']['en']
                    if base.get('caseUpdates'):
                        c.update(copy.deepcopy(base['caseUpdates']))
    (ROOT / 'dist/resolved-claims-data.js').write_text('// Generated by scripts/apply-guided-resolutions.py.\nexport const resolvedClaims=' + json.dumps(definitions, ensure_ascii=False, indent=2) + ';\n')
    (ROOT / 'dist/data/guided-resolution-evidence.json').write_text(json.dumps({'debtProxies': debt, 'ownership': definitions}, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    up = ROOT / 'dist/data/current-universe.json'
    cp = ROOT / 'dist/data/company-base-cases.json'
    universe, cases = json.loads(up.read_text()), json.loads(cp.read_text())
    apply_resolutions(universe, cases)
    for path, obj in [(up, universe), (cp, cases)]:
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
