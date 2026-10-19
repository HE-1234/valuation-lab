import pathlib,json,urllib.request,hashlib,concurrent.futures
from lxml import html
P=pathlib.Path(__file__).parent;S=P/'sources';r=json.loads((S/'submissions.json').read_text())['filings']['recent'];items=[]
for i,f in enumerate(r['form']):
 if (f=='20-F' and '2017-01-01'<=r['filingDate'][i]<='2026-10-19') or (f=='6-K' and '2026-07-01'<=r['filingDate'][i]<='2026-10-19'):
  acc=r['accessionNumber'][i].replace('-','');doc=r['primaryDocument'][i];items.append((f+'_'+r['filingDate'][i]+'_'+doc,f'https://www.sec.gov/Archives/edgar/data/1033767/{acc}/{doc}'))
items.extend([('Q2-2026-financials.htm','https://www.sec.gov/Archives/edgar/data/1033767/000119312526322030/umc-ex99_1.htm'),('Q2-2026-release.htm','https://www.sec.gov/Archives/edgar/data/1033767/000119312526322027/umc-ex99.htm'),('robinhood.html','https://robinhood.com/us/en/stocks/UMC/')])
def fetch(t):
 name,url=t;p=S/name
 if not p.exists():p.write_bytes(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Research contact analyst@example.com'}),timeout=90).read())
 b=p.read_bytes()
 if name.endswith(('.htm','.html')):(S/(name+'.txt')).write_text(html.fromstring(b).text_content())
 print(name,len(b),flush=True);return {'file':'sources/'+name,'url':url,'retrieved_at':'2026-10-19','sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as e:ledger=list(e.map(fetch,items))
for name,url in [('companyfacts.json','https://data.sec.gov/api/xbrl/companyfacts/CIK0001033767.json'),('submissions.json','https://data.sec.gov/submissions/CIK0001033767.json')]:
 b=(S/name).read_bytes();ledger.append({'file':'sources/'+name,'url':url,'retrieved_at':'2026-10-19','sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)})
(P/'source-ledger-v1.json').write_text(json.dumps(ledger,indent=2))
