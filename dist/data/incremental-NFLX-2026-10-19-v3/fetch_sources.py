import urllib.request,pathlib,json,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parent
S=ROOT/'sources';S.mkdir(exist_ok=True)
base='https://www.sec.gov/Archives/edgar/data/1065280/'
urls={
 'sec-companyfacts.json':'https://data.sec.gov/api/xbrl/companyfacts/CIK0001065280.json',
 'sec-submissions.json':'https://data.sec.gov/submissions/CIK0001065280.json',
 'submissions-history.json':'https://data.sec.gov/submissions/CIK0001065280-submissions-001.json',
 'nflx-20211231.htm':base+'000106528022000036/nflx-20211231.htm',
 'nflx-20231231.htm':base+'000106528024000030/nflx-20231231.htm',
 'nflx-20251231.htm':base+'000106528026000034/nflx-20251231.htm',
 'nflx-20260630.htm':base+'000106528026000212/nflx-20260630.htm',
 'ex991_q226.htm':base+'000106528026000211/ex991_q226.htm',
 'july-debt-8k.htm':base+'000119312526312575/d171951d8k.htm',
 'july-underwriting.htm':base+'000119312526312575/d171951dex11.htm',
 'nflx-20241231.htm':base+'000106528025000044/nflx-20241231.htm',
 'issuer-q3-announcement.html':'https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx',
 'issuer-events.html':'https://ir.netflix.net/investor-news-and-events/investor-events/default.aspx?ShowNotify=175786',
 'july-event-8k.htm':base+'000106528026000214/nflx-20260726.htm',
}
for f,u in urls.items():
 if not (S/f).exists():
  b=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Atlas Financial Research research@example.com'}),timeout=60).read();(S/f).write_bytes(b)
 print(f,(S/f).stat().st_size,flush=True)
h=json.loads((S/'submissions-history.json').read_text())
for y in [2018,2019]:
 i=next(i for i in range(len(h['form'])) if h['form'][i]=='10-K' and h['reportDate'][i]==f'{y}-12-31')
 u=base+h['accessionNumber'][i].replace('-','')+'/'+h['primaryDocument'][i];f=f'nflx-{y}1231.htm';urls[f]=u
 if not (S/f).exists():(S/f).write_bytes(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Atlas Financial Research research@example.com'}),timeout=60).read())
 print(f,(S/f).stat().st_size,flush=True)
manifest={'provenance_built_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'retrieval_note':'Existing retained files are reused. Build timestamp is not a claim that all sources were fetched now; preserve frozen provenance for original capture times.','information_cutoff':'2026-10-19','files':[{'file':'sources/'+f,'url':u,'sha256':hashlib.sha256((S/f).read_bytes()).hexdigest(),'bytes':(S/f).stat().st_size} for f,u in urls.items()]}
(ROOT/'source-provenance-v3.json').write_text(json.dumps(manifest,indent=2)+'\n')
