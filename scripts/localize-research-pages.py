#!/usr/bin/env python3
"""Inventory authored HTML and apply reviewed Traditional Chinese presentation overlays.
Never edits JSON data, source URLs, numerical inputs, or original source documents.
Missing entries remain English and are reported, never represented as translated.
Run after any HTML generator. English text is retained inside explicit leaf markers.
"""
from html.parser import HTMLParser
from pathlib import Path
import argparse, hashlib, html, json, re, os
ROOT=Path(__file__).resolve().parents[1]
TRANSLATIONS=ROOT/'scripts/research-translations'
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
def key(text):return 'text.'+hashlib.sha256(text.encode()).hexdigest()[:20]
class Inventory(HTMLParser):
 def __init__(self,source,prose_pre=False):
  super().__init__(convert_charrefs=True);self.source=source;self.prose_pre=prose_pre;self.stack=[];self.entries={};self.nodes=[];self.excluded=[];self.last_dt='';self.lines=[0]
  for m in re.finditer('\n',source):self.lines.append(m.end())
 def source_offset(self):line,col=self.getpos();return self.lines[line-1]+col
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='dd' and re.sub('[^a-z]','',self.last_dt.lower()) in {'quote','sourcequote','sourceexcerpt','verbatim','verbatimquote','exactquote','originalquote','excerpt'}:attrs['data-source-original']='true'
  if tag not in VOID:self.stack.append((tag,attrs))
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i][0]==tag:self.stack=self.stack[:i];break
 def handle_data(self,text):
  if self.stack and self.stack[-1][0]=='dt':self.last_dt=text
  if not text.strip() or not re.search('[A-Za-z]{2}',text):return
  tags={t for t,a in self.stack}
  if tags&{'script','style','code'} or ('pre' in tags and not self.prose_pre):return
  if any('data-i18n' in a for t,a in self.stack):return
  # A direct external quotation is original-language evidence, not authored analysis.
  if 'blockquote' in tags or any(a.get('data-source-original')=='true' for t,a in self.stack):
   self.excluded.append({'text':text,'reason':'original-language source quotation'});return
  if re.fullmatch(r'\s*(?:https?://\S+|[A-Z][A-Z0-9.:_-]{1,}|\d[\d\s.,%×$+−–:/()-]*|[\w./-]+\.(?:json|pdf|html|csv|md)(?:#[\w:.-]+)?)\s*',text):return
  start=self.source_offset();end=self.source.find('<',start)
  if end<0:end=len(self.source)
  raw=self.source[start:end]
  # HTMLParser decodes entities; preserve exact displayed English including whitespace.
  english=html.unescape(raw)
  k=key(english);self.entries[k]=english
  self.nodes.append({'start':start,'end':end,'key':k,'tag':self.stack[-1][0] if self.stack else None})
