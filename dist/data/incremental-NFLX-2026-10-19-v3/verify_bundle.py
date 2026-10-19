"""Verify public-safe bundle and, when present, original source snapshots."""
import json,pathlib,hashlib,sys
R=pathlib.Path(__file__).resolve().parent
m=json.loads((R/'manifest-v3.json').read_text());errors=[]
for x in m['files']:
 p=R/x['path']
 if not p.is_file():errors.append('missing '+x['path'])
 elif hashlib.sha256(p.read_bytes()).hexdigest()!=x['sha256']:errors.append('hash '+x['path'])
s=json.loads((R/'source-provenance-v3.json').read_text());present=0
for x in s['files']:
 p=R/x['file']
 if p.is_file():
  present+=1
  if hashlib.sha256(p.read_bytes()).hexdigest()!=x['sha256']:errors.append('source hash '+x['file'])
print(json.dumps({'public_files_checked':len(m['files']),'source_snapshots_present_and_checked':present,'source_snapshot_count':len(s['files']),'source_files_omitted_from_public_zip':True,'errors':errors},indent=2))
if errors:sys.exit(1)
