from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request,urllib.parse,hashlib,json,datetime,subprocess
from lxml import html
P=Path(__file__).resolve().parent; S=P/'private-sources'; S.mkdir(exist_ok=True)
manifest=[]
def get(url,name):
 p=S/name
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 research contact investor research'})
  with urllib.request.urlopen(req,timeout=60) as r: data=r.read();status=r.status
  p.write_bytes(data)
  rec={'id':name,'url':url,'local_path':str(p),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'retrieved_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'http_status':status,'source_type':'issuer_original','private_only':True}
  if data.startswith(b'%PDF'):
   t=S/(name+'.txt');subprocess.run(['pdftotext','-layout',str(p),str(t)],check=True);rec['text_path']=str(t)
  manifest.append(rec);return data
 except Exception as e: manifest.append({'id':name,'url':url,'error':str(e)});return b''
def quarter(y,q):
 u=f'https://www.umc.com/en/Download/quarterly_results/QuarterlyResultsDetail/{y}/{y}Q{q}'
 d=get(u,f'{y}Q{q}-index.html');links=[]
 if d:
  h=html.fromstring(d)
  for a in h.xpath('//a[@href]'):
   label=' '.join(a.text_content().split());href=urllib.parse.urljoin(u,a.attrib['href'])
   if (('Report' in label or 'Presentation' in label or 'Financial Statement' in label or 'Call Details' in label or 'Investor Conference Call' in label) and '.pdf' in href.lower()):
    typ='report' if 'Report' in label else 'presentation' if 'Presentation' in label else 'financials' if 'Financial Statement' in label else 'call-notice'
    if typ=='financials' and (y,q)!=(2026,2):continue
    get(href,f'{y}Q{q}-{typ}.pdf');links.append((label,href))
  manifest.append({'id':f'{y}Q{q}-links','discovered_links':links,'quarter':f'{y}Q{q}'})
 return f'{y}Q{q}'
get('https://www.umc.com/en/Download/quarterly_results/QuarterlyResults','quarterly-results-index.html')
qs=[(2023,4)]+[(y,q) for y in (2024,2025) for q in (1,2,3,4)]+[(2026,1),(2026,2),(2026,3)]
with ThreadPoolExecutor(max_workers=6) as ex:
 for r in ex.map(lambda v:quarter(*v),qs):print(r,flush=True)
get('https://www.sec.gov/Archives/edgar/data/1033767/000119312526322027/umc-ex99.htm','sec-20260729-ex99.html')
(P/'source_manifest.json').write_text(json.dumps(manifest,indent=2))
print('sources',len(manifest))
