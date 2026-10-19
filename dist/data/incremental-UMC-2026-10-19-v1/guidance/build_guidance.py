from pathlib import Path
import re,json,csv,hashlib
from datetime import datetime
P=Path(__file__).resolve().parent;S=P/'private-sources'
M=json.loads((P/'source_manifest.json').read_text());urls={x['id']:x['url'] for x in M if 'url' in x}
def num(s):return float(s.replace(',',''))
def get(t,pat):
 m=re.search(pat,t,re.I);return m.group(1) if m else None
def page(t,needle):return t[:t.index(needle)].count('\f')+1
qs=['2023Q4']+[f'{y}Q{q}' for y in [2024,2025] for q in [1,2,3,4]]+['2026Q1','2026Q2']
docs={};ops=[]
for q in qs:
 t=(S/f'{q}-report.pdf.txt').read_text();date=get(t,r'ROC\s*[–-]\s*([A-Za-z]+\s+\d+,\s+\d{4})');dt=datetime.strptime(date,'%B %d, %Y').date().isoformat()
 guides={k:get(t,r'⚫\s*'+re.escape(k)+r':\s*([^\n]+)') for k in ['Wafer Shipments','ASP in USD','Gross Profit Margin','Capacity Utilization',f'{int(q[:4])+1 if q[-1]=="4" else q[:4]} CAPEX']}
 # Guidance date is the actual date on the prior quarter's contemporaneous release.
 docs[q]={'date':dt,'guidance':guides,'guidance_page':page(t,'Outlook & Guidance'),'url':urls[f'{q}-report.pdf'],'text':t}
 if q=='2023Q4':continue
 sec=t[t.index('Shipment and Utilization'):]
 ship=get(sec,r'Wafer shipments\s+(?:increased|decreased)\s+([0-9.]+)%')
 shipnum=float(ship) if ship else None
 if 'Wafer shipments decreased' in sec and shipnum is not None:shipnum=-shipnum
 sc=get(sec,r'\n([\d,]+)K (?:in|during)') or get(sec,r'for ([\d,]+)K')
 cap=get(sec,r'capacity was ([\d,]+)K')
 mix={}
 for label in ['North America','Asia Pacific','Europe','Japan','14nm and below','14nm<x<=28nm','28nm<x<=40nm','40nm<x<=65nm','65nm<x<=90nm','90nm<x<=0.13um','0.13um<x<=0.18um','0.18um<x<=0.35um','0.5um and above','Fabless','IDM','Computer','Communication','Consumer','Others']:
  v=get(t,re.escape(label)+r'\s+(\d+)%\s+\d+%')
  mix[label]=int(v) if v is not None else None
 row={'quarter':q,'report_date':dt,'revenue_ntd_mn':int(get(t,r'Operating Revenues\s+([\d,]+)\s').replace(',','')),'gross_margin_pct':float(get(t,r'Gross margin:\s*([\d.]+)%')),'operating_margin_pct':float(get(t,r'Operating margin:\s*([\d.]+)%')),'utilization_pct':int(get(t,r'Capacity utilization rate:\s*(\d+)%')),'wafer_shipments_12inch_equiv_k':int(sc.replace(',','')) if sc else None,'shipment_growth_qoq_pct':shipnum,'shipment_growth_actual_wording':'remained flat' if shipnum is None else ('increased' if shipnum>=0 else 'decreased'),'quarter_capacity_12inch_equiv_k':int(cap.replace(',','')) if cap else None,'asp_actual_qualitative':get(t,r'Blended average selling price \(ASP\) ([^\n.]+)'),'asp_actual_change_pct':None,'cash_capex_usd_mn':int(get(t,r'CAPEX spending in \w+ totaled US\$([\d,]+) million').replace(',','')),'mix_pct':mix,'source_url':urls[f'{q}-report.pdf'],'source_id':f'{q}-report.pdf','pages':{'financials':3,'mix':7,'shipments_asp_utilization':8,'capacity_capex':9},'basis':'TIFRS; mix describes wafer sales, not total consolidated revenue; capacity and shipments use thousands of 12-inch-equivalent wafers; utilization is wafer output/capacity and must not be recalculated from shipments.'}
 # 2025 Q1 report states flat rather than giving a percentage; an arithmetic estimate from rounded shipments is separate.
 if q=='2025Q1':row['shipment_growth_from_rounded_volumes_pct']=round((910/909-1)*100,4)
 ops.append(row)
