#!/usr/bin/env python3
"""Build additive public-safe SNPS v3 research artifacts, without app changes.

Reads only the frozen public whitelist, independent audit artifacts and the verified
catalog record. No network, source execution, raw/private source reads, publication,
current-price comparison, or core/UI edits. All output is deterministic. The default
output root is the directory above scripts/. Integration requires separate approval.
"""
import argparse
import copy
from datetime import date
import hashlib
import html
import json
import math
from pathlib import Path

PACKAGE = 'incremental-SNPS-2026-10-18-v3'
VERSION = '2026-10-18-snps-dated-v3'
DEFAULT_SOURCE = Path('/workspace/shared/atlas-research/company-onboarding/SNPS/public-safe/v3')
DEFAULT_AUDIT = DEFAULT_SOURCE.parents[1] / 'independent-audit-v3'
PINNED = {
 'file-manifest.json': 'e8c08bbbb5766445759cfa145c6c2bb72032700bf705a26ce63196b2cb80bca0',
 'audit-manifest.json': '475f1502e7916e946805d5f611127de4b05ec7bc5a2b9ed76c05d07307585a62',
 'readiness.json': 'a3bcfa18da762931ea2843f2a49b33af8392963df8e57c64c4b140e8a1844819',
 'independent-audit-v3-report.md': '27bcc1b75218f6f5eaad59132a46a701fd7f18e3e797286f341f78d00197983c',
}
ORIGIN = date(2026, 7, 31)
STUB_END = date(2026, 10, 31)


def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(value):
 """Remove local locator keys from frontend data; the public snapshot is untouched."""
 if isinstance(value, list): return [clean(v) for v in value]
 if isinstance(value, dict):
  return {k:clean(v) for k,v in value.items() if k not in ('localPath','localFile','directory','file')}
 return value


def assert_close(actual, expected, tolerance=1e-8):
 assert math.isfinite(actual) and math.isfinite(expected) and abs(actual-expected) <= tolerance, (actual, expected)


def verify_manifest(root, entries):
 assert len({r['file'] for r in entries}) == len(entries)
 for r in entries:
  assert Path(r['file']).name == r['file'], 'Only top-level whitelist entries are allowed'
  p = root / r['file']
  assert not p.is_symlink() and p.is_file(), r['file']
  assert sha(p) == r['sha256'], 'Hash mismatch: '+r['file']
  assert p.stat().st_size == r['bytes'], 'Size mismatch: '+r['file']


