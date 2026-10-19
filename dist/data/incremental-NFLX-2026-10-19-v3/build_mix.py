import json,pathlib,re
from lxml import html
R=pathlib.Path(__file__).resolve().parent;pro=json.loads((R/'source-provenance-v3.json').read_text());sources={x['file'].split('/')[-1]:x for x in pro['files']}
def row(f,ti,starts):
 t=html.fromstring((R/'sources'/f).read_bytes()).xpath('//table')[ti]
 for ri,r in enumerate(t.xpath('./tr|./tbody/tr')):
  cs=[' '.join(c.text_content().split()) for c in r.xpath('./td|./th')]
  if not cs or not any(cs[0].startswith(v) for v in starts):continue
  vals=[]
  for v in cs[1:]:
   x=v.replace('$','').replace(',','').strip()
   if x in ['—','–']:vals.append(0)
   elif re.fullmatch(r'\(?-?\d+(?:\.\d+)?\)?',x):vals.append(float(x.replace('(','').replace(')',''))*(-1 if x.startswith('(') else 1))
  return vals,{'url':sources[f]['url'],'source_sha256':sources[f]['sha256'],'locator':f'HTML table {ti}, row {ri}, {cs[0]}'}
 raise ValueError((f,ti,starts))
annual={y:{'year':y,'regions':None,'global_paid_memberships_m':None,'global_monthly_revenue_per_paying_membership':None} for y in range(2016,2026)}
for f,yrs,ti in [('nflx-20181231.htm',[2018,2017,2016],62),('nflx-20211231.htm',[2021,2020,2019],8),('nflx-20241231.htm',[2024,2023,2022],10)]:
 for field,prefix,scale in [('global_paid_memberships_m','Paid memberships at end',1000),('global_monthly_revenue_per_paying_membership','Average monthly revenue per paying',1)]:
  vs,p=row(f,ti,[prefix])
  for y,v in zip(yrs,vs[:3]):annual[y][field]=v/scale;annual[y].setdefault('provenance',{})[field]=p
for f,yrs,tis in [('nflx-20191231.htm',[2019,2018,2017],[113,114,115,116]),('nflx-20211231.htm',[2021,2020,2019],[32,33,34,35]),('nflx-20241231.htm',[2024,2023,2022],[37,38,39,40])]:
 for reg,ti in zip(['UCAN','EMEA','LATAM','APAC'],tis):
  vs,p=row(f,ti,['Revenues','Streaming revenues'])
  for y,v in zip(yrs,vs[:3]):
   if annual[y]['regions'] is None:annual[y]['regions']={}
   annual[y]['regions'][reg]={'revenue_usd_m':v/1000,'provenance':p}
for reg,prefix in [('UCAN','United States and Canada'),('EMEA','Europe, Middle East'),('LATAM','Latin America'),('APAC','Asia-Pacific')]:
 vs,p=row('nflx-20251231.htm',35,[prefix]);annual[2025].setdefault('regions',{})
 if annual[2025]['regions'] is None:annual[2025]['regions']={}
 annual[2025]['regions'][reg]={'revenue_usd_m':vs[0]/1000,'provenance':p}
annual[2016]['old_basis']={}
for reg,ti in [('Domestic streaming',66),('International streaming',67),('DVD',68)]:
 vs,p=row('nflx-20181231.htm',ti,['Revenues']);annual[2016]['old_basis'][reg]={'revenue_usd_m':vs[2]/1000,'provenance':p}
annual[2016]['regional_gap']='Four-region 2016 comparison not retrieved; old domestic/international segmentation retained, not mapped to UCAN/EMEA/LATAM/APAC.'
annual[2025]['membership_gap']='No comparable exact FY2025 membership/ARM table retrieved in this package. Periodic milestone disclosures are not substituted for an exact year-end count; null is not zero.'
(R/'operating-mix-history-v3.json').write_text(json.dumps({'annual':list(annual.values()),'notes':['Regions are geographic revenue disclosures, not separately valued businesses or segment EBITDA.','Membership and average monthly revenue per membership are reported issuer KPIs; changing ads, paid-sharing and plan mix reduce like-for-like explanatory power.','Global paid memberships are not individual viewer counts. Historical ARM should not be extrapolated into a current segment model without updated advertising and membership disclosures.']},indent=2)+'\n')
print('mix complete')
