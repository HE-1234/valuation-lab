from pathlib import Path
import csv,json,statistics
P=Path(__file__).resolve().parent
base='https://investor.rambus.com/press-releases/press-release-details/'
periods=['2023Q4','2024Q1','2024Q2','2024Q3','2024Q4','2025Q1','2025Q2','2025Q3','2025Q4','2026Q1','2026Q2']
dates=['2024-02-05','2024-04-29','2024-07-29','2024-10-28','2025-02-03','2025-04-28','2025-07-28','2025-10-27','2026-02-02','2026-04-27','2026-07-27']
ordinals={'1':'First','2':'Second','3':'Third','4':'Fourth'}
sources=[]
for p,d in zip(periods,dates):
 y=p[:4]; q=p[-1]; title=f'Rambus Reports {ordinals[q]} Quarter '+(f'and Fiscal Year {y}' if q=='4' else y)+' Financial Results'
 u=base+d[:4]+'/'+title.replace(' ','-')+'/default.aspx'
 if p in ['2024Q2','2025Q2']: u=u.removesuffix('default.aspx')
 sources.append(dict(source_id='release_'+p,title=title,url=u,published_date=d,accessed_date='2026-10-19',publisher='Rambus Inc.',source_type='issuer_earnings_release',authority='primary',locator='Quarterly Financial Review; following-quarter Outlook; Condensed Consolidated Statements of Income; supplemental reconciliations',retrieval='Opened with web tool; source text verified',scope='Factual financial data and paraphrased management commentary'))
S={p:s for p,s in zip(periods,sources)}
# Ordered metrics: product, GAAP royalties, contract/other, operational licensing billings, GAAP total costs incl cost of revenue, non-GAAP total costs incl cost of revenue.
metrics=['product_revenue','royalties_revenue','contract_and_other_revenue','licensing_billings','total_operating_costs_and_expenses_gaap','total_operating_costs_and_expenses_nongaap']
actuals=[
[50.4,47.5,20.0,63.2,87.8,74.2],
[56.7,56.4,19.0,61.5,91.8,77.1],
[66.4,64.1,15.0,65.4,90.8,80.5],
[73.4,58.2,29.5,63.6,103.2,89.1],
[76.3,74.0,16.4,73.3,103.6,90.4],
[81.3,68.6,22.3,66.4,109.2,93.2],
[93.3,65.1,20.1,66.1,115.2,99.3],
[96.8,71.676,21.8,71.5,119.4,103.2],
[88.0,69.6,22.6,70.8,118.4,104.6],
[99.2,84.2,24.0,84.1,134.7,113.7]]
guides=[
[(47,53),(43,49),(17,23),(59,65),(85,89),(71,75)],
[(52,58),(55,61),(17,23),(61,67),(91,95),(76,80)],
[(62,68),(59,65),(17,23),(60,66),(93,97),(78,82)],
[(72,78),(54,60),(22,28),(57,63),(97,101),(82,86)],
[(72,78),(56,62),(22,28),(59,65),(101,105),(87,91)],
[(77,83),(67,73),(17,23),(64,70),(106,110),(90,94)],
[(87,93),(57,63),(22,28),(58,64),(111,115),(94,98)],
[(94,100),(59,65),(25,31),(60,66),(116,120),(99,103)],
[(84,90),(61,67),(21,27),(66,72),(117,121),(100,104)],
[(95,101),(72,78),(19,25),(76,82),(127,131),(110,114)]]
def make_row(p,metric,lo,hi,actual,gs,ats=None,notes='',evidence='contemporaneous_issuer_release'):
 midpoint=(lo+hi)/2
 cost='costs_and_expenses' in metric
 status='pending' if actual is None else ('above_range' if actual>hi else 'below_range' if actual<lo else 'within_range')
 return dict(company='Rambus Inc.',ticker='RMBS',as_of='2026-10-19',target_period=p,period_end=p[:4]+'-'+{'1':'03-31','2':'06-30','3':'09-30','4':'12-31'}[p[-1]],metric=metric,unit='USD_per_diluted_share' if 'eps' in metric else 'USD_millions',basis='operational_metric' if metric=='licensing_billings' else 'non-GAAP' if 'nongaap' in metric else 'GAAP',guidance_issue_date=gs['published_date'],guidance_low=lo,guidance_high=hi,guidance_midpoint=midpoint,actual=actual,actual_release_date=ats['published_date'] if ats else None,actual_minus_midpoint=None if actual is None else round(actual-midpoint,3),actual_vs_midpoint_pct=None if actual is None else round((actual-midpoint)/midpoint*100,3),range_result=status,direction_favorable='lower' if cost else 'higher',guidance_evidence=evidence,guidance_source_id=gs['source_id'],guidance_source_url=gs['url'],actual_source_id=ats['source_id'] if ats else None,actual_source_url=ats['url'] if ats else None,notes=notes)