(P/'quarterly_operating_facts.json').write_text(json.dumps(ops,indent=2))
with (P/'quarterly_operating_facts.csv').open('w') as f:
 flat=[{**{k:v for k,v in r.items() if k not in ['mix_pct','pages']},**{f'mix_{k}':v for k,v in r['mix_pct'].items()}} for r in ops];w=csv.DictWriter(f,fieldnames=list(dict.fromkeys(k for r in flat for k in r)));w.writeheader();w.writerows(flat)
# These comparisons deliberately do not silently translate vague adjectives into numerical intervals.
comparisons={
'2024Q1':['above_explicit_range','direction_consistent_magnitude_unverified','above_approximate_anchor','qualitative_guidance_no_exact_range'],
'2024Q2':['qualitatively_consistent','qualitatively_consistent','above_approximate_anchor','qualitative_guidance_no_exact_range'],
'2024Q3':['above_qualitative_expectation','qualitatively_consistent','qualitative_guidance_no_exact_range','near_approximate_anchor'],
'2024Q4':['small_positive_vs_flat_guidance','qualitatively_consistent','near_approximate_anchor','qualitative_guidance_no_exact_range'],
'2025Q1':['qualitatively_consistent','direction_consistent_magnitude_unverified','above_explicit_lower_bound','near_approximate_anchor'],
'2025Q2':['within_explicit_range','qualitatively_consistent','below_approximate_anchor','qualitative_guidance_no_exact_range'],
'2025Q3':['qualitatively_consistent','qualitatively_consistent','above_conditional_reference','qualitative_guidance_no_exact_range'],
'2025Q4':['small_negative_vs_flat_guidance','qualitatively_consistent','above_qualitative_expectation','qualitative_guidance_no_exact_range'],
'2026Q1':['positive_vs_flat_guidance','directionally_below_guidance','qualitative_guidance_no_exact_range','qualitative_guidance_no_exact_range'],
'2026Q2':['above_qualitative_expectation','direction_consistent_magnitude_unverified','above_approximate_anchor','qualitative_guidance_no_exact_range']}
notes={
'2024Q1':['4.5% exceeds stated approximate 2–3% interval; 1.5 percentage points above upper endpoint.','Report discloses a decline, not an exact USD ASP change; cannot verify -5%.','30.9% is 0.9 percentage points above approximate 30% anchor; no issuer tolerance given.','65% compared with low-60% wording; no fabricated numeric bounds.'],
'2024Q2':['2.6% is consistent with ordinary low-single-digit wording; no numerical interval stated.','Issuer reports firm ASP; no exact growth figure.','35.2% is 5.2 percentage points above approximate 30% anchor.','68% compared with mid-60% wording; no numerical interval stated.'],
'2024Q3':['7.8%; issuer explicitly says shipments grew more than expected.','Issuer reports firm ASP.','33.8% compared with mid-30% wording; no numerical interval stated.','71% is 1 percentage point above approximate 70% anchor.'],
'2024Q4':['1.5% growth versus flat wording; a tolerance would be analyst-defined.','Issuer reports flat ASP.','30.4% is 0.4 percentage points above close-to-30% anchor.','70% compared with high-60% wording; no numerical interval stated.'],
'2025Q1':['Issuer reports flat. Rounded shipment counts 910k vs909k imply +0.11%, not an issuer exact rate.','Issuer reports decline; mid-single-digit magnitude cannot be verified from report alone.','26.7% exceeds >25% floor, which explicitly included January 21 earthquake impact.','69% is 1 percentage point below approximate 70% anchor.'],
'2025Q2':['6.2% lies within 5–7% guidance.','Firm ASP is directionally compatible with flat; report does not quantify change.','28.7% is 1.3 percentage points below approximate 30% anchor; management cites NTD appreciation.','76% compared with mid-70% wording; no numerical interval stated.'],
'2025Q3':['3.4% is broadly consistent with low-single-digit wording; no numerical interval stated.','Issuer reports firm ASP.','29.8% versus Q2 28.7% reference, +1.1 points; original outlook explicitly subject to FX.','78% compared with mid-70% wording; no numerical interval stated.'],
'2025Q4':['-0.6% versus flat; issuer describes flattish shipments and results in line with guidance.','Issuer reports firm ASP.','30.7% above ordinary high-20% wording, but no formal numerical interval.','78% compared with mid-70% wording; no numerical interval stated.'],
'2026Q1':['2.7% growth versus flat wording; no issuer tolerance supplied.','Actual ASP declined versus firm outlook; issuer attributes part of decline to higher 8-inch mix.','29.2% compared with high-20% wording; no numerical interval stated.','79% compared with mid-70% wording; no numerical interval stated.'],
'2026Q2':['10.6% exceeds ordinary high-single-digit expectation; no numerical band invented.','Actual increase matches direction; exact low-single-digit magnitude not disclosed in report.','32.5% is 2.5 percentage points above approximate 30% anchor.','85% compared with low-80% wording; no numerical interval stated.']}
rows=[]
for i,op in enumerate(ops):
 q=op['quarter'];prior=qs[i];pd=docs[prior];ad=docs[q]
 for j,(g,metric,key,unit) in enumerate([('Wafer Shipments','wafer_shipments','shipment_growth_qoq_pct','percent QoQ'),('ASP in USD','asp_usd','asp_actual_change_pct','percent QoQ'),('Gross Profit Margin','gross_margin','gross_margin_pct','percent of revenue'),('Capacity Utilization','capacity_utilization','utilization_pct','percent')]):
  rec={'target_period':q,'metric':metric,'guidance_issued_date':pd['date'],'guidance_source_period':prior,'guidance_original':pd['guidance'][g],'guidance_numeric_low':None,'guidance_numeric_high':None,'guidance_is_approximate':any(x in pd['guidance'][g].lower() for x in ['approximately','close']),'guidance_qualifier':'Original wording retained; qualitative ranges have null numeric bounds.','actual_release_date':ad['date'],'actual_numeric':op[key],'actual_qualitative':op['asp_actual_qualitative'] if metric=='asp_usd' else op['shipment_growth_actual_wording'] if metric=='wafer_shipments' else None,'unit':unit,'comparison':comparisons[q][j],'comparison_note':notes[q][j],'strictly_quantitatively_scorable':False,'guidance_source_id':f'{prior}-report.pdf','guidance_source_url':pd['url'],'guidance_page':pd['guidance_page'],'actual_source_id':op['source_id'],'actual_source_url':ad['url'],'actual_page':3 if metric=='gross_margin' else 8,'result_status':'reported'}
  if q=='2024Q1' and metric=='wafer_shipments':rec.update(guidance_numeric_low=2,guidance_numeric_high=3,strictly_quantitatively_scorable=False,guidance_qualifier='Explicit approximate 2–3% interval; endpoint comparison available, but tolerance not defined.')
  if q=='2024Q1' and metric=='asp_usd':rec.update(guidance_numeric_low=-5,guidance_numeric_high=-5,guidance_qualifier='Numeric -5% guidance, but primary release actual is qualitative only.')
  if q=='2025Q2' and metric=='wafer_shipments':rec.update(guidance_numeric_low=5,guidance_numeric_high=7,strictly_quantitatively_scorable=True,guidance_qualifier='Explicit numerical interval.')
  if q=='2025Q1' and metric=='gross_margin':rec.update(guidance_numeric_low=25,guidance_lower_bound_exclusive=True,strictly_quantitatively_scorable=True,guidance_qualifier='Explicit >25% floor including earthquake impact.')
  rows.append(rec)
 # CAPEX is annual guidance, not a forecast of the following quarter. Keep it in the sample without spurious quarterly hit/miss scoring.
 year=int(q[:4]);g=pd['guidance'][f'{year} CAPEX'];gv=float(re.search(r'US\$([\d.]+)',g).group(1));fyactual={2024:2.9,2025:1.6}.get(year)
 rows.append({'target_period':q,'metric':'annual_cash_capex','guidance_issued_date':pd['date'],'guidance_source_period':prior,'guidance_original':g,'guidance_numeric_low':gv,'guidance_numeric_high':gv,'guidance_is_approximate':False,'guidance_qualifier':f'FY{year} annual cash capex budget, not quarterly spend. Annual comparison is deduplicated in annual_capex_track_record.json.','actual_release_date':docs[f'{year}Q4']['date'] if fyactual is not None else None,'actual_numeric':fyactual,'actual_qualitative':f'Quarter cash capex was US${op["cash_capex_usd_mn"]}m; not directly comparable with annual guidance.','unit':'USD billion annually','comparison':'annual_spend_below_budget_not_operating_miss' if fyactual else 'pending_fiscal_year','comparison_note':'Lower spending may reflect timing or capital discipline; not scored as a quarterly earnings miss.','strictly_quantitatively_scorable':False,'guidance_source_id':f'{prior}-report.pdf','guidance_source_url':pd['url'],'guidance_page':pd['guidance_page'],'actual_source_id':f'{year}Q4-report.pdf' if fyactual else op['source_id'],'actual_source_url':docs[f'{year}Q4']['url'] if fyactual else ad['url'],'actual_page':9,'result_status':'annual_actual_reported' if fyactual else 'pending'})
