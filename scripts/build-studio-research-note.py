"""Build the readable public preset rationale from the reviewed local Markdown."""
from pathlib import Path
import html,re
ROOT=Path(__file__).resolve().parents[1]
def inline(text):
    value=html.escape(text)
    value=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',lambda m:f'<a href="{m[2]}" target="_blank" rel="noopener">{m[1]}</a>',value)
    return re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',value)
def render(text):
    result=[];paragraph=[];list_open=False;table=[]
    def flush():
        if paragraph:result.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
    def flush_table():
        if not table:return
        rows=[line.strip('|').split('|') for line in table]
        result.append('<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable research comparison"><table><thead><tr>'+''.join('<th scope="col">'+inline(x.strip())+'</th>' for x in rows[0])+'</tr></thead><tbody>')
        for row in rows[2:]:result.append('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+inline(x.strip())+('</th>' if i==0 else '</td>') for i,x in enumerate(row))+'</tr>')
        result.append('</tbody></table></div>');table.clear()
    for line in text.splitlines()+['']:
        if line.startswith('|'):flush();table.append(line);continue
        flush_table()
        if line.startswith('- '):
            flush()
            if not list_open:result.append('<ul>');list_open=True
            result.append('<li>'+inline(line[2:])+'</li>');continue
        if list_open:result.append('</ul>');list_open=False
        if line.startswith('#'):
            flush();level=len(line)-len(line.lstrip('#'));title=line[level:].strip();anchor=title if level==3 and re.fullmatch('[A-Z]+',title) else re.sub('[^a-z0-9]+','-',title.lower()).strip('-');result.append(f'<h{level} id="{anchor}">'+inline(title)+f'</h{level}>')
        elif line.strip():paragraph.append(line)
        else:flush()
    return '\n'.join(result)
body=render((ROOT/'STUDIO-RESEARCH-PRESETS.md').read_text())
css='''*{box-sizing:border-box}body{margin:0;background:#f7f6f2;color:#182c48;font:16px/1.65 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:32px 28px 70px}nav{display:flex;flex-wrap:wrap;gap:10px 24px;margin-bottom:30px}a{color:#2154ba;overflow-wrap:anywhere}a:focus-visible,div[tabindex]:focus-visible{outline:3px solid #2154ba;outline-offset:4px}h1{font-size:38px;line-height:1.2;letter-spacing:-1px}h2{font-size:25px;margin:40px 0 15px;border-top:1px solid #ccd5df;padding-top:24px}h3{font-size:21px;margin:30px 0 12px}p,li{max-width:78ch}li{margin:8px 0}.table-scroll{overflow:auto;margin:22px 0;border:1px solid #ccd5df;border-radius:8px}table{border-collapse:collapse;min-width:750px;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #ccd5df}thead{background:#e9edf3}tbody th{font-weight:600}footer{font-size:14px;margin-top:40px;border-top:1px solid #ccd5df;padding-top:18px}@media(max-width:600px){main{padding:22px 18px 50px}h1{font-size:30px}h2{font-size:23px}.table-scroll{max-width:100%}}'''
page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Complete Studio research presets · Valuation Lab</title><style>{css}</style></head><body><main><nav aria-label="Research report navigation"><a href="../#renewed">← Annual model</a><a href="studio-research-presets-2026-10-17-v1.json">Complete preset JSON</a><a href="studio-research-presets-validation-2026-10-17-v1.json">Research validation results</a></nav>{body}<footer>Analytical source-linked scenarios as of 17 October 2026. Read dated claim and uncertainty limitations before using the values.</footer></main></body></html>'''
(ROOT/'dist/data/studio-research-presets-2026-10-17-v1.html').write_text(page)
print('Built readable Studio research preset report')

# Apply reviewed presentation overlays after regenerating the English report.
import subprocess, sys
subprocess.run([sys.executable, str(ROOT / "scripts/localize-research-pages.py"), "--apply"], check=True)
