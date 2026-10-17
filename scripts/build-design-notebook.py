"""Render the repository's short, restricted Markdown notebook without dependencies."""
from pathlib import Path
import html,re
ROOT=Path(__file__).resolve().parents[1]
def inline(text):
 text=html.escape(text)
 return re.sub(r'\[([^\]]+)\]\((https://[^\s)]+)\)',lambda m:f'<a href="{m[2]}" target="_blank" rel="noopener">{m[1]}</a>',text)
def render(text):
 out=[];paragraph=[];list_type=None
 def flush():
  if paragraph:out.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
 for line in text.splitlines()+['']:
  item=re.match(r'^(- |\d+\. )(.*)',line)
  kind='ul' if item and item[1]=='- ' else 'ol' if item else None
  if kind!=list_type and list_type:out.append(f'</{list_type}>');list_type=None
  if item:
   flush()
   if not list_type:list_type=kind;out.append(f'<{kind}>')
   out.append('<li>'+inline(item[2])+'</li>')
  elif not line.strip():flush()
  elif line.startswith('#'):
   flush();level=len(line)-len(line.lstrip('#'));out.append(f'<h{level}>'+inline(line[level:].strip())+f'</h{level}>')
  else:paragraph.append(line)
 return '\n'.join(out)
css='''*{box-sizing:border-box}html{color-scheme:light;scroll-behavior:smooth}body{margin:0;background:#f4f5f8;color:#171a24;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.7}main{max-width:880px;padding:42px 36px 80px;margin:auto}nav{display:flex;flex-wrap:wrap;gap:10px 24px;border-bottom:1px solid #d9dde7;padding-bottom:22px;margin-bottom:40px;font-size:14px}a{color:#3142b5;text-decoration-thickness:1px;text-underline-offset:3px;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #3142b5;outline-offset:4px}h1{font-size:clamp(34px,6vw,50px);letter-spacing:-1.5px;line-height:1.15;margin:0 0 24px;font-weight:550}h2{font-size:26px;line-height:1.3;letter-spacing:-.6px;margin:46px 0 20px;border-top:1px solid #d9dde7;padding-top:28px;font-weight:550}h3{font-size:18px;line-height:1.4;margin:30px 0 12px;font-weight:600}p,li{font-size:16px}p{margin:14px 0}ul,ol{padding-left:25px}li{padding-left:5px;margin:12px 0}section+section{margin-top:65px}footer{border-top:1px solid #d9dde7;margin-top:50px;padding-top:18px;font-size:13px;color:#555d70}@media(max-width:480px){main{padding:25px 20px 55px}nav{margin-bottom:30px}h2{font-size:23px}p,li{font-size:16px}ul,ol{padding-left:21px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}'''
body=render((ROOT/'DESIGN-STUDY.md').read_text())
changelog=render((ROOT/'CHANGELOG.md').read_text()).replace('<h1>Change log</h1>','<h1>Change log</h1>',1)
page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Design notebook · Valuation Lab</title><style>{css}</style></head><body><main><nav aria-label="Notebook navigation"><a href="../">← Valuation Lab</a><a href="#study">Study notes</a><a href="#changes">Change log</a><a href="company-base-cases.json">Company research ledger</a><a href="simulation-methodology.html">Simulation method</a></nav><section id="study">{body}</section><section id="changes">{changelog}</section><footer>Valuation Lab · Original design notes and implementation record · Updated 17 October 2026</footer></main></body></html>'''
(ROOT/'dist/data/design-notebook.html').write_text(page)
print('Built dist/data/design-notebook.html')
