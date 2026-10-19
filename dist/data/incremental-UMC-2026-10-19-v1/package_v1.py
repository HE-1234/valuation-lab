import pathlib,json,hashlib,zipfile
P=pathlib.Path(__file__).parent
excluded_dirs={'sources','private-sources','__pycache__'}
raw=[];public=[]
for f in sorted(P.rglob('*')):
 if not f.is_file():continue
 rel=f.relative_to(P)
 if any(x in {'sources','private-sources'} for x in rel.parts):
  raw.append({'path':str(rel),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()});continue
 if any(x in excluded_dirs for x in rel.parts) or f.suffix not in {'.json','.md','.csv','.py'} or f.name in {'integrity-manifest-v1.json','public-bundle-sha256.json'}:continue
 public.append(rel)
(P/'private-source-integrity-v1.json').write_text(json.dumps({'scope':'Local frozen originals and text derivatives; bytes NOT included in public bundle','files':raw},indent=2))
if pathlib.Path('private-source-integrity-v1.json') not in public:public.append(pathlib.Path('private-source-integrity-v1.json'))
public=sorted(public)
manifest={'ticker':'UMC','version':'v1','cutoff':'2026-10-19','current_target':None,'selected_policy':None,'raw_sources_excluded':True,'files':[{'path':str(r),'bytes':(P/r).stat().st_size,'sha256':hashlib.sha256((P/r).read_bytes()).hexdigest()} for r in public]}
(P/'integrity-manifest-v1.json').write_text(json.dumps(manifest,indent=2))
with zipfile.ZipFile(P/'UMC-public-safe-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
 for r in public+[pathlib.Path('integrity-manifest-v1.json')]:z.write(P/r,str(r))
z=P/'UMC-public-safe-v1.zip';out={'file':z.name,'bytes':z.stat().st_size,'sha256':hashlib.sha256(z.read_bytes()).hexdigest(),'public_file_count':len(public)+1,'private_source_file_count':len(raw)}
(P/'public-bundle-sha256.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
