import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {evaluateUmc,umcSourceSchedule,validateUmcInputs,validateUmcPolicy,umcDomesticSchedule,UMC_OPERATING_COST_BASELINE} from '../dist/umc-financial-engine.js';

const root=new URL('../dist/data/incremental-UMC-2026-10-19-v1/',import.meta.url);
const read=n=>JSON.parse(fs.readFileSync(new URL(n,root),'utf8'));
const x=read('dcf-inputs-v1.json'),d=read('capital-claims/funding-inputs-v1.json'),policies=read('analyst-policy-examples-v1.json').policies;
const clone=v=>structuredClone(v),staged=policies.find(p=>p.policy_id==='explicit_staged_bank_principal');
const evaluate=(scenario='base',policy=staged,annual=null,terminal=null,inputs=x,funding=d)=>evaluateUmc(inputs,scenario,policy,annual,terminal,funding);
const near=(a,b,label='value')=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(1e-7,Math.abs(b)*1e-11),`${label}: ${a} != ${b}`);
function compare(actual,expected,label='result'){
 if(typeof expected==='number')return near(actual,expected,label);
 if(expected===null||typeof expected!=='object')return assert.equal(actual,expected,label);
 for(const [key,value]of Object.entries(expected)){
  if(key.startsWith('unfunded_mathematical_')){assert.equal(Object.hasOwn(actual,key),false,`${label}.${key} must not be exposed`);continue;}
  compare(actual[key],value,`${label}.${key}`);
 }
}
function* leaves(v,path=[]){if(v&&typeof v==='object')for(const k of Object.keys(v))yield*leaves(v[k],[...path,k]);else if(typeof v==='number')yield path;}
function setAt(v,path,value){let node=v;for(const key of path.slice(0,-1))node=node[key];node[path.at(-1)]=value;}
const invalid=e=>e.status==='invalid_assumptions'&&e.enterprise===null&&e.equity===null&&e.perShare===null&&e.current_target===null&&e.conditional_usd_per_ads===null;
const terminal=s=>({growth:s.terminal_growth,margin:s.ebit_margin[9],taxRate:s.tax_rate,wacc:s.wacc,roic:x.terminal_incremental_roic});

test('UMC all nine reviewed policy/scenario cases and 90 annual rows replay exactly',()=>{
 const source=read('dcf-output-v1.json');
 for(const example of source.examples)for(const [name,expected]of Object.entries(example.scenarios)){
  const result=evaluate(name,example.policy);compare(result,expected,example.policy.policy_id+'.'+name);
  compare(evaluate(name,example.policy,umcSourceSchedule(x,name,example.policy),terminal(x.scenarios[name])),expected,name+' explicit schedule');
  assert.equal(result.selected_policy,example.policy.policy_id);assert.equal(result.current_target,null);
  assert.equal(result.current_valuation_eligible,false);assert.equal(result.historical_backtest_eligible,false);assert.equal(result.ranking_eligible,false);
 }
 assert.deepEqual(['bear','base','bull'].map(n=>evaluate(n).conditional_usd_per_ads.toFixed(6)),['3.336462','8.791089','15.237720']);
});

test('UMC source paths match independently reviewed 50-digit Decimal summary',()=>{
 const review=read('independent-review-v1.json');assert.equal(review.failed_count,0);assert.equal(review.model_engine_imported,false);
 for(const expected of review.scenario_results){
  const result=evaluate(expected.scenario,policies.find(p=>p.policy_id===expected.policy));
  for(const k of ['enterprise_value_twd_m','equity_value_twd_m'])near(result[k],Number(expected[k]),k);
  near(result.funding.initial_available_liquidity,Number(expected.initial_available_liquidity_twd_m));
  near(result.funding.minimum_available_liquidity,Number(expected.minimum_available_liquidity_twd_m));
  near(result.terminal.ev_fraction,Number(expected.terminal_EV_fraction));
  if(expected.conditional_usd_per_ads===null)assert.equal(result.conditional_usd_per_ads,null);else near(result.conditional_usd_per_ads,Number(expected.conditional_usd_per_ads));
 }
});

