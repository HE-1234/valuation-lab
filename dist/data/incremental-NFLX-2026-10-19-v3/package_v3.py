import json,pathlib,hashlib,zipfile
R=pathlib.Path(__file__).resolve().parent
files=[p for p in sorted(R.iterdir()) if p.is_file() and p.name not in ['manifest-v3.json','NFLX-public-safe-v3.zip']]
m={'ticker':'NFLX','version':3,'frozen_date':'2026-10-19','capital_anchor':'2026-06-30','information_cutoff':'2026-10-19','independent_review':'pending, separate verdict required; frozen snapshot not retroactively rewritten','public_safe':True,'sources_excluded':True,'files':[{'path':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files]}
(R/'manifest-v3.json').write_text(json.dumps(m,indent=2)+'\n')
with zipfile.ZipFile(R/'NFLX-public-safe-v3.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files+[R/'manifest-v3.json']:z.write(p,arcname='NFLX-v3/'+p.name)
print('public artifacts',len(files),'manifest',hashlib.sha256((R/'manifest-v3.json').read_bytes()).hexdigest(),'ZIP',hashlib.sha256((R/'NFLX-public-safe-v3.zip').read_bytes()).hexdigest())