rows=[]
for idx,p in enumerate(periods[1:]):
 for j,m in enumerate(metrics):
  note='Prior-quarter originally reported guidance; not an analyst consensus comparison.'
  if 'costs_and_expenses' in m:
   note+=' Range endpoints normalized to numerical low/high; issuer presents expenses in reverse order under low/high earnings scenarios. Includes cost of revenue, unlike the separate operating-expenses-only financial statement line.'
   if m.endswith('_gaap'): note+=' Actual is the sum of rounded GAAP cost of revenue and operating expenses in the release narrative, so approximate to $0.1m.'
   else: note+=' Actual follows original release narrative inclusive of non-GAAP cost of revenue; exclusions can vary across periods.'
  if p=='2024Q2' and m.endswith('_nongaap'): note+=' Original release says 77.1; Q2 webcast deck says 77.0. Retain release figure; range classification unaffected.'
  if p=='2024Q4' and m.endswith('_nongaap'): note+=' Original release says 89.1; Q4 2025 deck comparative shows 89.2. Retain release figure; classification unaffected.'
  if p=='2025Q4' and m=='royalties_revenue': note+=' Use detailed income statement 71,676 thousand (=71.676m); summary table says 71.6, whereas Q1 2026 deck rounds to 71.7. This presentation discrepancy does not change above-range classification.'
  rows.append(make_row(p,m,*guides[idx][j],actuals[idx][j],S[periods[idx]],S[p],note))
# Explicit total-revenue guidance appears in the Q2 outcome announcement retrospectively; keep distinct from the forward-issued sample.
r=make_row('2026Q2','total_revenue',192,198,207.4,S['2026Q1'],S['2026Q2'],'Prior total revenue guidance of 192–198 is explicitly restated in Q2 results; contemporaneous call audio not reviewed. Not derived by summing component guidance bounds. Issue date is the Q1-results call date; primary source establishing the range is the Q2 release.','retrospectively_restated_by_issuer')
r['guidance_source_id']=S['2026Q2']['source_id'];r['guidance_source_url']=S['2026Q2']['url'];rows.append(r)
for m,lo,hi in [('total_revenue',210,216),('product_revenue',110,116),('royalties_revenue',69,75),('contract_and_other_revenue',25,31),('total_operating_costs_and_expenses_gaap',133,137),('total_operating_costs_and_expenses_nongaap',115,119),('diluted_eps_gaap',.59,.67),('diluted_eps_nongaap',.75,.82)]:
 rows.append(make_row('2026Q3',m,lo,hi,None,S['2026Q2'],None,'Pending at 2026-10-19 cutoff; results scheduled for 2026-10-26. No licensing-billings guidance disclosed in this outlook table; royalties cannot be substituted for billings.'))