test('UMC null policy is an explicit operating-cost-only path and never auto-selects funding',()=>{
 const before=clone({x,d,policies});
 for(const name of ['bear','base','bull']){
  const result=evaluate(name,null);near(result.enterprise_value_twd_m,evaluate(name,policies[0]).enterprise_value_twd_m);
  for(const key of ['selected_policy','current_target','current_price_target','equity_bridge_twd_m','equity_value_twd_m','ordinary_share_denominator_m','authorized_award_new_shares_m','conditional_usd_per_ads','conditional_twd_per_ordinary','funding'])assert.equal(result[key],null,key);
  assert.equal(result.status,'POLICY_SELECTION_REQUIRED');assert.equal(result.selection_required,true);
  assert.match(result.operating_cost_basis,/no capital policy selected/);
  result.rows.forEach((r,i)=>{near(r.total_lease_cash,UMC_OPERATING_COST_BASELINE.lease_cash_by_year[i]);assert.equal(r.ending_available_liquidity,null);assert.equal(r.domestic_bond_principal,null);assert.equal(r.time_deposit_cash_conversion,null);});
  near(evaluateUmc(x,name).enterprise_value_twd_m,result.enterprise_value_twd_m);
 }
 assert.deepEqual({x,d,policies},before);
 assert.equal(Object.isFrozen(UMC_OPERATING_COST_BASELINE),true);assert.equal(Object.isFrozen(UMC_OPERATING_COST_BASELINE.lease_cash_by_year),true);
 assert.equal(UMC_OPERATING_COST_BASELINE.bank_principal_timing,undefined);
});

test('UMC both upfront policies retain inception funding failure despite positive economic value',()=>{
 for(const [p,initial]of [[policies[0],-489.988009],[policies[1],-17389.988009]])for(const name of ['bear','base','bull']){
  const result=evaluate(name,p);near(result.funding.initial_available_liquidity,initial);assert.ok(result.enterprise_value_twd_m>0&&result.equity_value_twd_m>0);
  assert.equal(result.status,'WITHHELD_UNFUNDED_OR_NONPOSITIVE_EQUITY');assert.equal(result.conditional_usd_per_ads,null);assert.equal(result.conditional_twd_per_ordinary,null);assert.equal(result.current_target,null);
  assert.equal(Object.keys(result).some(k=>k.startsWith('unfunded_mathematical')),false);
 }
 near(evaluate().funding.initial_available_liquidity,10999.935991);
});

test('UMC all source claims, bank timing, contractual principal and deposit release are retained once',()=>{
 assert.deepEqual(umcDomesticSchedule(d),[5000,2000,22300,5200,4600,0,0,0,0,0]);
 const result=evaluate(),upfront=evaluate('base',policies[0]);
 near(result.enterprise_value_twd_m,upfront.enterprise_value_twd_m);near(result.equity_bridge_twd_m,upfront.equity_bridge_twd_m);
 near(result.funding.bank_principal_reserved,6402.321);near(result.rows[1].bank_principal_payment,11489.924);
 near(result.funding.bank_principal_reserved+result.rows.reduce((s,r)=>s+r.bank_principal_payment,0),x.bank_debt_total);
 near(result.rows.reduce((s,r)=>s+r.domestic_bond_principal,0),39100);
 const known=['guarantee_deposits_reserved','dividend_payable_reserved','current_tax_reserved','contract_liabilities_reserved','refund_liabilities_reserved','legacy_pension_provision_claims_reserved'].reduce((sum,k)=>sum+x[k],0);
 near(result.funding.known_claims_reserved,known);near(result.funding.novatek_redemption_reserved,565.191);
 near(result.rows[0].time_deposit_cash_conversion,22135.867);assert.equal(result.rows.slice(1).every(r=>r.time_deposit_cash_conversion===0),true);
 let cash=result.funding.initial_available_liquidity;
 for(const r of result.rows){cash+=r.fcff+r.time_deposit_cash_conversion-r.domestic_bond_principal-r.bank_principal_payment-r.financial_debt_cash_interest_excluding_leases;near(r.ending_available_liquidity,cash);}
 for(const key of ['new_financing','new_subsidies','portfolio_sales'])assert.equal(result.funding[key],0);
});

test('UMC lease tax normalization, nonlease D&A and min ROIC/runrate terminal cap remain explicit',()=>{
 for(const name of ['bear','base','bull']){
  const result=evaluate(name),s=x.scenarios[name];
  result.rows.forEach((r,i)=>{near(r.ebit_after_cash_lease,r.revenue*s.ebit_margin[i]-staged.lease_cash_by_year[i]);near(r.cash_tax,Math.max(r.ebit_after_cash_lease,0)*s.tax_rate);near(r.fcff,r.nopat-r.reinvestment);near(r.da_excluding_rou,s.da_nonlease[i]);});
  const last=result.rows.at(-1),t=result.terminal;near(t.nopat,(last.revenue*s.ebit_margin[9]-last.total_lease_cash)*(1+s.terminal_growth)*(1-s.tax_rate));near(t.total_lease_cash,last.total_lease_cash*(1+s.terminal_growth));near(t.fcff,Math.min(t.roic_limited_fcff,t.runrate_limited_fcff));near(t.reinvestment,t.nopat-t.fcff);
 }
 const p=clone(staged);p.financial_cash_interest_by_year[0]+=100;const a=evaluate(),b=evaluate('base',p);near(a.enterprise_value_twd_m,b.enterprise_value_twd_m);near(a.rows[0].ending_available_liquidity-b.rows[0].ending_available_liquidity,100);
});

