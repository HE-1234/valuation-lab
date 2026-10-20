"""Verify frozen public-safe package hashes. Does not rewrite research files."""
import hashlib,json,pathlib,sys
P=pathlib.Path(__file__).resolve().parent
m=json.loads((P/'manifest-v2.json').read_text());errors=[]
for name,want in m['sha256'].items():
 f=P/name
 if not f.is_file():errors.append('Missing '+name)
 elif hashlib.sha256(f.read_bytes()).hexdigest()!=want:errors.append('Hash mismatch '+name)
if errors:
 print('\n'.join(errors));sys.exit(1)
print('Verified',len(m['sha256']),'frozen files; publication/current-equity admission remains false')
