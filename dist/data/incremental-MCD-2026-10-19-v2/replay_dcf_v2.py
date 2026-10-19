#!/usr/bin/env python3
"""Offline dated MCD scenario replay. Python standard library only. No network, writes only named output files."""
import json,math,csv,pathlib,copy,argparse
HERE=pathlib.Path(__file__).resolve().parent
YEARS=list(range(2026,2037))

def finite(x,name,low=None,high=None):
 if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):raise ValueError(name+' must be finite numeric')
 if low is not None and x<low:raise ValueError(name+' below permitted bound')
 if high is not None and x>high:raise ValueError(name+' above permitted bound')
 return x

def validate(d):
 if d['valuation_anchor']!='2026-06-30' or d['information_cutoff']!='2026-10-19':raise ValueError('This replay is pinned to the documented dates; rebuild evidence for other dates')
 for k in ['conventional_sales','developmental_sales','affiliate_sales','company_sales','other_revenue','other_profit','initial_fees','franchise_occupancy_expense','restaurants','reported_revenue','rent_rate','royalty_rate']:
  finite(d['opening_2025'][k],k,0)
 for key in ['cash','debt','common_shares_exact','total_lease_liabilities']:finite(d['capital_known_june'][key],key,0)
 if d['capital_known_june']['common_shares_exact']<=0 or not float(d['capital_known_june']['common_shares_exact']).is_integer():raise ValueError('Exact shares must be a positive whole count')
 h=d['observed_h1_2026'];
 for k in ['revenue','core_contribution_before_other','da','cash_capex','restructuring_expense'] : finite(h[k],k,0)
 for name,c in d['scenarios'].items():
  finite(c['wacc'],'wacc',.01,.3);finite(c['terminal_g'],'terminal_g',0,.06);finite(c['terminal_roic'],'terminal_roic',.01,1)
  if not c['terminal_g']<min(c['wacc'],c['terminal_roic']):raise ValueError('Require g < WACC and terminal ROIC')
  finite(c['incremental_nwc_ratio'],'nwc',0,1)
  for k in ['comp_growth','unit_sales_contribution_conventional','unit_sales_contribution_developmental','unit_sales_contribution_affiliate','fx_growth','company_sales_growth','restaurant_count_growth','other_revenue_growth','franchise_occupancy_growth','company_restaurant_margin','sga_to_systemwide_sales','cash_tax_rate','cash_capex_baseline','next_capital_support','next_rent_relief','da','new_finance_lease_assets','normal_other_expense','restructuring_expense']:
   if not isinstance(c[k],list) or len(c[k])!=len(YEARS):raise ValueError(k+' requires one input per 2026–2036 fiscal year')
   for j,v in enumerate(c[k]):
    finite(v,f'{name}.{k}.{j}')
    if k.endswith('growth') or k.startswith('unit_sales_'):
     if not -.5<=v<=.5:raise ValueError(k+' outside supported growth range')
    elif k in ['company_restaurant_margin','sga_to_systemwide_sales','cash_tax_rate']:
     if not 0<=v<=1:raise ValueError(k+' outside [0,1]')
    elif v<0:raise ValueError(k+' cannot be negative')
  if c['cash_capex_baseline'][0]+c['next_capital_support'][0]<h['cash_capex']:raise ValueError('FY capex below observed H1 capex')
  if c['da'][0]<h['da']:raise ValueError('FY D&A below observed H1 D&A')
  if c['restructuring_expense'][0]<h['restructuring_expense']:raise ValueError('FY restructuring below observed H1 expense; an implicit H2 reversal is not permitted')
  finite(c['h2_2026_finance_lease_asset_additions'],'H2 finance lease asset additions',0)
  finite(c['other_profit_growth'],'other profit growth',-.5,.5)
  finite(c['rent_rate_shift'],'rent rate shift',-.05,.05);finite(c['royalty_rate_shift'],'royalty rate shift',-.03,.03)
  if d['opening_2025']['rent_rate']+c['rent_rate_shift']<=0 or d['opening_2025']['royalty_rate']+c['royalty_rate_shift']<=0:raise ValueError('Nonpositive rent/royalty rate')
 return True