test('UMC each explicit reserve reduces bridge and available cash once without changing business EV',()=>{
 const base=evaluate();
 for(const key of ['required_operating_cash','minority_claim_reserved','supplemental_senior_cash_claim','unissued_award_claim_reserved']){
  const p=clone(staged);p[key]+=100;const result=evaluate('base',p);near(result.enterprise_value_twd_m,base.enterprise_value_twd_m);near(result.equity_bridge_twd_m,base.equity_bridge_twd_m-100);near(result.funding.initial_available_liquidity,base.funding.initial_available_liquidity-100);near(result.rows[0].ending_available_liquidity,base.rows[0].ending_available_liquidity-100);
 }
 const delayed=clone(staged);delayed.time_deposit_funding_release_year=4;const result=evaluate('base',delayed);near(result.equity_bridge_twd_m,base.equity_bridge_twd_m);near(result.funding.initial_available_liquidity,base.funding.initial_available_liquidity);near(result.rows[0].ending_available_liquidity,base.rows[0].ending_available_liquidity-x.time_deposits_current);near(result.rows[3].ending_available_liquidity,base.rows[3].ending_available_liquidity);
});

test('UMC ordinary/ADS denominator counts issued restricted shares once and separately adds authorized awards',()=>{
 for(const fraction of [0,.25,1]){
  const p=clone(staged);p.authorized_2026_award_issuance_fraction=fraction;const result=evaluate('base',p);
  near(result.ordinary_share_denominator_m,12546.43387+67*fraction);near(result.authorized_award_new_shares_m,67*fraction);
  near(result.conditional_twd_per_ordinary,result.equity_value_twd_m/result.ordinary_share_denominator_m);near(result.conditional_usd_per_ads,result.conditional_twd_per_ordinary*5/31.837);
  assert.equal(result.excluded_nonoperating_equity_value_assigned,0);assert.equal(result.circular_crossholding_share_reduction,0);
 }
});

test('UMC all numeric input, policy, funding and schedule leaves reject coercions and nonfinite values',()=>{
 const invalidValues=[null,true,'0',NaN,Infinity,-Infinity];
 for(const path of leaves(x))for(const bad of invalidValues){const changed=clone(x);setAt(changed,path,bad);assert.throws(()=>evaluate('base',staged,null,null,changed),invalid,`inputs.${path.join('.')}`);}
 for(const path of leaves(staged))for(const bad of invalidValues){const changed=clone(staged);setAt(changed,path,bad);assert.throws(()=>evaluate('base',changed),invalid,`policy.${path.join('.')}`);}
 for(const path of leaves(d))for(const bad of invalidValues){const changed=clone(d);setAt(changed,path,bad);assert.throws(()=>evaluate('base',staged,null,null,x,changed),invalid,`funding.${path.join('.')}`);}
 const annual=umcSourceSchedule(x,'base',staged),t=terminal(x.scenarios.base);
 for(const key of Object.keys(annual[0]))for(const bad of invalidValues){const changed=clone(annual);changed[0][key]=bad;assert.throws(()=>evaluate('base',staged,changed,t),invalid,`annual.${key}`);}
 for(const key of Object.keys(t))for(const bad of invalidValues){const changed=clone(t);changed[key]=bad;assert.throws(()=>evaluate('base',staged,annual,changed),invalid,`terminal.${key}`);}
});