extra=[
('deck_2024Q2','Rambus Second Quarter 2024 Financial Results','https://investor.rambus.com/files/doc_financials/2024/q2/Earnings-Call-Webcast-Deck-2024Q2-v-final.pdf','2024-07-29','issuer_earnings_deck','Slides 3, 8, 12, 13; narrative, Q3 outlook, royalties/billings bridge, cost reconciliation'),
('deck_2025Q4','Rambus Fourth Quarter and Fiscal Year 2025 Financial Results','https://s202.q4cdn.com/680194126/files/doc_financials/2025/q4/Earnings-Call-Webcast-Deck-2025Q4-v-final.pdf','2026-02-02','issuer_earnings_deck','Slides 3, 5, 7, 11; narrative and Q1 2026 outlook'),
('deck_2026Q1','Rambus First Quarter 2026 Financial Results','https://s202.q4cdn.com/680194126/files/doc_financials/2026/q1/Earnings-Call-Webcast-Deck-2026Q1-v-final-2.pdf','2026-04-27','issuer_earnings_deck','Slides 3, 7, 11, 12; products, Q2 outlook, royalties/billings bridge and cost reconciliation'),
('presentation_2026Q3','Rambus Q3 2026 Investor Presentation','https://s202.q4cdn.com/680194126/files/doc_presentations/2026/Q326-Rambus-Investor-Presentation.pdf',None,'issuer_investor_deck','Issuer IR homepage Download PDF link; Q3 presentation is not a Q3 earnings release'),
('event_ms_2026','Morgan Stanley Technology, Media & Telecom Conference','https://investor.rambus.com/events-and-presentations/event-details/2026/Morgan-Stanley-Technology-Media--Telecom-Conference-2026-77iC9c4BN8/default.aspx','2026-03-02','issuer_conference_event','Event and official webcast link; no text transcript located'),
('webcast_ms_2026','Rambus Morgan Stanley webcast','https://event.webcasts.com/starthere.jsp?ei=1752482&tp_key=3ad67867a0&tp_special=8','2026-03-02','issuer_linked_webcast','Accessed from issuer event page; audio/transcript not reviewed'),
('notice_2026Q3','Rambus to Announce Third Quarter Fiscal Year 2026 Results',base+'2026/Rambus-to-Announce-Third-Quarter-Fiscal-Year-2026-Results/default.aspx','2026-10-05','issuer_event_notice','Call scheduled October 26, 2026 at 2 p.m. Pacific'),
('events_index','Rambus Events & Presentations','https://investor.rambus.com/events-and-presentations/default.aspx',None,'issuer_index','Dynamic archive returned limited text; transcript not found'),
('quarterly_index','Rambus Quarterly Results','https://investor.rambus.com/financials/quarterly-results/default.aspx',None,'issuer_index','Dynamic archive returned limited text; no archived transcript links retrieved')]
for sid,title,url,date,typ,loc in extra:sources.append(dict(source_id=sid,title=title,url=url,published_date=date,accessed_date='2026-10-19',publisher='Rambus Inc. / issuer-linked hosting',source_type=typ,authority='primary',locator=loc,retrieval='Opened with web tool',scope='Source provenance; no full transcript reproduced'))
def output_csv(filename,data):
 with (P/filename).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(data[0]));w.writeheader();w.writerows(data)
output_csv('guidance_track_record.csv',rows)
(P/'guidance_track_record.json').write_text(json.dumps(rows,indent=2)+'\n')
output_csv('source_registry.csv',sources)
(P/'source_registry.json').write_text(json.dumps(sources,indent=2)+'\n')
summary={}
for m in metrics:
 x=[r for r in rows if r['metric']==m and r['actual'] is not None]
 summary[m]={k:sum(r['range_result']==k for r in x) for k in ['below_range','within_range','above_range']}
 summary[m]['observations']=len(x)
summary['scope']={'as_of':'2026-10-19','contemporaneous_metric_comparisons':60,'quarters':'2024Q1–2026Q2','pending_2026Q3_rows':8,'retrospective_total_revenue_comparisons':1,'comprehensive':False}
(P/'sample_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