def case(d,name,c):
 b=d['opening_2025'];h=d['observed_h1_2026'];conv=b['conventional_sales'];dev=b['developmental_sales'];aff=b['affiliate_sales'];company=b['company_sales'];other=b['other_revenue'];otherprofit=b['other_profit'];fees=b['initial_fees'];occ=b['franchise_occupancy_expense'];restaurants=b['restaurants'];prior_gross_revenue=b['reported_revenue'];rows=[]
 for i,y in enumerate(YEARS):
  previous=[conv,dev,aff];comp=c['comp_growth'][i];fx=c['fx_growth'][i]
  unit=[c['unit_sales_contribution_conventional'][i],c['unit_sales_contribution_developmental'][i],c['unit_sales_contribution_affiliate'][i]]
  sales=[v*(1+comp)*(1+u)*(1+fx) for v,u in zip(previous,unit)];conv,dev,aff=sales;fs=sum(sales)
  weighted_unit=sum(v*u for v,u in zip(previous,unit))/sum(previous)
  company*=1+c['company_sales_growth'][i];other*=1+c['other_revenue_growth'][i];otherprofit*=1+c['other_profit_growth'];fees*=1+c['restaurant_count_growth'][i];restaurants*=1+c['restaurant_count_growth'][i];occ*=1+c['franchise_occupancy_growth'][i]
  gross_rent=conv*(b['rent_rate']+c['rent_rate_shift']);relief=c['next_rent_relief'][i];rent=gross_rent-relief
  if rent<=0:raise ValueError('Rent relief consumes rent revenue')
  royalties=fs*(b['royalty_rate']+c['royalty_rate_shift']);franchiserev=rent+royalties+fees;revenue=franchiserev+company+other;gross_revenue=revenue+relief;system_sales=fs+company
  franchise_margin=franchiserev-occ;company_profit=company*c['company_restaurant_margin'][i];sga=system_sales*c['sga_to_systemwide_sales'][i]
  contribution=franchise_margin+company_profit+otherprofit-sga
  fy_core_ebit=contribution-c['normal_other_expense'][i]-c['restructuring_expense'][i]
  fy_core_ebit_no_next_relief=fy_core_ebit+relief
  da=c['da'][i];capex=c['cash_capex_baseline'][i]+c['next_capital_support'][i];lease_assets=c['new_finance_lease_assets'][i]
  nwc=c['incremental_nwc_ratio']*(gross_revenue-prior_gross_revenue)
  if i==0:
   period='2026-H2';fraction=.5;t=.5
   ebit=contribution-h['core_contribution_before_other']-.5*c['normal_other_expense'][i]-(c['restructuring_expense'][i]-h['restructuring_expense'])
   da-=h['da'];capex-=h['cash_capex'];lease_assets=c['h2_2026_finance_lease_asset_additions'];nwc*=.5
   period_rev=revenue-h['revenue']
  else:period=str(y);fraction=1;t=i+.5;ebit=fy_core_ebit;period_rev=revenue
  if period_rev<=0:raise ValueError('FY scenario revenue below observed H1')
  tax=c['cash_tax_rate'][i];nopat=ebit*(1-tax);fcff=nopat+da-capex-lease_assets-nwc
  df=(1+c['wacc'])**(-t);pv=fcff*df
  rows.append({'scenario':name,'fiscal_year':y,'cashflow_period':period,'year_fraction':fraction,'discount_years_from_2026_06_30':t,'conventional_franchisee_sales':conv,'developmental_licensee_sales':dev,'affiliate_restaurant_sales':aff,'franchisee_sales':fs,'systemwide_sales':system_sales,'restaurant_count_illustration':restaurants,'weighted_unit_sales_contribution':weighted_unit,'gross_rent_revenue':gross_rent,'next_rent_relief':relief,'rent_revenue_after_relief':rent,'royalty_revenue':royalties,'initial_fees':fees,'franchise_revenue':franchiserev,'company_revenue':company,'other_revenue':other,'full_year_reported_revenue_proxy':revenue,'period_revenue':period_rev,'franchise_occupancy_expense':occ,'company_restaurant_profit':company_profit,'other_profit':otherprofit,'sga_including_sbc_cash_replacement':sga,'full_year_core_ebit':fy_core_ebit,'full_year_core_margin':fy_core_ebit/revenue,'full_year_core_ebit_without_next_relief':fy_core_ebit_no_next_relief,'period_core_ebit':ebit,'cash_tax_rate':tax,'nopat':nopat,'consolidated_da':da,'cash_capex_baseline_full_year':c['cash_capex_baseline'][i],'next_capital_support_full_year':c['next_capital_support'][i],'cash_capex':capex,'new_finance_lease_assets_as_economic_capex':lease_assets,'change_in_nwc':nwc,'fcff':fcff,'discount_factor':df,'pv_fcff':pv})
  prior_gross_revenue=gross_revenue
 last=rows[-1];terminal_nopat=last['full_year_core_ebit_without_next_relief']*(1+c['terminal_g'])*(1+c['cash_tax_rate'][-1]*-1)
 reinvest=terminal_nopat*c['terminal_g']/c['terminal_roic'];terminal_fcff=terminal_nopat-reinvest;terminal_value=terminal_fcff/(c['wacc']-c['terminal_g']);pvterminal=terminal_value/(1+c['wacc'])**10.5;explicit=sum(r['pv_fcff'] for r in rows);ev=explicit+pvterminal
 return {'scenario':name,'valuation_anchor':d['valuation_anchor'],'information_cutoff':d['information_cutoff'],'scope':'Consolidated royalty/rent/company-restaurant operating EV; excludes separately valued equity-method ownership interests; operating leases treated as operating; finance-lease financing separate','currency':'USD','units':'USD millions','core_operating_ev':ev,'explicit_period_pv':explicit,'terminal_pv':pvterminal,'terminal_ev_fraction':pvterminal/ev if ev else None,'terminal_year':2037,'terminal_nopat':terminal_nopat,'terminal_reinvestment':reinvest,'terminal_reinvestment_rate':c['terminal_g']/c['terminal_roic'],'terminal_fcff':terminal_fcff,'terminal_value_at_2036_end':terminal_value,'terminal_fcff_vs_2036_fcff':terminal_fcff/last['fcff']-1 if last['fcff'] else None,'current_target':None,'current_upside':None,'dated_per_share_allocation':None,'allocation_status':'blocked until explicit complete capital/award policy is supplied','rows':rows}