test('UMC exact schema rejects unknown, missing, inherited, sparse, extra-array and future-financing fields',()=>{
 for(const source of [x,staged,d])for(const mutate of [v=>{v.newBorrowing=1;},v=>{delete v[Object.keys(v)[0]];},v=>{v[Symbol('hidden')]=1;}]){
  const changed=clone(source);mutate(changed);assert.throws(()=>source===x?validateUmcInputs(changed):source===staged?validateUmcPolicy(changed):umcDomesticSchedule(changed),invalid);
 }
 for(const bad of [null,[],Object.create(staged),{...staged,policy_id:'unreviewed'}, {...staged,policy_id:'toString'}])assert.throws(()=>evaluate('base',bad===null?{}:bad),invalid);
 for(const bad of ['missing','toString','constructor',{},null,undefined])assert.throws(()=>evaluateUmc(x,bad,staged,null,null,d),invalid);
 for(const mutate of [r=>{delete r.cashCapex;},r=>{r.leaseDebtClaim=1;},r=>{r.newFinancing=1;},r=>{r.year=1;}]){const annual=umcSourceSchedule(x,'base',staged);mutate(annual[0]);assert.throws(()=>evaluate('base',staged,annual),invalid);}
 for(const mutate of [a=>{delete a[2];},a=>{a.extra=1;},a=>{a.push(clone(a[9]));},a=>{a.pop();}]){const annual=umcSourceSchedule(x,'base',staged);mutate(annual);assert.throws(()=>evaluate('base',staged,annual),invalid);}
 for(const mutate of [t=>{t.newBorrowing=1;},t=>{delete t.roic;}]){const t=terminal(x.scenarios.base);mutate(t);assert.throws(()=>evaluate('base',staged,null,t),invalid);}
 assert.throws(()=>evaluateUmc(x,'base',staged),invalid);
});

test('UMC source dated facts, FX, claims, exclusion and contractual debt cannot be silently replaced',()=>{
 for(const [key,value]of [['balance_date','2026-10-19'],['fx_date','2026-10-19'],['twd_per_usd_spot',32],['ordinary_per_ads',1],['selected_policy',staged.policy_id],['current_target',10],['cash',x.cash+1],['financial_debt',x.financial_debt-1],['legacy_pension_provision_claims_reserved',0],['authorized_2026_award_shares_million',0],['common_outstanding_million',12500],['dividend_payable_reserved',0],['unit','USD millions'],['study_type','Total company fair value']]){const changed=clone(x);changed[key]=value;assert.throws(()=>evaluate('base',staged,null,null,changed),invalid,key);}
 for(const key of ['nonoperating_equity_value_assigned','circular_crossholding_share_reduction'])for(const value of [1e-12,1,-1]){const p=clone(staged);p[key]=value;assert.throws(()=>evaluate('base',p),invalid,key);}
 for(const key of ['maturity_month','principal','coupon_pct']){const changed=clone(d);changed.domestic_bond_principal_schedule[0][key]=key==='maturity_month'?'2027-12':0;assert.throws(()=>evaluate('base',staged,null,null,x,changed),invalid,key);}
});

test('UMC annual edits preserve exact explicit reinvestment identity and policy cash costs',()=>{
 const base=evaluate(),annual=umcSourceSchedule(x,'base',staged);annual[0].cashCapex+=20;annual[0].reinvestment+=20;const result=evaluate('base',staged,annual);near(result.enterprise_value_twd_m,base.enterprise_value_twd_m-20/(1+annual[0].wacc));near(result.rows[0].ending_available_liquidity,base.rows[0].ending_available_liquidity-20);
 for(const key of ['cashCapex','daNonlease','deltaNwc','reinvestment','leaseCash','supplementalOperatingCash','financialCashInterest']){const changed=umcSourceSchedule(x,'base',staged);changed[0][key]+=1;assert.throws(()=>evaluate('base',staged,changed),invalid,key);}
 for(const key of ['cashCapex','daNonlease']){const changed=umcSourceSchedule(x,'base',staged);changed[0][key]=-1;changed[0].reinvestment=changed[0].cashCapex-changed[0].daNonlease+changed[0].deltaNwc+changed[0].supplementalOperatingCash;assert.throws(()=>evaluate('base',staged,changed),invalid,key);}
 const zero=umcSourceSchedule(x,'base',staged);zero[0].cashCapex=0;zero[0].daNonlease=0;zero[0].reinvestment=zero[0].deltaNwc+zero[0].supplementalOperatingCash;assert.doesNotThrow(()=>evaluate('base',staged,zero));
 const before=clone(annual);evaluate('base',staged,annual);assert.deepEqual(annual,before);
});

