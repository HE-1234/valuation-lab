from lxml import html
from pathlib import Path
import json,logging,re,sys
from weasyprint import HTML
logging.getLogger('weasyprint').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/valuation-v8-previews')
OUT.mkdir(parents=True,exist_ok=True)
cssbase=(root/'dist/style.css').read_text()+'\n'+(root/'dist/studio.css').read_text()
def token(theme,name):
 value=None
 for selector,body in re.findall(r'([^{}]+)\{([^{}]+)\}',cssbase):
  if ':root' in selector or re.search(r'data-theme=[\"\']?'+re.escape(theme)+r'[\"\']?\]',selector):
   match=re.search(r'--'+name+r'\s*:\s*([^;}]+)',body)
   if match:value=match[1].strip()
 return value or '#254fa9'
# The print renderer does not evaluate viewport-width queries. Apply matching
# source media blocks in original order for a static screen approximation.
def flatten(css,width):
 out='';i=0
 while i<len(css):
  m=re.search(r'@media\s*([^\{]+)\{',css[i:])
  if not m:return out+css[i:]
  a=i+m.start();b=i+m.end();out+=css[i:a];depth=1;j=b
  while j<len(css) and depth:
   if css[j]=='{':depth+=1
   elif css[j]=='}':depth-=1
   j+=1
  condition=m.group(1);mx=re.search(r'max-width:\s*(\d+)px',condition);mn=re.search(r'min-width:\s*(\d+)px',condition)
  if ('prefers-reduced-motion' in condition) or ((mx or mn) and (not mx or width<=int(mx[1])) and (not mn or width>=int(mn[1]))):out+=flatten(css[b:j-1],width)
  i=j
 return out
for ticker,theme,step,width,only in [('AAPL','slate',2,1440,''),('AAPL','slate',2,390,''),('AAPL','slate',2,320,''),('MSFT','slate',3,390,''),('AAPL','slate',5,390,''),('NVDA','forest',6,390,''),('TSM','slate',2,390,''),('COHR','slate',2,390,''),('NBIS','slate',2,320,''),('AAPL','slate',2,320,'expanded'),('AAPL','slate',2,390,'shapes'),('AAPL','slate',2,320,'shapes'),('MU','slate',2,390,''),('AAPL','slate',2,390,'case'),('AAPL','slate',2,320,'case')]:
 s=html.fromstring((root/'dist/index.html').read_text());s.set('data-theme',theme)
 data=json.loads((OUT/f'v8-{ticker}-{theme}-{"shapes" if only=="shapes" else step}.json').read_text())
 # Fill parent nodes before descendant nodes (actual runtime insertion order).
 for sel,props in data.items():
  if not sel.startswith('#'):continue
  nodes=s.xpath('//*[@id="'+sel[1:]+'"]')
  if not nodes:continue
  el=nodes[0]
  if props.get('innerHTML'):
   for ch in list(el):el.remove(ch)
   el.text=None
   for f in html.fragments_fromstring(props['innerHTML']):
    if isinstance(f,str):el.text=(el.text or '')+f
    else:el.append(f)
  elif props.get('textContent'):el.text=props['textContent']
 if only=='simulation':
  body=s.xpath('//body')[0];sim=s.xpath('//*[@id="simulation-lab"]')[0]
  for el in list(body):body.remove(el)
  main=html.Element('main');main.set('class','preview-simulation');main.append(sim);body.append(main)
 for e in s.xpath('//*[local-name()="svg" and parent::div[@class="history-trend"]]'):
  for path in e.xpath('.//*[local-name()="path"]'):path.set('stroke',token(theme,'accent'));path.set('fill','none')
  for dot in e.xpath('.//*[local-name()="circle"]'):dot.set('fill',token(theme,'accent'))
 for e in s.xpath('//*[local-name()="svg" and parent::div[@class="mc-shape-preview"]]'):
  for part in e.xpath('.//*[local-name()="path" or local-name()="line"]'):part.set('stroke',token(theme,'signal'));part.set('fill','none')
 if only=='case':
  body=s.xpath('//body')[0];case=s.xpath('//div[@class="base-case-control"]')[0]
  for el in list(body):body.remove(el)
  main=html.Element('main');main.append(case);body.append(main)
  for details in case.xpath('.//details'):details.set('open','open')
 if only=='shapes':
  body=s.xpath('//body')[0];settings=s.xpath('//details[@class="mc-settings"]')[0]
  for el in list(body):body.remove(el)
  main=html.Element('main');panel=html.Element('div');panel.set('class','value-column');settings.set('open','open');panel.append(settings);main.append(panel);body.append(main)
 for e in s.xpath('//select'):
  opts=e.xpath('./option[@selected]') or e.xpath('./option');value=opts[0].text if opts else ''
  for ch in list(e):e.remove(ch)
  e.tag='div';e.set('class','preview-select');e.text=value
 for e in s.xpath('//input'):
  e.tag='div';e.set('class',e.get('class','')+' preview-input');e.text=' ' if e.get('type')=='range' else e.get('value','')
 for e in s.xpath('//script|//link'):e.getparent().remove(e)
 if only=='expanded':
  for e in s.xpath('//details[@class="history-years"]'):e.set('open','open')
 for e in s.xpath('//details[not(@open)]'):
  for ch in list(e):
   if ch.tag!='summary':e.remove(ch)
 css=flatten(cssbase,width)+f'\n@page{{size:{width}px 2400px;margin:0}}body{{width:{width}px}}'+'.preview-select{display:block;min-height:26px}.preview-input{display:block;min-height:46px;padding:10px;border:1px solid var(--control);border-radius:8px}.driver-number .preview-input{font-size:26px;border:0;text-align:right;padding:7px 8px;width:75px}.driver-range{height:4px!important;min-height:4px!important;background:var(--accent);border:0;margin:21px 0}.value-column{position:relative}.mc-chart svg{height:245px}.appearance-disclosure{position:absolute}.company-control select{padding:0}.mc-scrubber-label .preview-input{height:3px;min-height:3px;background:var(--signal);flex:1;padding:0}.studio-toolbar .preview-select{font-size:16px}.studio-toolbar .baseline-control .preview-select{font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value-column summary::-webkit-details-marker{display:none}'
 if only=='shapes':css+='.value-column{width:100%;margin-top:18px}.mc-input-grid{display:block!important}.mc-input-grid fieldset{margin-bottom:20px}.mc-driver-parameters{display:grid!important}.mc-shape-preview svg{height:66px}'
 if width<=390:css+='.mc-chart svg{height:153px}.studio-columns{display:block}.value-column{margin-bottom:25px}.studio-toolbar{display:grid;grid-template-columns:1.1fr 1fr}.baseline-control{width:145px}body>aside{display:block}.brand{display:flex;width:170px}body>aside nav{display:flex;margin-top:13px}.appearance-disclosure{position:absolute}input{max-width:100%}'
 st=html.Element('style');st.text=css;s.xpath('//head')[0].append(st)
 out=OUT/f'v8-{ticker}-{theme}-{step}-{width}{"-"+only if only else ""}'
 HTML(string=html.tostring(s,encoding='unicode'),base_url=str(root/'dist'),media_type='screen').write_pdf(str(out)+'.pdf');print(out)