def allocate(result,d,p):
 if p is None:return result
 required=['finance_lease_claim','affiliate_equity_value','other_nonoperating_assets','minimum_operating_cash','existing_award_incremental_claim','other_noncommon_claims']
 for k in required:
  if p.get(k) is None:raise ValueError('Allocation policy incomplete: '+k)
  finite(p[k],k,0)
 for k in ['dated_june_only','nonoverlap_confirmed','incremental_award_claim_excludes_future_sbc_cash_replacement','lease_policy_confirmed','affiliate_value_excludes_royalty_rights','capital_scope_reviewed','assumption_not_current_target']:
  if p.get(k) is not True:raise ValueError('Allocation policy acknowledgement required: '+k)
 if not isinstance(p.get('basis'),str) or len(p['basis'].strip())<20:raise ValueError('Supply a substantive policy basis')
 cap=d['capital_known_june'];cash=cap['cash']-p['minimum_operating_cash']
 # Cash less minimum is permitted to be negative: operating cash shortfall is reserved, not clipped.
 equity=result['core_operating_ev']+cash+p['affiliate_equity_value']+p['other_nonoperating_assets']-cap['debt']-p['finance_lease_claim']-p['existing_award_incremental_claim']-p['other_noncommon_claims']
 r=copy.deepcopy(result);r['allocation_policy']=p;r['conditional_june_equity_value']=equity;r['conditional_june_common_shares']=cap['common_shares_exact']/1e6;r['dated_per_share_allocation']=equity/(cap['common_shares_exact']/1e6) if equity>0 and result['core_operating_ev']>0 and result['terminal_fcff']>0 else None;r['allocation_status']='explicit assumption-controlled June illustration; current target remains withheld' if r['dated_per_share_allocation'] is not None else 'nonpositive value: allocation suppressed';return r

def run(d,policy=None):
 validate(d);return {'version':2,'cutoff':d['information_cutoff'],'valuation_anchor':d['valuation_anchor'],'status':'Dated conditional analyst scenarios, not a current price target; v1 independent review complete, v2 targeted recheck pending','current_target':None,'current_upside':None,'results':{k:allocate(case(d,k,c),d,policy) for k,c in d['scenarios'].items()}}

def main():
 p=argparse.ArgumentParser();p.add_argument('--inputs',type=pathlib.Path,default=HERE/'dcf-inputs-v2.json');p.add_argument('--policy',type=pathlib.Path);p.add_argument('--output-dir',type=pathlib.Path,default=HERE);a=p.parse_args();d=json.loads(a.inputs.read_text());policy=json.loads(a.policy.read_text()) if a.policy else None;o=run(d,policy);a.output_dir.mkdir(parents=True,exist_ok=True)
 # Fixed output basenames never overwrite source, policy, or evidence inputs.
 for n in ['dcf-output-v2.json','forecast-v2.csv','sensitivity-v2.json']:
  target=(a.output_dir/n).resolve()
  if target==a.inputs.resolve() or (a.policy and target==a.policy.resolve()):raise ValueError('Refusing to overwrite input/policy')
 (a.output_dir/'dcf-output-v2.json').write_text(json.dumps(o,indent=2,allow_nan=False)+'\n');rows=[r for v in o['results'].values() for r in v['rows']]
 with (a.output_dir/'forecast-v2.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 sens=[]
 for wacc in [.065,.075,.08,.085,.095]:
  for g in [.015,.02,.025,.03]:
   dd=copy.deepcopy(d);dd['scenarios']['base']['wacc']=wacc;dd['scenarios']['base']['terminal_g']=g;r=case(dd,'base',dd['scenarios']['base']);sens.append({'wacc':wacc,'terminal_g':g,'core_operating_ev':r['core_operating_ev'],'terminal_ev_fraction':r['terminal_ev_fraction'],'current_target':None})
 (a.output_dir/'sensitivity-v2.json').write_text(json.dumps({'scope':'Base operating path; WACC/g assumptions only; no equity allocation','rows':sens},indent=2)+'\n')
 print(json.dumps({k:{f:v[f] for f in ['core_operating_ev','terminal_ev_fraction','dated_per_share_allocation','current_target']} for k,v in o['results'].items()},indent=2))
if __name__=='__main__':main()