def main():
 ap = argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--source',type=Path,default=DEFAULT_SOURCE)
 ap.add_argument('--audit-dir',type=Path,default=DEFAULT_AUDIT)
 ap.add_argument('--output-root',type=Path,default=Path(__file__).resolve().parents[1])
 ap.add_argument('--catalog',type=Path,default=Path('/workspace/shared/valuation-lab/dist/data/atlas-company-catalog-v1.json'))
 args=ap.parse_args(); src=args.source; audit_dir=args.audit_dir
 assert sha(src/'file-manifest.json') == PINNED['file-manifest.json'], 'Source manifest changed'
 assert sha(audit_dir/'audit-manifest.json') == PINNED['audit-manifest.json'], 'Audit manifest changed'
 manifest=json.loads((src/'file-manifest.json').read_text())
 audit_manifest=json.loads((audit_dir/'audit-manifest.json').read_text())
 assert len(manifest)==25 and len(audit_manifest['files'])==11
 verify_manifest(src,manifest); verify_manifest(audit_dir,audit_manifest['files'])
 # Read every public source and audit artifact in full; no private path is followed.
 public_bytes={p.name:p.read_bytes() for p in sorted(src.iterdir()) if p.is_file()}
 audit_bytes={p.name:p.read_bytes() for p in sorted(audit_dir.iterdir()) if p.is_file()}
 assert set(public_bytes)=={r['file'] for r in manifest}|{'file-manifest.json'}
 assert set(audit_bytes)=={r['file'] for r in audit_manifest['files']}|{'audit-manifest.json'}
 load=lambda name:json.loads(public_bytes[name])
 audits={n:json.loads(b) for n,b in audit_bytes.items() if n.endswith('.json')}
 for name in ('readiness.json','independent-audit-v3-report.md'):
  assert sha(audit_dir/name)==PINNED[name]
 audit=audits['readiness.json']; audit_results=audits['audit-results.json']
 assert audit['conditional_dated_research_ready'] is True
 assert audit['mechanical_checks']=={'passed':3319,'total':3319,'failed':0}
 assert len(audits['audit-checks.json'])==3319 and all(r['passed'] is True for r in audits['audit-checks.json'])
 assert all(r['passed'] is True for r in audits['source-hash-verification.json'])
 assert all(r['passed'] is True for r in audits['preservation-verification.json'])
 assert all(audit[k] is False for k in ('unqualified_july_equity_ready','exact_award_allocation_ready','current_target_ready','current_price_comparison_ready','source_completeness_certified','residual_allowance_adequacy_certified','stress_intervals_are_bounds','publication_authorized'))
 values=load('valuation-results.json'); capital=load('capital-claims.json')
 historical=load('history-10fy.json'); compensation=load('compensation-allocation.json')
 research=load('research.json'); ledger=load('source-ledger.json')
 assert len(ledger)==77 and len({r['url'] for r in ledger})==76
 assert research['price_used'] is False
 assert research['common_equity_value'] is None and research['current_price_target'] is None
 assert all(load('validation-report.json')[k]==262 for k in ('passed','total'))
 # Match each public source-ledger record to the independently verified source hash.
 verified_sources={r['source_id']:r for r in audits['source-hash-verification.json']}
 for r in ledger:
  q=verified_sources[r['source_id']]
  assert all(r[k]==q[k] for k in ('url','sha256','bytes'))
 out=args.output_root/'dist/data'/PACKAGE; out.mkdir(parents=True,exist_ok=True)
 def write(name,obj):
  (out/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False,allow_nan=False)+'\n',encoding='utf-8')
 snapshot=out/'public-source-v3'; snapshot.mkdir(exist_ok=True)
 for name,b in public_bytes.items(): (snapshot/name).write_bytes(b)
 for old,new in [('history-10fy.json','SNPS-history-v3.json'),('history-10fy.csv','SNPS-history-v3.csv'),('research-report.md','SNPS-full-research-v3.md'),('valuation_model.py','SNPS-source-model-v3.py')]:
  (out/new).write_bytes(public_bytes[old])
 for old,new in [('readiness.json','SNPS-v3-audit.json'),('independent-audit-v3-report.md','SNPS-independent-audit-v3-report.md'),('precise-corrections.json','SNPS-v3-audit-corrections.json'),('audit-results.json','SNPS-v3-audit-results.json')]:
  (out/new).write_bytes(audit_bytes[old])
 review={
  'status':'independently-cleared-conditional-July-origin-research','reviewDate':'2026-10-18',
  'sourceStatusPreserved':True,
  'laterReviewNote':{
   'en':'The original public v3 files retain their submitted/pending-review wording. The separate October 18 independent audit subsequently gave a qualified pass for explicit conditional July-origin research: 3,319 mechanical checks passed with no headline numeric correction. This does not certify award completeness, residual-claim adequacy, forecast economics, exact July equity, current-price comparison, app integration or publication. SNPS-V3-LABEL-01 is addressed in this consuming schema by labeling the FY2026 reconstructed EBIT as mixed-basis and keeping the fully grant-normalized reference separate; originals remain unchanged.',
   'zh-Hans':'原始公开 v3 文件保留提交时的待复核措辞。另附的 10 月 18 日独立审计随后对明确标注七月基准日的条件性研究给予有保留通过：3,319 项机械检查通过，头条数值无需修正。这不证明奖励库存完整、剩余请求权预算充分或预测经济假设成立，也不批准精确七月股权价值、当前股价比较、应用集成或发布。本消费模式通过将 2026 财年重构 EBIT 明确标为混合口径，并另列全年新授予规范化参考值，落实 SNPS-V3-LABEL-01；原始文件不变。'},
  'verdict':audit['verdict'],'auditSHA256':PINNED['readiness.json'],
  'auditReportSHA256':PINNED['independent-audit-v3-report.md'],
  'auditManifestSHA256':PINNED['audit-manifest.json'],
  'remainingFactualGates':copy.deepcopy(audit['blockers']),
  'nonblockingLabelFinding':copy.deepcopy(audits['precise-corrections.json']['nonblocking_findings'][0])}
 write('SNPS-v3-later-review-note.json',review)
 source={'operating':clean(values),'capital':clean(capital),'compensation':clean(compensation),
  'research':clean(research),'sources':clean(ledger),'historyBasis':historical['basis'],
  'publicExportManifest':manifest,'publicExportManifestSHA256':PINNED['file-manifest.json'],
  'laterIndependentReview':review}
 files={'costOfCapital':'cost-of-capital.json','forecastMethodology':'forecast-methodology.json',
  'productHistory':'product-history.json','acquisitionComparability':'acquisition-comparability.json',
  'managementTrackRecord':'management-track-record.json','terminalReturnReview':'terminal-return-review.json',
  'conditionalAllocationSensitivity':'conditional-allocation-sensitivity.json',
  'futureGrantSensitivity':'future-grant-sensitivity.json','capitalAssumptionSensitivity':'capital-assumption-sensitivity.json',
  'fundingMethodStress':'funding-method-stress.json','sourceSensitivities':'sensitivity.json',
  'ttmBridge':'ttm-bridge.json','originalValidation':'validation-report.json','originalRevisionLog':'revision-log.json'}
 for key,name in files.items(): source[key]=clean(load(name))
 write('SNPS-v3-source.json',source)
 prefix='./data/'+PACKAGE+'/'
 identity={'packageVersion':PACKAGE,'version':VERSION,'ticker':'SNPS','currency':'USD',
  'informationAsOf':'2026-10-18','discountOrigin':'2026-07-31','sourceSHA256':sha(src/'valuation-results.json'),
  'bridgeSourceSHA256':sha(src/'capital-claims.json'),'compensationSourceSHA256':sha(src/'compensation-allocation.json'),
  'sourceLedgerSHA256':sha(src/'source-ledger.json'),'sourceManifestSHA256':PINNED['file-manifest.json'],
  'packagedSourceSHA256':sha(out/'SNPS-v3-source.json'),'auditSHA256':sha(out/'SNPS-v3-audit.json'),
  'historySourceSHA256':sha(src/'history-10fy.json'),'packagedHistorySHA256':sha(out/'SNPS-history-v3.json'),
  'fullReportSHA256':sha(out/'SNPS-full-research-v3.md'),'auditReportSHA256':sha(out/'SNPS-independent-audit-v3-report.md'),
  'allocationSourceSHA256':sha(out/'SNPS-source-model-v3.py'),'laterReviewNoteSHA256':sha(out/'SNPS-v3-later-review-note.json'),
  'auditCorrectionsSHA256':sha(out/'SNPS-v3-audit-corrections.json'),
  'sourcePath':prefix+'SNPS-v3-source.json','auditPath':prefix+'SNPS-v3-audit.json',
  'historyPath':prefix+'SNPS-history-v3.json','historyCSVPath':prefix+'SNPS-history-v3.csv',
  'reportPath':prefix+'SNPS-v3.html','fullReportPath':prefix+'SNPS-full-research-v3.md',
  'auditReportPath':prefix+'SNPS-independent-audit-v3-report.md','allocationSourcePath':prefix+'SNPS-source-model-v3.py',
  'laterReviewNotePath':prefix+'SNPS-v3-later-review-note.json','auditCorrectionsPath':prefix+'SNPS-v3-audit-corrections.json',
  'publicSourceManifestPath':prefix+'public-source-v3/file-manifest.json'}
 prose=make_prose(review)
 def case(name):
  x=values[name]; p=x['parameters']; r=x['rows'][0]
  assert len(x['rows'])==11 and r['period']=='FY2026-Q4' and r['end']=='2026-10-31'
  assert_close(r['years_from_origin'],92/365.25,1e-14)
  assert_close(r['legacy_restructuring_cash'],64.9,1e-12)
  stub={'period':r['period'],'start':'2026-08-01','end':r['end'],'durationDays':92,
   'durationYears':r['years_from_origin'],'sourceYearsFromOrigin':r['years_from_origin'],
   'dayCount':'ACT/365.25','discountOrigin':'2026-07-31','revenue':r['revenue'],
   'operatingMargin':r['economic_margin'],'taxRate':r['cash_tax_rate'],
   'reinvestment':r['net_reinvestment'],'legacyRestructuringCash':r['legacy_restructuring_cash'],
   'wacc':p['wacc'],'fullYearRevenue':x['FY2026_reconstructed_revenue'],
   'sourceScenario':name,'immutable':True,
   'policy':'Selected source Q4 revenue, profit, operating investment, separate legacy restructuring cash, timing and WACC are fixed. Annual-path edits apply to future full years only.',
   'futureNewGrantRate':r['sbc_pct'],'accountingSBCRemoved':r['accounting_sbc_removed'],
   'futureNewGrantCost':r['sbc_expense_embedded_in_ebit'],
   'sbcEconomicExpenseEmbeddedInEBIT':r['sbc_expense_embedded_in_ebit'],
   'preFutureGrantEBIT':r['pre_future_grant_ebit'],
   'illustrativeLegacyAwardAmortization':r['legacy_accounting_recognition_diagnostic'],
   'illustrativeAccountingLikeEBIT':r['accounting_like_ebit_diagnostic'],
   'legacyReversalToEconomicEBIT':r['matched_legacy_reversal'],
   'sourceRow':copy.deepcopy(r)}
  annual=[]; previous_end=STUB_END
  for i,row in enumerate(x['rows'][1:]):
   end=date.fromisoformat(row['end']); duration=(end-previous_end).days/365.25
   assert row['period']=='FY'+str(2027+i) and end==date(2027+i,10,31)
   assert_close(row['years_from_origin'],(end-ORIGIN).days/365.25,1e-14)
   annual.append({'year':i+1,'period':row['period'],'originalSourceYear':2027+i,
    'start':f'{2026+i}-11-01','end':row['end'],'durationDays':(end-previous_end).days,
    'durationYears':duration,'revenue':row['revenue'],'operatingMargin':row['economic_margin'],
    'taxRate':row['cash_tax_rate'],'reinvestment':row['net_reinvestment'],'wacc':p['wacc'],
    'sourceYearsFromOrigin':row['years_from_origin'],'sourceFutureNewGrantRate':row['sbc_pct'],
    'sourceIncrementalROIC':row['incremental_roic'],'sourceKnownInvestmentFloor':row['known_investment_floor'],
    'sourceRow':copy.deepcopy(row)})
   previous_end=end
  assert [r['year'] for r in annual]==list(range(1,11))
  basis='Mixed-basis FY2026 reconstruction: reported nine-month GAAP EBIT plus acquired-intangible amortization, still after actual accounting SBC, plus grant-normalized Q4. Not fully grant-normalized annual EBIT.'
  return {'ticker':'SNPS','company':'Synopsys, Inc.','currency':'USD','scenario':'base',
   'sourceScenario':name,'ratioUnit':'decimal','forecastHorizonYears':10,'incrementalResearch':identity,
   'valuationTiming':{'discountOrigin':'2026-07-31','openingStubYears':92/365.25,
    'openingStubEnd':'2026-10-31','firstAnnualEnd':'2027-10-31','fiscalYearEndMonth':10,'fiscalYearEndDay':31,
    'dayCount':'ACT/365.25','annualEndMonth':10,'annualEndDay':31,
    'convention':'ACT/365.25 exact dated period-end; Q4 stub followed by ten fiscal years ending October 31, 2027–2036'},
   'anchor':{'period':'FY2026','fiscalEnd':'2026-10-31','kind':'mixed_basis_actual_YTD_plus_normalized_Q4_reconstruction',
    'classification':basis,'earningsBasis':basis,'EBITBasis':'reported-nine-months-plus-amortization-and-grant-normalized-Q4',
    'fullyGrantNormalizedAnnualEBIT':False,'revenue':x['FY2026_reconstructed_revenue'],
    'EBIT':x['FY2026_reconstructed_economic_ebit'],'sourceScenario':name,
    'revenueBasis':'Reported nine-month revenue plus selected direct Q4 revenue guidance endpoint; not the rounded full-year management guidance.',
    'fullYearRevenueGuidance':[9690,9740],'managementGuidanceDate':'2026-08-26',
    'YTDActualRevenue':7161.605,'YTDReportedGAAPEBIT':680.963,'YTDAcquiredAmortization':1210.292,
    'YTDAccountingSBC':712.631,'YTDActualEnd':'2026-07-31','selectedQ4Revenue':p['q4_revenue'],
    'firstModeledPeriod':'FY2027','firstModeledPeriodStart':'2026-11-01',
    'fullYearGrantNormalizedReferenceOnly':{'EBIT':x['FY2026_normalized_ebit_reference_only'],
     'sourceField':'FY2026_normalized_ebit_reference_only',
     'classification':'Fully grant-normalized full-year reference only for the all-positive-NOPAT-growth funding stress. No historical cash flow is valued.',
     'usedToValueHistoricalCashFlow':False},
    'sourceField':'FY2026_reconstructed_economic_ebit','auditLabelFinding':'SNPS-V3-LABEL-01',
    'fiscalCalendarCaution':'Source fiscal dates and ACT/365.25 intervals govern discounting. FY2026 is a reconstruction, not a reported actual; the Q4 stub is valued once before FY2027.'},
   'openingStub':stub,'annual':annual,
   'annualFundingPolicy':{'fixedPeriodEnd':'2027-10-31','physicalNetCapex':290,
    'workingCapitalRate':.08,'referenceRevenue':x['FY2026_reconstructed_revenue'],
    'referencePeriod':'FY2026','referenceRevenueBasis':'Reported nine-month revenue plus selected direct Q4 revenue',
    'sourceIncrementalROIC':p['incremental_roic'][0],
    'sourceFY2027IncrementalROIC':p['incremental_roic'][0],
    'sourceFY2027InvestmentFloor':annual[0]['sourceKnownInvestmentFloor'],
    'sourceFY2027Reinvestment':annual[0]['reinvestment'],
    'sourceRule':'max(positive revenue growth × economic margin × (1 − cash-tax rate) / incremental ROIC, 500 − 210 + 8% × positive FY2027 revenue growth)',
    'note':'Source default FY2027 reinvestment exceeds the known investment floor. Consuming integration policy: retain entered investment and expose a separate top-up if it falls below the fixed FY2027 source-policy floor; do not silently overwrite user input.'},
   'terminal':{'growth':p['terminal_g'],'operatingMargin':annual[-1]['operatingMargin'],
    'taxRate':p['cash_tax'],'ROIC':p['terminal_roic'],'wacc':p['wacc']},
   'boundedModelGaps':[prose[k][0] for k in ('scope','funding','claimLimits','history')],
   'sourceOperatingEnterpriseValue':x['operating_enterprise_value_usd_m']}
 base=case('base')
 alternatives=[{'name':n,'label':label,'buttonLabel':button,
  'classification':'Analyst scenario; no assigned probability; conditional July-origin',
  'annualCase':case(n)} for n,label,button in [('down','Downside scenario','Load reviewed downside'),('up','Upside scenario','Load reviewed upside')]]
 def opt(key,label,value,high,stresses,unit='USDm',scale=1):
  return {'key':key,'label':label,'type':'number','default':value,'min':0,'max':high,
   'allowUnknown':True,'unit':unit,'scale':scale,'listedStressValues':stresses,
   'stressClassification':'Analyst listed examples; not verified actual bounds or confidence intervals'}
 assumptions=capital['conditional_assumptions']; defaults=assumptions['base']; stress=assumptions['stress_intervals']
 bridge={'type':'snps-v3','currency':'USD','referenceDate':'2026-07-31','shareDate':'2026-07-31',
  'awardInventorySourceDate':'2025-10-31','assumedAwardReferenceDate':'2025-10-31','assumedAwardInventoryDate':'2026-07-31',
  'sourceUrl':next(s['url'] for s in ledger if s['source_id']=='SNPS-009'),
  'shares':capital['shares']['legal_July31'],'cash':capital['cash']['cash_equivalents'],
  'debt':capital['debt']['total_principal'],'accruedInterest':capital['debt']['accrued_interest_separate'],
  'currentTax':capital['tax']['current_tax_accrual'],
  'marketables':capital['cash']['short_term_investments']+capital['cash']['marketable_equity'],
  'foreignCashFraction':defaults['foreign_fraction_of_excess_cash_assumed'],
  'foreignExcessCashFractionFixed':True,'foreignExcessCashFractionIsAssumption':True,
  'defaultAllocationUnits':defaults['total_allocation_units_m'],
  'options':[
   opt('residualClaimBudget','All-in residual non-operating claim allowance',350,None,stress['residual_allowance']),
   opt('unissuedRSUShares','Assumed unissued maximum-condition RSU units',4.318,None,stress['rsu_max_m'],'million shares'),
   opt('optionFullShares','Assumed option full-share participation',1.154,None,stress['options_m'],'million shares'),
   opt('esppFullShares','Assumed existing ESPP full-share participation',1,None,stress['existing_espp_m'],'million shares'),
   opt('foreignHaircut','Assumed haircut on the fixed 46% foreign excess-cash fraction',.10,1,stress['foreign_cash_haircut'],'%',100),
   opt('operatingCashReserve','Selected opening operating-cash reserve',291.45,3606.286,stress['cash_reserve']),
   opt('marketableRecovery','Assumed liquid marketable-asset recovery',.75,1,stress['marketable_recovery'],'%',100),
   opt('extraFXClaim','Extra FX claim only if unfunded and non-operating',0,None,stress['extra_nonoperating_fx_if_unfunded'])],
  'notes':[prose[k][0] for k in ('claims','assets','awards','profitability','funding','doubleCount')],
  'unresolved':[prose[k][0] for k in ('scope','claimLimits','currentGate')],
  'shareBasis':'July legal common plus explicitly assumed October-2025 unissued award quantities and ESPP; not diluted EPS weighted-average shares',
  'classification':'Conditional July-origin allocation with unverified residual allowance, assumed award inventory and asset recovery',
  'claimCompleteness':'unverified-budget-and-inventory; listed-stresses-not-actual-bounds',
  'currentPriceTargetEligible':False,'currentPriceComparisonEligible':False,'unconditionalEquityValueEligible':False,
  'priceUsed':False,'exerciseProceedsCredit':0,'legacyUnrecognizedCompensationDeduction':0,
  'privateContingentAssetCredit':0,'postOriginASRApplied':False,'legacyRestructuringBridgeDeduction':0,
  'allocationMethod':'one-pool-zero-price-full-share-participation',
  'operatingCashReservePolicy':'fixed selected opening reserve; no dynamic next-year cash policy',
  'nullPolicy':'A null, non-finite, negative or out-of-domain selected input blocks conditional allocation; preserve valid signed operating EV. Never coerce unknown to zero.',
  'equation':'pool = operatingEV + (cash − operatingCashReserve) × (1 − 0.46 × foreignHaircut) + marketables × marketableRecovery − debt − accruedInterest − currentTax − residualClaimBudget − extraFXClaim; units = shares + unissuedRSUShares + optionFullShares + esppFullShares; conditional value = pool / units',
  'sourceConditionalAssumptions':clean(assumptions)}
 catalog=json.loads(args.catalog.read_text()); listing=next(r for r in catalog['companies'] if r['ticker']=='SNPS')
 assert listing['verified'] is True and listing['mic']=='XNAS'
 admission={k:listing[k] for k in ('ticker','nativeTicker','mic','exchange','securityType','verified','checkedAt','sourceURLs','evidence','robinhood')}
 products=source['productHistory']; acquisition_by_year={r['fy']:r for r in source['acquisitionComparability']['history']}
 histories={lens:[r for r in historical['rows'] if r['lens']==lens] for lens in ('as_reported','latest_comparative')}
 for rows in histories.values(): assert [r['fiscal_year'] for r in rows]==list(range(2016,2026))
 latest={r['fiscal_year']:r for r in histories['latest_comparative']}; history=[]
 for row in histories['as_reported']:
  v=row['values']; year=row['fiscal_year']; comparator=latest[year]
  history.append({'fiscalYear':year,'period':'FY'+str(year),'lens':'as_reported',
   'fiscalEnd':row['actual_period_end'],'periodStart':row['actual_period_start'],'days':row['actual_days'],
   'xbrlPresentationStart':row['xbrl_presentation_start'],'xbrlPresentationEnd':row['xbrl_presentation_end'],
   'revenue':v['revenue'],'canonicalOperatingEBIT':v['operating_income'],
   'operatingMargin':v['operating_margin'],'capex':v['capex'],'DA':v['depreciation_amortization'],
   'normalizedValues':copy.deepcopy(v),'provenance':clean(row['provenance']),
   'comparabilityFlags':[row['comparability'],row['split_label']],
   'productRevenueEvidence':{'percent':copy.deepcopy(products['annual_current_period_percent'][str(year)]),
    'basis':products['basis'],'source':products['sources'],'reclassifications':products['reclassifications']},
   'acquisitionComparability':copy.deepcopy(acquisition_by_year[year]),
   'latestComparative':clean(comparator),'sourceRow':copy.deepcopy(row),
   'canonicalEBITPolicy':'as_reported operating_income; no SBC, R&D or acquired-amortization add-back; latest-comparative lens kept separate'})
 sources=clean(ledger)
 for r in sources: r['id']=r['source_id']
 record={'identity':identity,'publicTradability':admission,'annualCase':base,'alternatives':alternatives,
  'bridge':bridge,'history':history,'historySeries':clean(histories),
  'prose':{k:{'en':v[0],'zh-Hans':v[1]} for k,v in prose.items()},
  'sources':sources,'auditResults':audit,'laterIndependentReview':review,
  'sourceSensitivities':{'operating':source['sourceSensitivities'],'conditionalAllocation':source['conditionalAllocationSensitivity'],
   'futureGrants':source['futureGrantSensitivity'],'capitalAssumptions':source['capitalAssumptionSensitivity'],
   'fundingMethod':source['fundingMethodStress']},
  'compensationSensitivity':clean(compensation),'readiness':'reviewed-fiscal-origin-only',
  'historyLimitations':historical['basis'],'unconditionalEquityValue':None,'currentPerShareValue':None,
  'currentPriceTarget':None,'priceUsed':False}
 bundle={'schemaVersion':1,'version':PACKAGE,'asOf':'2026-10-18','companies':[record]}
 write('cases.json',bundle)
 registry=args.output_root/'dist/snps-research-registry.js'
 registry.write_text('// Build-generated public-safe SNPS v3; explicitly conditional July-origin only.\nconst bundle='+json.dumps(bundle,indent=2,ensure_ascii=False,allow_nan=False)+";\nfunction freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}\nexport const snpsRegistry=freeze(bundle);\n",encoding='utf-8')
 checks=verify_adapter(record, values, source, audit)
 checks.update({'sourceManifestEntriesVerified':25,'originalPublicFilesCopiedByteForByte':26,
  'auditManifestEntriesVerified':11,'sourceManifestSHA256':PINNED['file-manifest.json'],
  'auditManifestSHA256':PINNED['audit-manifest.json'],'auditHashesVerified':{k:PINNED[k] for k in ('readiness.json','independent-audit-v3-report.md')},
  'independentMechanicalChecks':3319,'independentSourceHashRecords':77,'independentUniqueSourceURLs':76,
  'rawSourceHashScope':'The independent audit verified 77 archived source records. This public-only builder verifies its pinned audit manifest and every audit artifact, matches the public ledger to that verified hash inventory, and does not open or export raw/private captures.',
  'sourceStatusUnmodified':True,'historyYears':10,'historyLenses':2,'historyRowsPreserved':20,
  'canonicalHistoryEBIT':'as_reported operating_income; latest comparative separate; zero SBC/R&D/amortization add-back',
  'historicalNullsPreserved':sum(v is None for r in historical['rows'] for v in r['values'].values()),
  'annualFullYearsPerCase':10,'annualNumbering':'1–10, FY2027–FY2036','openingStubYears':92/365.25,
  'openingStubPolicy':'fixed selected source Q4, separate 64.9 restructuring cash, exact ACT/365.25 and WACC',
  'anchorLabelFindingClosedInConsumingSchema':'SNPS-V3-LABEL-01',
  'currentPriceComparisonEligible':False,'unconditionalEquityValueEligible':False})
 write('SNPS-v3-build-checks.json',checks)
 render_html(out,record,values,source)
 # Verify every preserved byte after output, then hash all generated files.
 for name,b in public_bytes.items(): assert (snapshot/name).read_bytes()==b
 for row in history:
  original=next(r for r in historical['rows'] if r['fiscal_year']==row['fiscalYear'] and r['lens']=='as_reported')
  assert row['sourceRow']==original and row['normalizedValues']==original['values']
 output_manifest={'packageVersion':PACKAGE,'files':[{'file':str(p.relative_to(out)),
  'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(out.rglob('*'))
  if p.is_file() and p.name!='SNPS-v3-package-manifest.json'],
  'registry':{'file':'dist/snps-research-registry.js','sha256':sha(registry),'bytes':registry.stat().st_size},
  'builder':{'file':'scripts/build-snps-incremental.py','sha256':sha(Path(__file__)),'bytes':Path(__file__).stat().st_size}}
 write('SNPS-v3-package-manifest.json',output_manifest)
 print(json.dumps({'package':str(out),'registry':str(registry),'checks':checks},indent=2))


def allocate_checked(ev, bridge, selected):
 """Read-only verification reference; production bridge implementation is separate."""
 if not isinstance(ev,(int,float)) or isinstance(ev,bool) or not math.isfinite(ev): return None
 for o in bridge['options']:
  v=selected.get(o['key'])
  if not isinstance(v,(int,float)) or isinstance(v,bool) or not math.isfinite(v): return None
  if v<o['min'] or (o['max'] is not None and v>o['max']): return None
 units=bridge['shares']+selected['unissuedRSUShares']+selected['optionFullShares']+selected['esppFullShares']
 pool=ev+(bridge['cash']-selected['operatingCashReserve'])*(1-bridge['foreignCashFraction']*selected['foreignHaircut'])+bridge['marketables']*selected['marketableRecovery']-bridge['debt']-bridge['accruedInterest']-bridge['currentTax']-selected['residualClaimBudget']-selected['extraFXClaim']
 return {'pool':pool,'allocationUnits':units,'conditionalPerShare':pool/units}


def verify_adapter(record,values,source,audit):
 b=record['bridge']; selected={o['key']:o['default'] for o in b['options']}; results={}
 cases={'base':record['annualCase'],**{a['name']:a['annualCase'] for a in record['alternatives']}}
 for name,c in cases.items():
  s=c['openingStub']; discount=(1+s['wacc'])**s['durationYears']
  fcff=s['revenue']*s['operatingMargin']*(1-s['taxRate'])-s['reinvestment']-s['legacyRestructuringCash']
  assert_close(fcff,s['sourceRow']['fcff']); ev=fcff/discount
  for r in c['annual']:
   discount*=(1+r['wacc'])**r['durationYears']
   fcff=r['revenue']*r['operatingMargin']*(1-r['taxRate'])-r['reinvestment']
   assert_close(fcff,r['sourceRow']['fcff']); assert_close(1/discount,r['sourceRow']['discount_factor'],1e-12)
   ev+=fcff/discount
   assert_close(r['sourceRow']['legacy_accounting_recognition_diagnostic'],r['sourceRow']['matched_legacy_reversal'])
  t=c['terminal']; nopat=c['annual'][-1]['revenue']*(1+t['growth'])*t['operatingMargin']*(1-t['taxRate'])
  ev+=nopat*(1-t['growth']/t['ROIC'])/(t['wacc']-t['growth'])/discount
  assert_close(ev,values[name]['operating_enterprise_value_usd_m']); a=allocate_checked(ev,b,selected)
  assert_close(a['conditionalPerShare'],audit['headline'][name]['conditional_usd_per_share'],1e-10)
  assert_close(a['allocationUnits'],198.077,1e-12)
  assert c['annualFundingPolicy']['sourceFY2027Reinvestment']>c['annualFundingPolicy']['sourceFY2027InvestmentFloor']
  assert_close(c['anchor']['revenue'],c['anchor']['YTDActualRevenue']+s['revenue'])
  assert_close(c['anchor']['EBIT'],680.963+1210.292+s['sourceRow']['economic_ebit'])
  assert c['anchor']['fullyGrantNormalizedAnnualEBIT'] is False
  results[name]={'operatingEV':ev,**a,'sourceReproduced':True}
 capital_count=0
 mapping={'options':'optionFullShares','espp':'esppFullShares','foreign_haircut':'foreignHaircut',
  'cash_reserve':'operatingCashReserve','marketable_recovery':'marketableRecovery','extra_fx_claim':'extraFXClaim'}
 for r in source['capitalAssumptionSensitivity']:
  a=allocate_checked(values['base']['operating_enterprise_value_usd_m'],b,{**selected,mapping[r['parameter']]:r['assumption']})
  assert_close(a['conditionalPerShare'],r['conditional_usd_per_share'],1e-10);capital_count+=1
 allocation_count=0
 for r in source['conditionalAllocationSensitivity']:
  a=allocate_checked(values[r['case']]['operating_enterprise_value_usd_m'],b,{**selected,'residualClaimBudget':r['residual_allowance'],'unissuedRSUShares':r['rsu_assumption_m']})
  assert_close(a['conditionalPerShare'],r['conditional_usd_per_share'],1e-10);allocation_count+=1
 null_checks=0
 for o in b['options']:
  for v in (None,-1,float('nan'),float('inf'),True,''):
   assert allocate_checked(1,b,{**selected,o['key']:v}) is None;null_checks+=1
  if o['max'] is not None:
   assert allocate_checked(1,b,{**selected,o['key']:o['max']+1}) is None;null_checks+=1
  else: assert allocate_checked(1,b,{**selected,o['key']:1e12}) is not None
 assert allocate_checked(-1,b,selected)['pool']<0
 return {'conditionalAllocationChecks':results,'capitalSensitivityRowsReproduced':capital_count,
  'conditionalAllocationSensitivityRowsReproduced':allocation_count,
  'invalidUnknownDomainChecks':null_checks,'negativeSignedEVPreserved':True,
  'claimAndShareInputsHaveNoFiniteMaximum':True,'fixedAssumedForeignExcessCashFraction':.46,
  'mixedBasisAnchorRetainedAndLabeled':True,'fullYearNormalizedReferenceSeparate':True}


def make_prose(review):
 return {
 'scope':('Conditional July-origin research: financial and discount origin July 31, 2026; information cutoff October 18, 2026. Later guidance and October opportunity-cost inputs are used retrospectively. These are conditional allocations, with no verified exact July equity value, current target, market-price comparison, bounds or probabilities.',
 '七月基准日条件性研究：财务及折现基准日为 2026 年 7 月 31 日，信息截至 2026 年 10 月 18 日。较后指引与十月机会成本输入被回溯使用。结果属于条件性分配，不是经验证的精确七月股权价值、当前目标价、市场价格比较、边界或概率。'),
 'summary':('Synopsys combines Design Automation, including EDA and Ansys simulation, with Design IP. Its thesis depends on acquisition integration, IP recovery and profitable commercialization of AI and royalty opportunities. Management targets and partnerships are expectations, not separately proved contracted AI revenue or immediate cash.',
 'Synopsys 将包含 EDA 和 Ansys 仿真的设计自动化业务与设计 IP 相结合。研究逻辑依赖收购整合、IP 复苏，以及 AI 与版税机会实现有利润的商业化。管理层目标与合作公告属于预期，并非另行证实的 AI 合同收入或即时现金。'),
 'businessEvidence':('The Q3 product percentages and segment profit measures have different scopes. The disclosed 82% recurring-revenue measure is not ARR. Of $10.9 billion backlog, $1.9 billion flexible-spending commitments are excluded before applying the 49% next-12-month recognition rate: the derived amount is $4.41 billion. The FY2026 $60 million Ansys channel gross-up changes revenue presentation without profit or cash benefit.',
 '第三季度产品比例与分部利润指标口径不同。披露的 82% 经常性收入比例不是 ARR。109 亿美元积压订单中先排除 19 亿美元灵活消费承诺，再对其余部分应用未来十二个月 49% 确认率，推得 44.1 亿美元。2026 财年 Ansys 渠道 6,000 万美元总额列报增加收入，但不增加利润或现金。'),
 'growth':('Each FY2026 anchor uses reported nine-month revenue of $7,161.605 million plus its own direct Q4 revenue: $2,530/$2,555/$2,580 million. Reconstructed annual revenue is $9,691.605/$9,716.605/$9,741.605 million. These differ from rounded August full-year guidance of $9,690–9,740 million. FY2027 source revenues are $10,600/$11,150/$11,200 million, followed by nine additional years ending October 31, 2036. Named paths are analyst judgments without probabilities.',
 '各 2026 财年锚点采用前九个月报告收入 71.61605 亿美元，加对应第四季度收入 25.30／25.55／25.80 亿美元，得全年重构收入 96.91605／97.16605／97.41605 亿美元。这与八月四舍五入的全年指引 96.90–97.40 亿美元不同。2027 财年来源收入为 106.00／111.50／112.00 亿美元，再延续九年，至 2036 年 10 月 31 日。命名路径属于无概率的分析判断。'),
 'anchorBasis':('The exposed FY2026 EBIT anchor is a mixed-basis reconstruction: reported nine-month GAAP EBIT $680.963 million plus acquired amortization $1,210.292 million, still after actual accounting SBC, plus grant-normalized Q4. The resulting $2,386.755/$2,514.655/$2,618.255 million is not fully normalized annual EBIT. The separate fully grant-normalized reference is $2,025.145250/$2,367.893400/$2,614.725500 million and is used only in the alternative all-positive-NOPAT-growth funding diagnostic. No past cash flow is revalued.',
 '显示的 2026 财年 EBIT 锚点采用混合口径：前九个月报告 GAAP EBIT 6.80963 亿美元，加收购摊销 12.10292 亿美元，仍保留实际会计股份薪酬，再加第四季度新授予规范化 EBIT。所得 23.86755／25.14655／26.18255 亿美元不是完全规范化全年 EBIT。另列全年新授予规范化参考值 20.25145250／23.67893400／26.14725500 亿美元，仅用于全部正向 NOPAT 增长再投资压力诊断，不重估过去现金流。'),
 'profitability':('Future new grants remain economic labor expense at 15%/12%/10% of revenue in downside/base/upside. Q4 removes selected accounting SBC of $240/$235/$230 million and replaces it with that new-grant charge. Base Q4 EBIT is $623.4 million; base FY2027 EBIT is $3,492 million. R&D, restructuring and integration remain costs. Functional R&D and grant displays overlap and must not be summed or deducted twice. Future grants are not also added to allocation units.',
 '下行／基准／上行情景将未来新授予按收入 15%／12%／10% 保留为经济劳动成本。第四季度移除所选会计股份薪酬 2.40／2.35／2.30 亿美元，再用新授予费用替代。基准第四季度 EBIT 为 6.234 亿美元，2027 财年为 34.92 亿美元。研发、重组及整合仍为成本。研发与授予的功能分类存在重叠，不可重复相加或扣除。未来授予也不再增加分配单位。'),
 'funding':('The fixed selected Q4 stub runs from the July 31 origin to October 31, 2026: 92/365.25 years under ACT/365.25. Its operating investment, separate $64.9 million legacy restructuring cash payment, source WACC and full-FY2026 revenue reference are retained. Ten annual rows follow, FY2027–2036, using actual October 31 dates and 365/366-day intervals. Source stubs are selected atomically with each named case and remain fixed during future-year edits or stresses. Do not fold the $64.9 million payment into operating investment or deduct it again in the bridge.',
 '所选固定第四季度短期段从七月三十一日基准日至 2026 年十月三十一日，按 ACT/365.25 为 92/365.25 年。保留经营投资、单独 6,490 万美元既有重组现金支付、来源 WACC 及对应 2026 全年收入参考。随后十个年度为 2027–2036 财年，按真实十月三十一日期末及 365／366 天间隔折现。切换命名情景时同步选择短期段；未来年度编辑或压力测试不改变它。不得将 6,490 万美元并入经营投资或在资本桥再次扣除。'),
 'capital':('Q4 investment is capex $68.911 million less ordinary D&A $50.576333 million plus 8% of positive sequential revenue growth. Base Q4 operating investment is $24.588907 million before the separate $64.9 million payment. Annual investment funds positive revenue growth at the economic after-tax margin divided by declining source incremental returns. FY2027 also has a known floor: $500 million capex − $210 million D&A + 8% of positive full-year revenue growth. Base investment $682.353 million exceeds its $404.672 million floor. The full-positive-NOPAT-growth stress is preserved separately. Acquisitions closed before July are already funded.',
 '第四季度投资为资本开支 6,891.1 万美元，减普通折旧摊销 5,057.6333 万美元，加正向环比收入增长的 8%。基准经营投资为 2,458.8907 万美元，另付 6,490 万美元。年度投资按正向收入增长乘经济税后利润率，再除以逐步下降的来源增量回报率。2027 财年还设已知下限：5 亿美元资本开支减 2.1 亿美元折旧摊销，加正向全年收入增长的 8%。基准投资 6.82353 亿美元高于 4.04672 亿美元下限。全部正向 NOPAT 增长压力测试单独保留。七月前已完成收购的资金已计入。'),
 'wacc':('Nominal USD source WACC is 12%/10.5%/9.5% in downside/base/upside. October Treasury, ERP and industry inputs support an analyst construction, not a July contemporaneous observed rate or a price-implied fit. The base calculation is 10.03368%, rounded to a selected 10.5%. The source all-period WACC grid also changes Q4; it is separate evidence from fixed-Q4 future-year stresses.',
 '下行／基准／上行来源名义美元 WACC 为 12%／10.5%／9.5%。十月国债、股票风险溢价及行业输入支持分析假设，并非七月当时观测利率或股价拟合。基准计算为 10.03368%，所选值为 10.5%。来源全期间 WACC 网格也改变第四季度，须与固定第四季度的未来年度压力分析区分。'),
 'tax':('Operating cash-tax assumptions are 28%/24%/21%. The opening $88.454 million current-tax accrual is deducted once in the bridge; noncash working-capital investment excludes income tax, and forward cash taxes fund post-origin earnings. No separate legacy-vesting tax windfall, full deferred-tax-asset credit or mechanical deferred-tax-liability deduction is added.',
 '经营现金税假设为 28%／24%／21%。期初应计当期税款 8,845.4 万美元仅在资本桥扣除一次；非现金营运资本投资排除所得税，未来现金税为基准日后收益提供资金。不另加旧奖励归属税收收益，不全额加回递延税资产，也不机械扣除递延税负债。'),
 'terminal':('Terminal growth is 2%/2.5%/3% and terminal incremental ROIC is 8%/12%/15%. Terminal investment is NOPAT × growth / ROIC and reflects retained future-grant costs. Downside return is below its 12% capital cost. The acquisition-inclusive opening capital diagnostic is $37,945.609 million; neither historical asset-light returns nor removal of goodwill proves terminal assumptions. These are scenario judgments, not independently demonstrated capacity economics.',
 '终值增长率为 2%／2.5%／3%，终值增量 ROIC 为 8%／12%／15%。终值投资为 NOPAT×增长率／ROIC，保留未来授予费用。下行回报率低于 12% 资本成本。含收购的期初资本诊断为 379.45609 亿美元；历史轻资产回报或剔除商誉均不能证明终值假设。这些是情景判断，并非独立证明的产能经济关系。'),
 'claims':('Deduct reported July principal $10,110.449 million, accrued interest $170.462 million, current-tax accrual $88.454 million and one additional $350 million residual allowance. The allowance comprises $200/$75/$75 million analytical budgets; historical uncertain-tax and other-liability references overlap within it and are not extra deductions. Adequacy, overlap mapping and a finite maximum remain unverified.',
 '扣除七月报告本金 101.10449 亿美元、应计利息 1.70462 亿美元、应计当期税款 8,845.4 万美元，另扣一次 3.5 亿美元剩余预算。预算由 2 亿／7,500 万／7,500 万美元分析分项组成；历史不确定税项及其他负债参考在其中重叠，不再额外扣除。充分性、重叠映射及有限上限均未经验证。'),
 'assets':('Cash $3,606.286 million less the $291.450 million operating reserve gives $3,314.836 million excess cash. A fixed, assumed 46% foreign share and 10% haircut leave $3,162.353544 million credit. The 46% extension to excess cash is assumed, and the haircut is not a reported tax bill. Apply 75% recovery to $2.067 million liquid investments; private/contingent asset credit remains zero. Restricted cash $4.490 million is excluded. Selected reserve cannot exceed cash; recovery and haircut are fractions in [0,1].',
 '现金 36.06286 亿美元减 2.91450 亿美元经营储备，剩余 33.14836 亿美元。固定假设其中 46% 在境外，对该部分打 10% 折扣后，现金信用为 31.62353544 亿美元。将 46% 延伸至超额现金属于假设，折扣并非报告税单。对 206.7 万美元流动投资采用 75% 回收率；私人及或有资产信用为零。受限现金 449 万美元排除。所选储备不得超过现金；回收率及折扣介于 0 与 1。'),
 'awards':('Reported July legal common is 191.605 million. Assume 4.318 million unissued maximum-condition RSUs, 1.154 million options and 1.000 million existing ESPP units, giving 198.077 million units. The RSU/option source date is October 31, 2025; persistence to July is assumed. The 0.153765 million proxy/annual-table difference remains unresolved and is not added as a cohort. Already-converted Ansys awards and issued directors’ restricted stock are not counted twice. Option/ESPP full-unit participation with no exercise proceeds is an allocation convention, not instrument fair value or proof of overall conservatism.',
 '七月报告法定普通股为 1.91605 亿股。假设未发行最高业绩条件 RSU 431.8 万单位、期权 115.4 万单位及现有 ESPP 100 万单位，共 1.98077 亿分配单位。RSU／期权来源日期为 2025 年 10 月 31 日，假设其延续至七月。委托书与年报表格 15.3765 万单位差额仍未调节，不当作额外队列加入。已转换 Ansys 奖励及董事已发行限制性股票不重复计数。期权／ESPP 完整单位参与且不计行权收入属于分配惯例，不是工具公允价值，也不能证明整体保守。'),
 'doubleCount':('Legacy $1,400 million award and $105.6 million ESPP accounting recognition is subtracted and reversed identically, with zero valuation effect. Debt includes the $99.526 million treasury-lock settlement once. Matched $471.484 million deferred-compensation assets/liabilities are excluded together; leases remain operating costs. Pre-origin NVIDIA financing, acquisitions and dispositions are already in July balances. The $64.9 million restructuring cash payment is in Q4 once. Ordinary operating accruals are not additional claims. The extra FX stress applies only to an unfunded non-operating claim.',
 '既有 14 亿美元奖励及 1.056 亿美元 ESPP 会计确认额等额扣除并转回，估值影响为零。债务已包括 9,952.6 万美元国债锁定结算一次。配对的 4.71484 亿美元递延薪酬资产及负债一起排除；租赁仍是经营成本。基准日前 NVIDIA 融资、收购及处置已在七月余额中。6,490 万美元重组现金仅在第四季度支付一次。普通经营应计项不作为额外请求权。额外外汇压力项仅适用于未获得资金覆盖的非经营请求权。'),
 'claimLimits':('The $200/$350/$700 million allowance stresses and all listed award/asset stresses are examples, not verified bounds or confidence intervals. Claim amounts and assumed award quantities have no verified finite maximum. Null means unknown and must block conditional allocation while valid signed operating EV remains available; it is never zero. Unknown litigation can exceed every listed stress. Arithmetic passing does not certify inventory completeness or allowance adequacy.',
 '2 亿／3.5 亿／7 亿美元预算压力值及所有奖励、资产压力值均为示例，不是经验证边界或置信区间。请求权金额与假设奖励数量没有经验证的有限上限。空值代表未知，应阻止条件性分配，但保留有效且有正负符号的经营企业价值；绝不将空值当零。未知诉讼可超过所有列示压力值。算术通过不证明库存完整或预算充分。'),
 'history':('FY2016–2025 preserves separate as-reported and latest-comparative series with field-level provenance. Canonical EBIT is as-reported operating_income with no add-back. CFO and SBC can include discontinued operations while P&L is continuing. FY2018/FY2024 have 53 weeks, FY2025 has 363 days, ASC606 begins FY2019, Software Integrity was divested, and Ansys enters July 17, 2025. Product reclassifications, conflicting FY2024 capex vintages and varying intangible-amortization tag scopes remain visible. Nulls are unknown. No continuous organic or same-perimeter ten-year series is invented.',
 '2016–2025 财年保留分开的原始报告与最新比较口径，并附逐字段来源。规范 EBIT 使用原始报告 operating_income，不作加回。经营现金流及股份薪酬可包含已终止业务，而损益表为持续业务。2018／2024 财年为 53 周，2025 财年为 363 天，2019 财年采用 ASC606，Software Integrity 已出售，Ansys 自 2025 年 7 月 17 日纳入。产品重分类、2024 年资本开支版本冲突及无形资产摊销标签口径变化均保留。空值为未知。不编造十年连续有机或同范围序列。'),
 'management':('The scorecard covers three completed fiscal years plus quarterly and FY2026/FY2027 guidance vintages, not a ten-year forecasting hit rate. FY2024 must be compared with its continuing-operations reset, while FY2025 combined revenue cannot be called a beat of the original ex-Ansys plan. Q2 FY2026 revenue includes a gross-up; Q3 GAAP EPS includes a disposal gain. Initial, reset and latest guidance remain separate.',
 '指引记录覆盖三个已完成财年及季度、2026／2027 财年各版指引，不是十年预测命中率。2024 年应与持续经营调整后的指引比较；2025 年合并收入不能称为超过原先不含 Ansys 的计划。2026 年第二季度收入包含总额列报，第三季度 GAAP EPS 包含处置收益。最初、重设及最新指引分别保留。'),
 'currentGate':('The October 5 $1 billion accelerated repurchase, expected initial 1.735 million shares and residual forward are entirely excluded from July cash, shares and operating FCFF. Current-date use requires actual payment/delivery/settlement and all intervening cash, debt, award, share and claim movements. Exact/current equity and price fields remain null; price-used is false.',
 '10 月 5 日 10 亿美元加速回购、预期初始 173.5 万股及剩余远期全部排除于七月现金、股数及经营 FCFF。当前日期使用需要实际付款、交付、结算，以及期间所有现金、债务、奖励、股数与请求权变动。精确／当前股权及价格字段维持空值，价格使用标记为假。'),
 'uncertainty':('Downside/base/upside are named analyst scenarios with no assigned probability, calibration, confidence level or verified bounds. Any Monte Carlo distributions are user-selected assumptions and should start fixed, with manual execution. Keep the selected source Q4 cash flows, separate restructuring payment, exact timing and WACC fixed; only future annual paths vary. The source sensitivity files remain separately labeled evidence. Exact dated claims, award inventory and current-date roll-forward remain factual gates.',
 '下行／基准／上行是命名分析情景，不赋予概率、校准、置信度或经验证边界。任何蒙特卡洛分布均为用户选择的假设，应以固定值开始并手动执行。保持所选来源第四季度现金流、单列重组支付、精确时点及 WACC 不变，仅改变未来年度路径。来源压力测试文件仍是单独标注的证据。精确日期请求权、奖励库存与当前日期滚动桥仍是事实门槛。'),
 'review':(review['laterReviewNote']['en'],review['laterReviewNote']['zh-Hans'])}


def render_html(out,record,values,source):
 e=lambda value:html.escape(str(value),quote=True)
 def num(value,d=3): return 'Unknown / 未知' if value is None else f'{value:,.{d}f}'
 def jdump(value): return e(json.dumps(value,ensure_ascii=False,indent=2))
 identity=record['identity']
 titles={
  'scope':('Conditional scope','条件性范围'),'summary':('Business and thesis','业务与研究逻辑'),
  'businessEvidence':('Revenue, backlog and presentation','收入、积压订单与列报'),
  'growth':('Scenario-specific full-year revenue anchors','各情景全年收入锚点'),
  'anchorBasis':('Mixed-basis EBIT and separate normalized reference','混合口径 EBIT 与独立规范化参考'),
  'profitability':('Economic future-grant costs','未来新授予经济成本'),
  'funding':('Fixed Q4, exact dates and ten full years','固定第四季度、精确日期及十个完整年度'),
  'capital':('Reinvestment and funding floors','再投资与资金下限'),'wacc':('Discount inputs','折现输入'),
  'tax':('Cash-tax scope','现金税口径'),'terminal':('Funded terminal value','有再投资支持的终值'),
  'claims':('Residual allowance and known claims','剩余预算与已知请求权'),
  'assets':('Conditional asset recoveries','条件性资产回收'),
  'awards':('Dated assumed award participation','有日期的假设奖励参与'),
  'doubleCount':('No duplicate claims or grant benefit','避免重复请求权或授予收益'),
  'claimLimits':('Unknowns and stress limitations','未知项与压力局限'),
  'history':('Two historical lenses and comparability','两种历史口径与可比性'),
  'management':('Management guidance record','管理层指引记录'),
  'currentGate':('Current-date gates and post-origin ASR','当前日期门槛与基准日后回购'),
  'uncertainty':('Uncertainty and simulation scope','不确定性与模拟范围'),
  'review':('Separate later independent review','独立后续复核说明')}
 parts=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SNPS v3 conditional July-origin research / 七月基准日条件性研究</title><style>body{font:17px/1.65 system-ui,sans-serif;max-width:1160px;margin:auto;padding:28px;color:#17212b;background:#fff}nav{display:flex;gap:16px;flex-wrap:wrap}section{border-top:1px solid #d4dce2;padding-top:18px;margin-top:26px}h1{line-height:1.2}h2{font-size:1.35rem}p{max-width:104ch}.caution{background:#fff4d8;border-left:5px solid #a35c00;padding:16px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:8px;border-bottom:1px solid #d4dce2;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left}a{color:#0a5186}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}summary{cursor:pointer;padding:8px 0}small{font-size:.85rem}</style></head><body><nav><a href="../../index.html">Valuation Lab</a><a href="#english">English</a><a href="#chinese">简体中文</a><a href="#evidence">Evidence / 证据</a><a href="#history">History / 历史</a><a href="#sources">Sources / 来源</a></nav>']
 for lang,anchor in [('en','english'),('zh-Hans','chinese')]:
  chinese=lang=='zh-Hans'
  parts.append(f'<article lang="{lang}" id="{anchor}"><h1>SNPS · Synopsys, Inc.</h1><p>{e(identity["version"])} · July 31 origin / 七月三十一日基准 · October 18 information / 十月十八日信息</p>')
  for key,value in record['prose'].items():
   parts.append(f'<section id="prose-{key}{"-zh" if chinese else ""}"><h2>{e(titles[key][int(chinese)])}</h2><p class="{"caution" if key in ("scope","anchorBasis","funding","claims","awards","review") else ""}">{e(value[lang])}</p></section>')
  heading='条件性七月基准日情景 · 百万美元／美元每股' if chinese else 'Conditional July-origin scenarios · USD millions / USD per share'
  parts.append(f'<section><h2>{heading}</h2><div class="table-wrap"><table><tr><th>Scenario / 情景</th><th>Operating EV / 经营企业价值</th><th>Conditional per share / 条件性每股</th><th>Future grants / 新授予成本</th><th>Terminal EV share / 终值占比</th></tr>')
  for name,label in [('down','Downside / 下行'),('base','Base / 基准'),('up','Upside / 上行')]:
   x=values[name]
   parts.append(f'<tr><td>{label}</td><td>{num(x["operating_enterprise_value_usd_m"],6)}</td><td>{num(x["conditional_allocation"]["conditional_usd_per_common_share"],10)}</td><td>{x["parameters"]["future_new_grant_pct"]:.0%}</td><td>{x["terminal_pct_ev"]:.4%}</td></tr>')
  parts.append('</table></div><p>198.077 million assumed allocation units / 百万个假设分配单位; $350M unverified residual allowance / 未经验证剩余预算; fixed assumed 46% foreign excess-cash fraction / 固定假设 46% 境外超额现金比例. No current price or unconditional equity comparison / 无当前价格或无条件股权比较.</p></section></article>')
 parts.append('<section id="evidence"><h2>Forecast evidence and exact timing / 预测证据与精确时点</h2><p class="caution">'+e(record['prose']['funding']['en'])+'<br>'+e(record['prose']['funding']['zh-Hans'])+'</p>')
 for name in ('down','base','up'):
  x=values[name]
  parts.append(f'<h3>{e(name)} · USDm / 百万美元</h3><p>Full FY2026 revenue / 全年收入: {num(x["FY2026_reconstructed_revenue"])}; mixed-basis EBIT / 混合口径 EBIT: {num(x["FY2026_reconstructed_economic_ebit"])}; separate normalized reference only / 独立规范化参考: {num(x["FY2026_normalized_ebit_reference_only"],6)}.</p><div class="table-wrap"><table><tr><th>Period / 期间</th><th>End / 期末</th><th>ACT/365.25 time / 年数</th><th>Revenue / 收入</th><th>Economic EBIT / 经济 EBIT</th><th>Operating investment / 经营投资</th><th>Separate restructuring / 单列重组支付</th><th>FCFF</th><th>WACC</th></tr>')
  for row in x['rows']:
   parts.append('<tr>'+''.join('<td>'+v+'</td>' for v in [e(row['period']),e(row['end']),num(row['years_from_origin'],10),num(row['revenue']),num(row['economic_ebit']),num(row['net_reinvestment']),num(row['legacy_restructuring_cash']),num(row['fcff']),f'{x["parameters"]["wacc"]:.2%}'])+'</tr>')
  parts.append('</table></div>')
 parts.append('</section><section><h2>Selected claims and illustrative stresses / 所选请求权及示例压力值</h2><p>'+e(record['prose']['claimLimits']['en'])+'<br>'+e(record['prose']['claimLimits']['zh-Hans'])+'</p><div class="table-wrap"><table><tr><th>Input / 输入</th><th>Default / 默认值</th><th>Allowed domain / 输入范围</th><th>Listed examples / 列示示例</th></tr>')
 for o in record['bridge']['options']:
  high='No verified finite maximum / 无经验证有限上限' if o['max'] is None else str(o['max'])
  parts.append(f'<tr><td>{e(o["label"])}</td><td>{e(o["default"])} {e(o["unit"])}</td><td>0 – {e(high)}; null / 未知</td><td>{e(", ".join(map(str,o["listedStressValues"])))}</td></tr>')
 parts.append('</table></div><p>'+e(record['bridge']['equation'])+'</p></section><section id="history"><h2>Reported FY2016–2025, two separate lenses / 2016–2025 财年，两种独立口径</h2><p>'+e(record['prose']['history']['en'])+'<br>'+e(record['prose']['history']['zh-Hans'])+'</p><p>Canonical chart history uses as-reported revenue and GAAP operating income. Full historical fields and provenance appear below. / 规范图表历史采用原始报告收入及 GAAP 经营利润。完整历史字段与来源列于下方。</p><div class="table-wrap"><table><tr><th>FY</th><th>Actual end / 实际期末</th><th>Days / 天数</th><th>Original revenue / 原收入</th><th>Latest revenue / 最新比较收入</th><th>Original EBIT / 原 EBIT</th><th>Latest EBIT / 最新 EBIT</th><th>Original SBC / 原股份薪酬</th><th>Original R&amp;D / 原研发</th><th>CFO including discontinued / 含终止业务经营现金流</th><th>Original capex / 原资本开支</th></tr>')
 for row in record['history']:
  v=row['normalizedValues']; lv=row['latestComparative']['values']; url=row['provenance']['operating_income']['url']
  vals=[e(row['fiscalEnd']),str(row['days']),num(v['revenue']),num(lv['revenue']),num(v['operating_income']),num(lv['operating_income']),num(v['sbc']),num(v['research_and_development']),num(v['cfo_including_discontinued']),num(v['capex'])]
  parts.append('<tr><td><a href="'+e(url)+'">FY'+str(row['fiscalYear'])+'</a></td>'+''.join('<td>'+x+'</td>' for x in vals)+'</tr>')
 parts.append('</table></div>')
 for row in record['history']:
  v=row['normalizedValues']; lr=row['latestComparative'];lv=lr['values']
  parts.append(f'<details><summary>FY{row["fiscalYear"]}: all source fields, both lenses, provenance and comparability / 全部来源字段、两种口径、来源与可比性</summary><p>Actual period / 实际期间: {e(row["periodStart"])} → {e(row["fiscalEnd"])} ({row["days"]} days / 天). XBRL presentation / 列报: {e(row["xbrlPresentationStart"])} → {e(row["xbrlPresentationEnd"])}.</p><p>{e(" ".join(row["comparabilityFlags"]))}</p><div class="table-wrap"><table><tr><th>Field / 字段</th><th>As reported / 原报告</th><th>Latest comparative / 最新比较</th><th>Original source / 原来源</th><th>Latest source / 最新来源</th></tr>')
  for key in v:
   def provenance_cell(p):
    if p is None:return 'Unknown / 未知'
    link=f'<a href="{e(p["url"])}">{e(p.get("accession",p.get("source","Source / 来源")))}</a>' if p.get('url') else e(p.get('source','Source / 来源'))
    return link+'<details><summary>Field provenance / 字段来源</summary><pre>'+jdump(p)+'</pre></details>'
   parts.append(f'<tr><td>{e(key)}</td><td>{num(v[key],6)}</td><td>{num(lv[key],6)}</td><td>{provenance_cell(row["provenance"].get(key))}</td><td>{provenance_cell(lr["provenance"].get(key))}</td></tr>')
  parts.append('</table></div><h4>Acquisition comparability / 收购可比性</h4><pre>'+jdump(row['acquisitionComparability'])+'</pre><h4>Product evidence, retained taxonomy / 产品证据，保留原分类</h4><pre>'+jdump(row['productRevenueEvidence'])+'</pre></details>')
 parts.append('</section><section><h2>Preserved diagnostics and sensitivities / 保留的诊断及压力测试</h2><p>Source sensitivity grids vary their stated source inputs, including full-period WACC or grant rates where specified. They are evidence, not a claim that future-year app controls implement the same stress. / 来源压力表按注明的输入变化，必要时包括全期间 WACC 或授予费率。它们是证据，不表示未来年度应用控件实现了相同压力。</p>')
 for label,name in [('Operating WACC/g/ROIC / 经营 WACC/增长/ROIC','sensitivity.json'),('Future grants / 未来新授予','future-grant-sensitivity.json'),('Claim and RSU allocations / 请求权与 RSU 分配','conditional-allocation-sensitivity.json'),('Capital assumptions / 资本假设','capital-assumption-sensitivity.json'),('All-positive-NOPAT funding / 全部正向 NOPAT 资金','funding-method-stress.json'),('Reported-perimeter TTM bridge / 报告范围 TTM 桥','ttm-bridge.json'),('Management scorecard / 管理层记录','management-track-record.json'),('Terminal return / 终值回报','terminal-return-review.json')]:
  parts.append(f'<p><a href="public-source-v3/{e(name)}">{e(label)}</a></p>')
 parts.append('</section><section id="sources"><h2>Public sources and preserved artifacts / 公开来源与保留原始资料</h2><p>77 source records / 77 条来源记录; 76 unique URLs / 76 个不同网址. Original status wording is retained. Raw captures and full third-party transcripts are excluded. / 保留原状态措辞。排除原始抓取及完整第三方访谈记录。</p><ul>')
 for s in record['sources']:
  parts.append('<li><a href="'+e(s['url'])+'">'+e(s['id'])+'</a> · '+e(s.get('source_class',''))+' · '+e(s.get('review_scope',''))+'<details><summary>Provenance / 来源信息</summary><pre>'+jdump(s)+'</pre></details></li>')
 parts.append('</ul><p>'+' · '.join('<a href="'+e(identity[k].split('/')[-1])+'">'+e(label)+'</a>' for k,label in [('fullReportPath','Complete original report / 完整原始报告'),('sourcePath','Evidence JSON / 证据 JSON'),('historyPath','Original history JSON / 原始历史 JSON'),('historyCSVPath','Original history CSV / 原始历史 CSV'),('auditPath','Independent readiness / 独立就绪结论'),('auditReportPath','Independent report / 独立报告'),('auditCorrectionsPath','Precise label finding / 精确标签发现'),('laterReviewNotePath','Later review note / 后续复核说明'),('allocationSourcePath','Original model / 原始模型')])+'</p><p><a href="public-source-v3/file-manifest.json">Original public manifest / 原始公开清单</a> · <a href="SNPS-v3-build-checks.json">Build verification / 构建验证</a> · <a href="SNPS-v3-package-manifest.json">Package hashes / 包哈希</a></p></section></body></html>')
 (out/'SNPS-v3.html').write_text('\n'.join(parts),encoding='utf-8')


if __name__=='__main__':
 main()