test('UMC invalid policy bounds, terminal spread, taxes, cash components and nonpositive equity stay withheld',()=>{
 for(const [key,value]of [['bank_principal_timing','new_financing'],['authorized_2026_award_issuance_fraction',1.1],['time_deposit_recovery_fraction',-.01],['time_deposit_funding_release_year',0],['time_deposit_funding_release_year',1.5],['time_deposit_funding_release_year',11],['required_operating_cash',-1]]){const p=clone(staged);p[key]=value;assert.throws(()=>evaluate('base',p),invalid,key);}
 for(const [key,value]of [['growth',-.01],['growth',.105],['wacc',.025],['roic',.025],['taxRate',1],['taxRate',-.01]]){const t=terminal(x.scenarios.base);t[key]=value;assert.throws(()=>evaluate('base',staged,null,t),invalid,key);}
 const a=umcSourceSchedule(x,'base',staged);a.forEach(r=>{r.margin=-1;});const result=evaluate('base',staged,a);assert.ok(result.equity_value_twd_m<0);assert.equal(result.conditional_usd_per_ads,null);assert.equal(result.conditional_twd_per_ordinary,null);assert.equal(result.current_target,null);
 const overflow=umcSourceSchedule(x,'base',staged);overflow.forEach(r=>{r.margin=Number.MAX_VALUE;});assert.throws(()=>evaluate('base',staged,overflow),invalid);
});

// Independent Python/Decimal arithmetic: no import, execution or translation of
// the JS engine, source replay or expected output. Source cases build their own
// revenue paths; edited cases use only the supplied annual economic inputs.
const independentPython=String.raw`
import json,sys
from decimal import Decimal as D, getcontext
getcontext().prec=50
q=json.load(sys.stdin,parse_float=D,parse_int=D);x=q['inputs'];fund=q['funding'];zero=D(0);one=D(1)
claim_keys=['guarantee_deposits_reserved','dividend_payable_reserved','current_tax_reserved','contract_liabilities_reserved','refund_liabilities_reserved','legacy_pension_provision_claims_reserved']
known=sum((x[k] for k in claim_keys),zero)
debt=[zero]*10
for bond in fund['domestic_bond_principal_schedule']:
 y,m=map(int,bond['maturity_month'].split('-'))
 for i in range(10):
  if (2026+i,6)<(y,m)<=(2027+i,6):debt[i]+=bond['principal']/1000;break
baseline={'lease_cash_by_year':list(map(D,['1100','1122','1144.44','1167.3288','1190.675376','1214.48888352','1238.77866119','1263.55423441','1288.8253191','1314.60182549'])),'financial_cash_interest_by_year':[D(2000)]*5+[zero]*5,'supplemental_operating_cash_by_year':[zero]*10}
results=[]
for case in q['cases']:
 p=case['policy'];s=x['scenarios'][case['scenario']];cost=p or baseline
 annual=case.get('annual')
 if annual is None:
  revenues=[s['revenue_first']]
  for growth in s['growth']:revenues.append(revenues[-1]*(one+growth))
  annual=[]
  for i,rev in enumerate(revenues):
   prev=x['initial_revenue_anchor'] if i==0 else revenues[i-1]
   annual.append({'revenue':rev,'margin':s['ebit_margin'][i],'taxRate':s['tax_rate'],'wacc':s['wacc'],'cashCapex':s['cash_capex'][i],'daNonlease':s['da_nonlease'][i],'deltaNwc':(rev-prev)*x['incremental_working_capital_ratio'],'leaseCash':cost['lease_cash_by_year'][i],'supplementalOperatingCash':cost['supplemental_operating_cash_by_year'][i],'financialCashInterest':cost['financial_cash_interest_by_year'][i]})
 t=case.get('terminal') or {'growth':s['terminal_growth'],'margin':s['ebit_margin'][-1],'taxRate':s['tax_rate'],'wacc':s['wacc'],'roic':x['terminal_incremental_roic']}
 if p:
  extra=sum((p[k] for k in ['minority_claim_reserved','supplemental_senior_cash_claim','unissued_award_claim_reserved']),zero)
  recovery=x['time_deposits_current']*p['time_deposit_recovery_fraction']
  bank=x['bank_debt_total'] if p['bank_principal_timing']=='all_upfront' else x['bank_current_principal']
  initial=x['cash']-known-extra-p['required_operating_cash']-bank-x['novatek_redemption_reserved']
  bridge=x['cash']+recovery-x['financial_debt']-known-extra-p['required_operating_cash']
  cash=initial;balances=[initial]
 else:bridge=None;cash=None
 factors=[];discount=one;rows=[];discounted=[]
 for i,r in enumerate(annual):
  ebit=r['revenue']*r['margin']-r['leaseCash'];cash_tax=max(zero,ebit)*r['taxRate']
  fcff=ebit-cash_tax-(r['cashCapex']-r['daNonlease']+r['deltaNwc']+r['supplementalOperatingCash'])
  discount*=one+r['wacc'];discounted.append(fcff/discount)
  if p:
   release=recovery if i+1==p['time_deposit_funding_release_year'] else zero
   bank_payment=x['bank_noncurrent_principal'] if i==1 and p['bank_principal_timing']=='current_upfront_remaining_year2' else zero
   cash=cash+fcff+release-debt[i]-bank_payment-r['financialCashInterest'];balances.append(cash)
  rows.append({'fcff':fcff,'pv_fcff':fcff/discount,'cash_tax':cash_tax,'ending_available_liquidity':cash,'discount_factor':discount})
 last=annual[-1];g=t['growth'];nopat=(last['revenue']*(one+g)*t['margin']-last['leaseCash']*(one+g))*(one-t['taxRate'])
 roic=nopat*(one-g/t['roic']);runrate=rows[-1]['fcff']*(one+g);fcff=min(roic,runrate);tv=fcff/(t['wacc']-g);tvpv=tv/discount;ev=sum(discounted,zero)+tvpv
 equity=ev+bridge if p else None
 funded=p and min(balances)>=0 and equity>0
 ordinary=equity/(x['common_outstanding_million']+x['authorized_2026_award_shares_million']*p['authorized_2026_award_issuance_fraction']) if funded else None
 ads=ordinary*5/x['twd_per_usd_spot'] if funded else None
 results.append({'enterprise_value_twd_m':ev,'equity_bridge_twd_m':bridge,'equity_value_twd_m':equity,'conditional_twd_per_ordinary':ordinary,'conditional_usd_per_ads':ads,'current_target':None,'rows':rows,'terminal':{'nopat':nopat,'roic_limited_fcff':roic,'runrate_limited_fcff':runrate,'fcff':fcff,'value':tv,'pv':tvpv,'reinvestment':nopat-fcff},'funding':{'initial_available_liquidity':initial,'minimum_available_liquidity':min(balances),'gap':max(zero,-min(balances))} if p else None})
print(json.dumps(results,default=lambda v:float(v) if isinstance(v,D) else v,allow_nan=False))
`;

