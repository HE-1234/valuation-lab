from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request,hashlib,json,datetime
from lxml import html
P=Path(__file__).resolve().parent;S=P/'private-sources'
u=[('singapore-original-20220224.html','https://www.umc.com/en/News/press_release/Content/corporate/20220224-1'),('singapore-inauguration-20250401.html','https://www.umc.com/en/News/press_release/Content/corporate/20250401'),('intel-12nm-20240125.html','https://www.intc.com/news-events/press-releases/detail/1671/intel-and-umc-announce-new-foundry-collaboration'),('silith-20260714.html','https://www.umc.com/en/News/press_release/Content/technology_related/20260714'),('umc-logic-technology.html','https://www.umc.com/en/Product/technologies/Index/')]
def dl(v):
 n,url=v
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as r:d=r.read()
  (S/n).write_bytes(d);h=html.fromstring(d);(S/(n+'.txt')).write_text(h.text_content())
  return {'id':n,'url':url,'local_path':str(S/n),'sha256':hashlib.sha256(d).hexdigest(),'bytes':len(d),'retrieved_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_type':'issuer_original','private_only':True}
 except Exception as e:return {'id':n,'url':url,'error':str(e)}
with ThreadPoolExecutor(max_workers=5) as ex:r=list(ex.map(dl,u))
(P/'expansion_source_manifest.json').write_text(json.dumps(r,indent=2));print(r)