def write_json(path,data):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');args=ap.parse_args()
 TRANSLATIONS.mkdir(exist_ok=True)
 overlays={}
 for f in sorted(TRANSLATIONS.rglob('*.zh-Hant.json')):
  for k,v in json.loads(f.read_text()).items():
   if k in overlays and overlays[k]!=v:raise ValueError(f'Conflicting reviewed translation {k}: {f}')
   overlays[k]=v
 report=[];all_entries={};presentation={}
 for path in sorted((ROOT/'dist/data').rglob('*.html')):
  source=path.read_text()
  # Restore our own explicit leaf spans before a repeat build, without touching authored markup.
  source=re.sub(r'<span data-research-i18n="true" data-i18n="research-pages\.[^"]+">([\s\S]*?)</span>',lambda m:m[1],source)
  source=re.sub(r'<link data-research-locale="true"[^>]*>\n<script data-research-locale="true"[^>]*></script>','',source)
  original=source
  parser=Inventory(source,prose_pre=path.name=='provider-research.html');parser.feed(source);entries=parser.entries
  slug=path.relative_to(ROOT/'dist/data').as_posix().replace('/','__').removesuffix('.html')
  write_json(TRANSLATIONS/(slug+'.en.json'),entries);all_entries.update(entries)
  translated={k:overlays[k] for k in entries if k in overlays}
  report.append({'page':str(path.relative_to(ROOT/'dist')),'uniqueAuthoredSegments':len(entries),'translatedSegments':sum(entries[k]!=v for k,v in translated.items()),'preservedOriginalSegments':sum(entries[k]==v for k,v in translated.items()),'coveredSegments':len(translated),'missingKeys':sorted(set(entries)-set(translated)),'missingEnglishText':[entries[k] for k in sorted(set(entries)-set(translated))],'originalQuotationSegments':len(parser.excluded),'complete':len(entries)==len(translated)})
  if args.apply:
   pieces=[];cursor=0
   for node in parser.nodes:
    k=node['key']
    if k not in translated or node['tag']=='title':continue
    start,end=node['start'],node['end']
    pieces.extend([source[cursor:start],f'<span data-research-i18n="true" data-i18n="research-pages.{k}">',source[start:end],'</span>']);cursor=end
   pieces.append(source[cursor:]);source=''.join(pieces)
   rel=os.path.relpath(ROOT/'dist',path.parent)
   assets=f'<link data-research-locale="true" rel="stylesheet" href="{rel}/i18n.css">\n<script data-research-locale="true" type="module" src="{rel}/research-page-i18n.js"></script>'
   source=source.replace('</head>',assets+'</head>',1) if '</head>' in source else source+assets
   path.write_text(source)
   presentation[str(path.relative_to(ROOT/'dist'))]={'originalEnglishSHA256':hashlib.sha256(original.encode()).hexdigest(),'originalEnglishBytes':len(original.encode()),'presentationSHA256':hashlib.sha256(source.encode()).hexdigest(),'presentationBytes':len(source.encode())}
 # Shared exact-message presentation lookup for authored data-prose render boundaries.
 source_entries=dict(all_entries)
 for catalog in sorted(TRANSLATIONS.rglob('*.en.json')):
  source_entries.update(json.loads(catalog.read_text()))
 reviewed_en={k:v for k,v in source_entries.items() if k in overlays}
 reviewed_zh={k:overlays[k] for k in reviewed_en}
 for locale,values in [('en',reviewed_en),('zh-Hant',reviewed_zh)]:
  (ROOT/f'dist/locales/research-prose.{locale}.js').write_text('export default '+json.dumps(values,ensure_ascii=False,indent=2)+';\n')
 (ROOT/'dist/locales/research-prose-pairs.js').write_text('export default '+json.dumps([[v,reviewed_zh[k]] for k,v in reviewed_en.items()],ensure_ascii=False,indent=2)+';\n')
 # Record stable source-file + RFC6901 paths and full English hashes without editing sources.
 provenance={};source_hashes={}
 def walk_json(value,file,pointer=''):
  if isinstance(value,str):
   k=key(value)
   if k in reviewed_en and reviewed_en[k]==value:provenance.setdefault(k,[]).append({'file':file,'pointer':pointer,'englishSHA256':hashlib.sha256(value.encode()).hexdigest()})
  elif isinstance(value,dict):
   for name,item in value.items():walk_json(item,file,pointer+'/'+str(name).replace('~','~0').replace('/','~1'))
  elif isinstance(value,list):
   for i,item in enumerate(value):walk_json(item,file,pointer+'/'+str(i))
 for source_file in sorted((ROOT/'dist/data').rglob('*.json')):
  raw=source_file.read_bytes();name=str(source_file.relative_to(ROOT/'dist'))
  source_hashes[name]=hashlib.sha256(raw).hexdigest();walk_json(json.loads(raw),name)
 write_json(ROOT/'dist/locales/research-prose-provenance.json',{'schemaVersion':1,'sourceFilesSHA256':source_hashes,'entries':provenance})

 write_json(ROOT/'dist/locales/research-pages.en.json', {k:all_entries[k] for k in overlays if k in all_entries})
 write_json(ROOT/'dist/locales/research-pages.zh-Hant.json',{k:v for k,v in overlays.items() if k in all_entries})
 write_json(ROOT/'dist/locales/research-pages-coverage.json',{'schemaVersion':1,'translationPolicy':'Reviewed exact whole-text overlays only; source quotations, identifiers, URLs, code and raw JSON retained. Missing authored prose is incomplete, not an exception.','pages':report,'unusedTranslationKeys':sorted(set(overlays)-set(all_entries))})
 if args.apply:write_json(ROOT/'dist/locales/research-presentation-manifest.json',{'schemaVersion':1,'policy':'Frozen research source manifest and JSON remain unchanged. Original English HTML hashes refer to exact output before reversible localization-only leaf wrappers and asset references.','pages':presentation})
 print(json.dumps({'pages':len(report),'uniqueSegments':len(all_entries),'coveredUniqueSegments':len(set(overlays)&set(all_entries)),'completePages':sum(r['complete'] for r in report)}))
if __name__=='__main__':main()