test('UMC independent Python Decimal crosschecks source and deterministic edited annual/funding/terminal paths',()=>{
 const cases=[];
 for(const policy of [null,...policies])for(const scenario of ['bear','base','bull'])cases.push({scenario,policy,annual:null,terminal:null});
 let seed=104729;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let n=0;n<36;n++){
  const scenario=['bear','base','bull'][n%3],policy=n%4===0?null:clone(policies[n%3]);
  if(policy){policy.minority_claim_reserved+=rand()*500;policy.required_operating_cash+=rand()*2000;policy.time_deposit_funding_release_year=1+n%5;policy.time_deposit_recovery_fraction=.5+rand()*.5;policy.authorized_2026_award_issuance_fraction=rand();policy.lease_cash_by_year=policy.lease_cash_by_year.map(v=>v*(.75+rand()*.5));policy.financial_cash_interest_by_year=policy.financial_cash_interest_by_year.map(v=>v*(.75+rand()*.5));}
  const annual=umcSourceSchedule(x,scenario,policy);let previous=x.initial_revenue_anchor;
  annual.forEach(r=>{r.revenue*=.9+rand()*.2;r.margin+=rand()*.1-.05;r.taxRate=.15+rand()*.2;r.wacc=.07+rand()*.09;r.cashCapex*=.8+rand()*.4;r.daNonlease*=.8+rand()*.4;r.deltaNwc=(r.revenue-previous)*x.incremental_working_capital_ratio;r.reinvestment=r.cashCapex-r.daNonlease+r.deltaNwc+r.supplementalOperatingCash;previous=r.revenue;});
  const t={growth:.01+rand()*.03,margin:.15+rand()*.2,taxRate:.15+rand()*.2,wacc:.09+rand()*.07,roic:.08+rand()*.12};
  cases.push({scenario,policy,annual,terminal:t});
 }
 const output=spawnSync('python3',['-c',independentPython],{input:JSON.stringify({inputs:x,funding:d,cases}),encoding:'utf8',maxBuffer:10*1024*1024,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 assert.equal(output.status,0,output.stderr);const expected=JSON.parse(output.stdout);assert.equal(expected.length,cases.length);
 cases.forEach((c,i)=>compare(evaluate(c.scenario,c.policy,c.annual,c.terminal),expected[i],`independent case ${i}`));
});