(P/'guidance_vs_actual.json').write_text(json.dumps(rows,indent=2))
keys=list(dict.fromkeys(k for r in rows for k in r))
with (P/'guidance_vs_actual.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)
pending={'target_period':'2026Q3','issued_date':docs['2026Q2']['date'],'source_url':docs['2026Q2']['url'],'source_id':'2026Q2-report.pdf','source_page':10,'guidance':docs['2026Q2']['guidance'],'quarter_capacity_guidance_12inch_equiv_k':1325,'result_status':'pending_at_2026-10-19','expected_earnings_call_date':'2026-10-28','pending_evidence_url':urls['2026Q3-call-notice.pdf'],'note':'Do not use monthly revenue sum to score shipments, ASP, gross margin, utilization or annual capex; no official Q3 results report on issuer quarterly archive as of cutoff.'}
(P/'pending_guidance.json').write_text(json.dumps(pending,indent=2))
capex=[{'year':2024,'initial_budget_usd_bn':3.3,'initial_date':'2024-01-31','revised_budget_usd_bn':3.0,'revision_date':'2024-10-30','actual_usd_bn':2.9,'actual_report_date':'2025-01-21','actual_sum_quarter_usd_mn':sum(x['cash_capex_usd_mn'] for x in ops if x['quarter'].startswith('2024')),'delta_vs_initial_pct':(2.9/3.3-1)*100,'delta_vs_latest_pct':(2.9/3-1)*100,'source_ids':['2023Q4-report.pdf','2024Q3-report.pdf','2024Q4-report.pdf']},{'year':2025,'initial_budget_usd_bn':1.8,'initial_date':'2025-01-21','revised_budget_usd_bn':None,'actual_usd_bn':1.6,'actual_report_date':'2026-01-28','actual_sum_quarter_usd_mn':sum(x['cash_capex_usd_mn'] for x in ops if x['quarter'].startswith('2025')),'delta_vs_initial_pct':(1.6/1.8-1)*100,'source_ids':['2024Q4-report.pdf','2025Q3-report.pdf','2025Q4-report.pdf']},{'year':2026,'initial_budget_usd_bn':1.5,'initial_date':'2026-01-28','revised_budget_usd_bn':2.0,'revision_date':'2026-07-29','actual_usd_bn':None,'h1_spend_usd_mn':724,'h2_required_to_equal_budget_usd_mn':1276,'status':'pending','source_ids':['2025Q4-report.pdf','2026Q1-report.pdf','2026Q2-report.pdf'],'note':'H2 required spending is arithmetic, not separate issuer guidance.'}]
(P/'annual_capex_track_record.json').write_text(json.dumps(capex,indent=2))
qa={'as_of':'2026-10-19','completed_operating_quarters':len(ops),'quarter_metric_observations':len(rows),'operating_metric_observations':40,'annual_budget_observations_repeated_by_quarter':10,'independent_completed_annual_capex_outcomes':2,'strict_numeric_operating_comparisons':sum(r['strictly_quantitatively_scorable'] for r in rows),'strict_numeric_results':'2/2 within explicit range or above explicit floor; deliberately not promoted as a broad guidance hit rate. Q1 2024 approximate 2–3% shipments can be compared with endpoints but approximation tolerance is unspecified.','qualitative_numeric_bounds_fabricated':False,'asp_actuals_numeric_missing':10,'full_primary_call_transcripts':'Not located in issuer archive; report written management commentary and investor decks retained. Q2 2026 webcast page verified and contains report, deck, and financial-statement attachments but no transcript. Audio not transcribed.','mix_sums':{r['quarter']:{'regions':sum(r['mix_pct'][k] for k in ['North America','Asia Pacific','Europe','Japan']),'nodes':sum(r['mix_pct'][k] for k in ['14nm and below','14nm<x<=28nm','28nm<x<=40nm','40nm<x<=65nm','65nm<x<=90nm','90nm<x<=0.13um','0.13um<x<=0.18um','0.18um<x<=0.35um','0.5um and above']),'applications':sum(r['mix_pct'][k] for k in ['Computer','Communication','Consumer','Others'])} for r in ops},'no_public_full_text':True}
(P/'guidance_qa.json').write_text(json.dumps(qa,indent=2))
print(json.dumps(qa,indent=2));print('QUARTER FACTS');print([(r['quarter'],r['revenue_ntd_mn'],r['gross_margin_pct'],r['wafer_shipments_12inch_equiv_k'],r['quarter_capacity_12inch_equiv_k'],r['cash_capex_usd_mn']) for r in ops])
