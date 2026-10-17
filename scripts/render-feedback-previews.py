#!/usr/bin/env python3
"""Generate static before/after feedback previews from actual runtime markup.
No browser automation. See output README for renderer-only approximations.
"""
from pathlib import Path
import argparse, copy, hashlib, json, logging, os, re, subprocess, sys
sys.path[:0]=['/tmp/valuation-render-tools']
os.environ.setdefault('XDG_CACHE_HOME','/tmp/valuation-feedback-cache')
from lxml import html, etree
from weasyprint import HTML
logging.getLogger('weasyprint').setLevel(logging.ERROR)
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/workspace/shared/ui-feedback/before-v24')
OUT=Path('/workspace/shared/ui-feedback/previews')
NODE=r'''
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {pathToFileURL} from 'node:url';
const root=process.argv[2],out=process.argv[3];
const module=async p=>import(pathToFileURL(path.join(root,p)));
const {startResearchWorkspace,minimalDocument}=await module('tests/research-workspace-harness.mjs');
const {startStudio}=await module('tests/v7-runtime-harness.mjs');
const {fixture}=await module('tests/v7-simulation-harness.mjs');
const {annualResearchSimulationAdapter}=await module('dist/research-simulation-view.js');
const dump=e=>({tag:e.tag,attrs:e.attrs,html:e._html||'',text:e._text||'',value:e.value,hidden:e.hidden,disabled:e.disabled,children:(e.children||[]).map(dump)});
function simulation(snapshot,draft,adapter){
 const f=fixture({reduced:true,autoplay:false,synchronous:true,snapshotOverride:snapshot,draftOverride:draft,adapter});
 const pack=e=>({attrs:e.attrs,html:e._html||'',text:e.textContent||'',value:e.value,hidden:e.hidden,disabled:e.disabled,style:Object.fromEntries(Object.entries(e.style||{}).filter(([,v])=>typeof v!=='function'))});
 f.doc.documentElement.dataset.theme='slate';f.windowEvents.dispatch('valuation:theme-change');
 const collect=e=>(e.descendants||[]).flatMap(child=>[child,...collect(child)]);
 const result={html:f.root.innerHTML,patches:collect(f.root).filter(e=>e.attrs.id).map(pack)};f.cleanup();return result;
}
const data={};
for(const [name,ticker,negative] of [['annual-aapl','AAPL',false],['annual-tsm','TSM',false],['annual-negative','AAPL',true]]){
 const h=await startResearchWorkspace();h.select(ticker);
 if(negative){for(let i=0;i<h.getState().draft.annual.length;i++)h.input(h.field('annual','margin',i),-40);h.input(h.field('terminal','margin'),1);}
 const state=h.getState(),snapshot={ticker,currency:state.draft.currency,periodEnd:state.draft.discountOrigin,raw:{id:state.draft.caseId},sourceUrl:state.company.sourceUrl};
 data[name]={tree:dump(h.root),state,simulation:simulation(snapshot,state.draft,annualResearchSimulationAdapter(state.draft))};h.destroy();
}
const studio=await startStudio();studio.change('#current-company','AAPL');studio.step(2);studio.flush();const mounted=studio.mounts.at(-1);
data.guided={tree:dump(studio.app),simulation:simulation(mounted.snapshot,mounted.draft)};
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
const questions=JSON.parse(JSON.stringify(vm.runInNewContext(app.match(/const questions=(\[[\s\S]*?\]);/)[1])));
const document=minimalDocument(),learn=document.root;
if(fs.existsSync(path.join(root,'dist/learn-view.js'))){const {mountLearning}=await module('dist/learn-view.js');mountLearning(learn,questions);learn.querySelector('[data-learn-answer="1"]').click();}
else{
 const query=selector=>selector==='#quizzes'?learn:selector==='#checks'?{textContent:''}:learn.querySelector(selector);
 const context={questions,document:{$:query,querySelector:query,querySelectorAll:s=>learn.querySelectorAll(s)},$:query,terminalValue:(await module('dist/engine.js')).terminalValue};
 const func=app.slice(app.indexOf('function quizzes(){'),app.indexOf('\nfunction parseImport'));
 vm.runInNewContext(func+';quizzes();',context);
 for(const e of learn.querySelectorAll('[data-q]'))Object.defineProperty(e,'classList',{value:{add(c){e.attrs.class=((e.attrs.class||'')+' '+c).trim()},remove(c){e.attrs.class=(e.attrs.class||'').split(' ').filter(x=>x!==c).join(' ')}}});
 learn.querySelector('[data-q="0"][data-a="1"]').click();
}
data.learn={tree:dump(learn)};
fs.writeFileSync(out,JSON.stringify(data));
'''

def fill(el,raw):
    for child in list(el):el.remove(child)
    el.text=None
    for f in html.fragments_fromstring(raw):
        if isinstance(f,str):el.text=(el.text or '')+f
        else:el.append(f)

def apply_tree(el,node,is_root=False):
    if node['html']: fill(el,node['html'])
    if not is_root:
        for key,value in node['attrs'].items():el.set(key,str(value))
    if node.get('hidden'):el.set('hidden','')
    if node.get('disabled'):el.set('disabled','')
    elif 'disabled' in el.attrib:del el.attrib['disabled']
    if el.tag in ('input','select','textarea') and node.get('value') is not None:
        if el.tag=='select':
            for opt in el.xpath('./option'):
                if opt.get('value','')==str(node['value']):opt.set('selected','')
                elif 'selected'in opt.attrib:del opt.attrib['selected']
        elif el.tag=='textarea':el.text=str(node['value'])
        else:el.set('value',str(node['value']))
    children=[ch for ch in el if isinstance(ch.tag,str)]
    if not node['children']:
        if el.tag not in ('input','select','textarea'):
            for child in list(el):el.remove(child)
            el.text=node['text']
    else:
        if len(children)!=len(node['children']):raise ValueError(f"Tree mismatch {el.tag} {el.get('id')} {len(children)} != {len(node['children'])}")
        for child,state in zip(children,node['children']):apply_tree(child,state)

def apply_sim(el,data):
    fill(el,data['html'])
    # Simulation harness captures rendered parent HTML plus later ID-level writes.
    for state in data['patches']:
        nodes=el.xpath('.//*[@id=$id]',id=state['attrs']['id'])
        if not nodes:continue
        node=nodes[0]
        if state['html']:fill(node,state['html'])
        elif state['text']:
            for child in list(node):node.remove(child)
            node.text=state['text']
        for k,v in state['attrs'].items():node.set(k,str(v))
        if state['hidden']:node.set('hidden','')
        elif 'hidden' in node.attrib:del node.attrib['hidden']
        if state['disabled']:node.set('disabled','')
        if node.tag=='input':node.set('value',str(state['value']))

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

def set_page(s,page,theme):
    s.set('data-theme',theme)
    for el in s.xpath('//section[contains(concat(" ",@class," ")," page ")]'):
        classes=[c for c in el.get('class','').split() if c!='hidden']
        if el.get('id')!=page:classes.append('hidden')
        el.set('class',' '.join(classes))
    for el in s.xpath('//*[@data-tab]'):
        active=el.get('data-tab')==page
        classes=[c for c in el.get('class','').split() if c!='active']
        if active:classes.append('active')
        el.set('class',' '.join(classes));el.set('aria-current','page' if active else 'false')
    for el in s.xpath('//*[@data-primary]'):
        active=el.get('data-primary')==('learn' if page=='learn' else 'studio')
        el.set('class','active' if active else '');el.set('aria-current','page' if active else 'false')
    for el in s.xpath('//*[@data-mode-group]'):
        if page=='learn' or el.get('data-mode-group')!='studio':el.set('hidden','')
        elif 'hidden'in el.attrib:del el.attrib['hidden']
    for el in s.xpath('//*[@id="breadcrumb"]'):el.text={'renewed':'Studio / Annual model','current':'Studio / Guided','learn':'Learn / Model exercises'}[page]
    names={'forest':'Paper & Forest','slate':'Slate & Blue','midnight':'Midnight','sand':'Sand & Terracotta','plum':'Plum & Rose','ocean':'Ocean & Teal'}
    for el in s.xpath('//*[@id="current-theme-name"]'):el.text=names[theme]
    for el in s.xpath('//*[@data-theme-choice]'):el.set('aria-pressed',str(el.get('data-theme-choice')==theme).lower())

def component(s,mode):
    if mode=='schedule':
        nodes=s.xpath('//*[@class and contains(concat(" ",@class," ")," research-schedule ")]')
        if not nodes:nodes=s.xpath('//*[@id="research-editor"]/section[h2="Explicit annual assumptions"]')
    elif mode=='theme':
        nodes=s.xpath('//*[@id="research-results"]')
        if nodes:
            for child in list(nodes[0]):
                if child.tag!='section' or not any(c in child.get('class','').split() for c in ['research-value','research-equity']):nodes[0].remove(child)
    elif mode=='simulation':nodes=s.xpath('//*[@id="research-simulation-root"]')
    else:return
    body=s.xpath('//body')[0]
    for e in list(body):body.remove(e)
    main=html.Element('main',{'class':'preview-component'});body.append(main)
    for node in nodes:main.append(node)
    # Full schedule component exposes every row, preserving the natural horizontal width.
    if mode=='schedule':
        for e in main.xpath('.//details[contains(@class,"terminal-editor")]'):e.set('open','')

def render(source,data,label,kind,width,mode='',theme='slate'):
    s=html.fromstring((source/'dist/index.html').read_text());page='renewed' if kind.startswith('annual') else 'current' if kind=='guided' else 'learn';set_page(s,page,theme)
    mount={'renewed':'renewed-research-app','current':'guided-app','learn':'quizzes'}[page]
    apply_tree(s.xpath('//*[@id=$id]',id=mount)[0],data[kind]['tree'],True)
    if 'simulation'in data[kind]:
        target=s.xpath('//*[@id=$id]',id='simulation-lab' if kind=='guided' else 'research-simulation-root')
        if target:apply_sim(target[0],data[kind]['simulation'])
    component(s,mode)
    for e in s.xpath('//select'):
        opts=e.xpath('./option[@selected]') or e.xpath('./option');value=''.join(opts[0].itertext()) if opts else ''
        for ch in list(e):e.remove(ch)
        e.tag='div';e.set('class',e.get('class','')+' preview-select');e.text=value
    for e in s.xpath('//input'):
        e.tag='div';e.set('class',e.get('class','')+' preview-input');e.text=' ' if e.get('type')=='range' else e.get('value','')
    for e in s.xpath('//progress'):
        e.tag='div';e.set('class',e.get('class','')+' preview-progress');e.text=''
    for e in s.xpath('//script|//link'):e.getparent().remove(e)
    for e in s.xpath('//details[not(@open)]'):
        for ch in list(e):
            if ch.tag!='summary':e.remove(ch)
    css='\n'.join((source/'dist'/f).read_text() for f in ['style.css','studio.css','research.css','simulation.css','workspace.css','learn.css'] if (source/'dist'/f).exists())
    tokens={}
    for selector,body in re.findall(r'([^{}]+)\{([^{}]+)\}',css):
        if ':root' in selector or re.search(r'data-theme=[\"\']?'+re.escape(theme)+r'[\"\']?\]',selector):
            tokens.update({k:v.strip() for k,v in re.findall(r'--([\w-]+)\s*:\s*([^;}]+)',body)})
    for _ in range(3):
        tokens={k:re.sub(r'var\(--([\w-]+)\)',lambda m:tokens.get(m[1],m[0]),v) for k,v in tokens.items()}
    for svg in s.xpath('//*[local-name()=\"svg\"]'):
        parents=' '.join(x.get('class','') for x in svg.iterancestors())
        name='signal' if 'mc-shape-preview' in parents and kind=='guided' else 'accent'
        if 'mc-shape-preview' in parents or 'history-trend' in parents:
            for part in svg.xpath('.//*[local-name()=\"path\" or local-name()=\"line\"]'):
                part.set('stroke',tokens.get(name,'#2154ba'));part.set('fill','none');part.set('style',part.get('style','')+';stroke:'+tokens.get(name,'#2154ba')+';fill:none')
    css=flatten(css,width)
    css=css.replace('display:grid','display:block').replace('display: grid','display:block')
    css=re.sub(r'(?<![\w.-])input(?![\w-])','.preview-input',css)
    css=re.sub(r'(?<![\w.-])select(?![\w-])','.preview-select',css)
    # WeasyPrint has no viewport units or clamp(). Resolve only those source values.
    def length(v):
        v=v.strip();number=float(re.search(r'-?[\d.]+',v)[0]);return number*(width/100 if v.endswith('vw') else 16 if v.endswith('rem') else 1)
    css=re.sub(r'clamp\(([^(),]+),([^(),]+),([^(),]+)\)',lambda m:f'{max(length(m[1]),min(length(m[2]),length(m[3]))):g}px',css)
    css=re.sub(r'(-?[\d.]+)vw',lambda m:f'{float(m[1])*width/100:g}px',css)
    height=7000 if not mode else 3400 if mode=='schedule' else 2600
    css+=f'\n@page{{size:{width}px {height}px;margin:0}}body{{width:{width}px}}'
    css+='''
    [hidden],.hidden{display:none!important}.preview-input,.preview-select{display:block}
    .preview-input[type=range]{height:4px!important;min-height:4px!important;padding:0!important;border:0!important;background:var(--accent);margin-top:20px;margin-bottom:20px}
    .preview-select{min-height:44px}.preview-input{min-height:43px}
    .appearance-disclosure{position:absolute}.value-column{position:relative;top:auto}
    .research-table-scroll,.table-wrap{overflow:hidden}.research-table-scroll{max-width:100%}
    .preview-progress{height:5px;background:var(--line);border-radius:3px}.preview-progress:before{content:"";display:block;height:5px;width:16.6667%;background:var(--accent)}
    .preview-component{margin:0 auto;padding:24px;max-width:none}
    .research-schedule>.research-table-scroll{max-height:none}
    svg{max-width:100%}.mc-chart svg{display:block;width:100%}
    '''
    css+='''
    .research-update-link{display:block}.research-statusline{display:block}.research-statusline p{max-width:none}.schedule-heading>div{flex:1 1 auto}.schedule-heading h2{white-space:nowrap}.mode-navigation button{white-space:nowrap;flex:0 0 auto}
    .research-stat-grid{display:flex;flex-wrap:wrap;gap:14px}.research-stat-grid>div{flex:1 1 28%;min-width:0}.research-stat-grid b{white-space:normal;overflow-wrap:normal}
    .research-field-grid{display:flex;flex-wrap:wrap;gap:16px}.research-field-grid>label{flex:1 1 42%;min-width:0}
    .learn-options>button{margin-bottom:10px}.learn-answer{display:block!important;height:auto;min-height:60px;white-space:normal}.learn-option-letter{display:block;float:left;text-align:center;line-height:25px}.learn-option-text{display:block;margin-left:38px}.learn-progress>div:not(.preview-progress){display:block;height:28px}.learn-progress>div>span{display:inline-block;white-space:nowrap;max-width:none}.learn-progress>div>span:last-child{float:right;width:auto}.learn-control>span>span{flex:1 1 auto}.learn-footer{display:block}.learn-footer button{display:inline-block;width:46%;margin-bottom:12px}.learn-footer>span{display:block;margin:10px 0}.learn-exercise-controls>*{margin-bottom:15px}.learn-equation>div{margin:8px 0}
    .mc-setup-tabs{display:flex!important;flex-wrap:wrap;gap:5px}.mc-setup-tabs>button{flex:1 1 28%;min-width:0}.mc-driver-parameters{display:flex;flex-wrap:wrap;gap:0 10px}.mc-driver-parameters>label{flex:1 1 43%;min-width:0}.mc-inspector>span{display:block}.mc-inspector>span:last-child{margin-top:8px}.mc-stat-row{display:flex;gap:16px}.mc-stat-row>*{flex:1 1 0;min-width:0}.live-value-meta{display:flex;gap:22px}.live-value-meta>*{flex:1 1 0;min-width:0}
    '''
    if width<=900:
        css+='''.research-layout,.research-layout>#research-results,#research-editor,.studio-columns{display:block!important}.research-layout>#research-results>.research-value,.research-layout>#research-results>.research-card{margin-bottom:18px}.research-stat-grid>div{flex:1 1 43%}.research-stat-grid>div:last-child{flex-basis:100%}.value-column{margin-bottom:26px}.research-field-grid>label{flex-basis:100%}'''
    else:
        css+='''.studio-columns{display:flex;gap:30px;align-items:flex-start}.studio-columns>*{flex:1 1 0;min-width:0}.research-toolbar{justify-content:flex-start}.research-action-menu{margin-left:auto}body>aside nav{flex:none}.research-stat-grid>div{flex-basis:28%}body>aside nav{width:320px;flex-wrap:nowrap;max-width:none}body>aside nav button{white-space:nowrap}.workspace-heading{display:block;position:relative}.workspace-heading .research-update-link{position:absolute;right:0;top:6px}.workspace-heading h1{max-width:none}.research-action-menu>summary{white-space:nowrap}'''
        if source==ROOT:css+='''.research-layout>#research-results{display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start}.research-layout>#research-results>.research-value,.research-layout>#research-results>.research-equity{flex:1 1 0;min-width:0}.research-layout>#research-results>.research-warning,.research-layout>#research-results>.error{flex-basis:100%}'''
        else:css+='''.research-layout{display:flex;gap:24px;align-items:flex-start}.research-layout>*{flex:1 1 0;min-width:0}'''
    if width<=650:css+='''.research-table-scroll>.research-table{width:860px!important;min-width:860px!important;table-layout:fixed}.research-table-scroll>.research-table th:first-child{width:110px}.research-toolbar,.studio-toolbar{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px 18px}.research-toolbar>label,.research-toolbar>.toolbar-model{width:45%;flex:0 0 45%}.research-toolbar>.toolbar-period,.research-toolbar>.research-action-menu{width:100%;flex:1 1 100%}.studio-toolbar>*{flex:1 1 43%;min-width:0}.studio-toolbar .company-control{flex-basis:100%}'''
    if mode=='schedule':css+='.preview-component>.research-card{margin:0}.preview-component .research-table-scroll{max-height:none}'
    if mode=='theme':css+='#research-results{display:flex;gap:22px;align-items:flex-start}.preview-component{padding:24px}.research-value,.research-equity{margin:0;flex:1 1 0;min-width:0}'
    if width<=650:css+='.mc-chart svg{height:155px}.preview-component{padding:18px}'
    else:css+='.mc-chart svg{height:360px}'
    # Resolve SVG text sizes in source viewBox coordinates: Weasy's SVG does not inherit CSS variables.
    chart_width=(width-78) if width<=650 else ((width-136)/2 if kind=='guided' and not mode else width-128)
    scale=960/max(180,chart_width)
    for e in s.xpath('//*[local-name()="svg"]'):
        if e.get('viewbox'):e.set('viewBox',e.get('viewbox'));del e.attrib['viewbox']
        for text in e.xpath('.//*[local-name()="text"]'):
            cls=text.get('class','')
            if width<=520 and 'mc-axis-intermediate' in cls:
                text.getparent().remove(text);continue
            if source==ROOT and ('mc-axis-label'in cls or 'mc-svg-note'in cls):
                text.set('font-size',str(13*scale));text.set('style',text.get('style','')+f';font-size:{13*scale}px')
    st=html.Element('style');st.text=css;s.xpath('//head')[0].append(st)
    name=f'{label}-{kind}-{width}'+('-'+mode if mode else '')+('-'+theme if theme!='slate' else '')
    path=OUT/name;markup=html.tostring(s,encoding='unicode');path.with_suffix('.html').write_text(markup)
    document=HTML(string=markup,base_url=str(source/'dist'),media_type='screen').render()
    document.write_pdf(path.with_suffix('.pdf'))
    subprocess.run(['pdftoppm','-f','1','-singlefile','-scale-to-x',str(width),'-scale-to-y','-1','-png',str(path.with_suffix('.pdf')),str(path)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    # Crop only surplus page background for convenient static inspection, never page content.
    from PIL import Image
    im=Image.open(path.with_suffix('.png'));boxes=[]
    def walk(box):
        tag=getattr(box,'element_tag',None)
        if tag and tag not in ('html','body','main') and getattr(box,'height',0)>0:
            boxes.append(box.position_y+box.height+getattr(box,'margin_bottom',0)+getattr(box,'padding_bottom',0))
        for child in getattr(box,'children',[]):walk(child)
    walk(document.pages[0]._page_box)
    bottom=min(im.height,max(500,int(max(boxes,default=500)+45)))
    im.crop((0,0,width,bottom)).save(path.with_suffix('.png'))
    if not mode:im.crop((0,0,width,min(bottom,2100 if width<900 else 1600))).save(path.with_name(name+'-top').with_suffix('.png'))
    print(str(path.with_suffix('.png')),flush=True)
    return {'name':name,'pages':len(document.pages),'width':width,'height':bottom,'source':str(source),'kind':kind,'component':mode,'theme':theme}

README='''# Static feedback previews\n\nThese are approximate WeasyPrint 70 document renders, not browser screenshots. No browser route was attempted. Generated model content is sourced from each version’s actual shipped modules, executed using its existing minimal-DOM runtime harnesses. No financial results are hand-entered. The before source is immutable before-v24; after is the current valuation-lab checkout.\n\n## Scenarios\n- Annual AAPL at 320 / 390 / 1440 px, opened as the initial Annual page with matching active navigation.\n- Entire Annual schedule component at 390 / 1440 px. Horizontal overflow is clipped to its initial left edge at narrow width; all rows are unrolled for inspection.\n- TSM native TWD at 390 px.\n- Signed negative AAPL scenario at 390 px: each annual margin is edited to -40% and terminal margin to 1%, through actual input handlers. The engine computes all displayed amounts.\n- Guided AAPL Growth step at 390 / 1440 px, with actual completed simulation markup.\n- Learn after answering the first original question correctly, at 390 / 1440 px. The before version retains its original six-question presentation.\n- Annual result components in all six themes, plus a standalone simulation component.\n\n## Renderer-only overrides\n- CSS Grid is replaced by block flow to avoid WeasyPrint implicit-column placement defects. Main desktop Annual result cards, Guided columns, result stats and selected control rows are approximated with flex; narrow layouts stack as specified by source. Two-column secondary disclosure grids stack in this renderer.\n- Source style.css, studio.css, research.css, simulation.css, workspace.css and learn.css are included, in app order, when present.\n- Matching min/max-width media blocks and reduced-motion blocks are flattened in source order. clamp() and vw are resolved to equivalent px for each requested viewport.\n- Actual runtime markup is combined with the shell and explicit correct page / nav / appearance state because no browser routing script runs.\n- Input and select elements become text-filled divs; matching source CSS selectors are translated to .preview-input / .preview-select. Range controls are static colored tracks. Progress becomes a 1-of-6 static bar. Native platform control rendering is not reproduced.\n- Closed details retain their summary and remove hidden content. hidden / .hidden are explicitly hidden.\n- Sticky / fixed value panels become relative and appearance becomes absolute. Scroll wrappers use overflow:hidden because the renderer has no interactive scrolling. Schedule height limits are removed to show all rows. Narrow tables use explicit 860 px width because WeasyPrint ignores their source min-width; the overflow is clipped, never squeezed.\n- Learn answer rows use block flow with a floated option letter to work around WeasyPrint native-button flex sizing; answer text, selected state and source padding are unchanged. The navigation footer stacks its explanatory hint.\n- Additional renderer flex fixes keep desktop header labels and schedule titles unwrapped, pin the research link beside the heading, and give desktop primary navigation a fixed approximate 320 px width.\n- Isolated components receive 18 / 24 px outer padding. Theme samples place the operating and common-equity cards in two columns.\n- Simulation is generated synchronously with reduced motion, from actual drafts and annual adapters, with the actual theme-change event selecting Slate for full-page examples. Chart SVG receives a fixed approximate screen height and its viewBox capitalization is restored after HTML parsing. New SVG text has explicit 13-screen-pixel-equivalent font sizes based on estimated chart width, approximating runtime --mc-label-scale. The source mobile rule hiding intermediate tick labels is applied directly to SVG nodes at ≤520 px because WeasyPrint does not honor that SVG CSS display rule. Inspector spans stack to avoid Weasy flex text collisions. Shape-preview and history-trend strokes resolve the source theme color explicitly because SVG currentColor inheritance is incomplete in WeasyPrint.\n- Long document pages use 7000 px canvas height (components 2600–3400 px). PNGs show page one, cropped only below the last rendered content box. PDFs preserve any extra pages.\n\n## Not verified\nReal browser layout, sticky positioning, horizontal scrolling, touch, animation, keyboard operation, focus, accessible-tree output, browser text shaping and native input/select appearance are not certified by these previews. WeasyPrint limitations may introduce layout differences, especially flex/grid and SVG/CSS custom properties.\n'''

def finalize_outputs():
    from PIL import Image
    items=[]
    for image in sorted(OUT.glob('*.png')):
        if image.stem.endswith('-top'):continue
        im=Image.open(image);pdf=image.with_suffix('.pdf');raw=subprocess.check_output(['pdfinfo',str(pdf)],text=True)
        items.append({'version':'before' if image.stem.startswith('before-') else 'after','name':image.stem,'png':str(image),'pdf':str(pdf),'html':str(image.with_suffix('.html')),'width':im.width,'height':im.height,'pdfPages':int(re.search(r'^Pages:\s+(\d+)',raw,re.M)[1]),'pngSHA256':hashlib.sha256(image.read_bytes()).hexdigest()})
    (OUT/'manifest.json').write_text(json.dumps({'renderer':'WeasyPrint 70.0 static approximation','date':'2026-10-17','sourceHashesFile':'source-hashes.json','count':len(items),'previews':items},indent=2))
    files=['style.css','studio.css','research.css','simulation.css','workspace.css','learn.css','index.html','research-view.js','guided.js','learn-view.js','simulation-view.js']
    (OUT/'source-hashes.json').write_text(json.dumps({label:{f:hashlib.sha256((source/'dist'/f).read_bytes()).hexdigest() for f in files if(source/'dist'/f).exists()} for label,source in [('before',BASE),('after',ROOT)]},indent=2))
    (OUT/'README.md').write_text(README)

def main():
    p=argparse.ArgumentParser();p.add_argument('--only',choices=['before','after','both'],default='both');p.add_argument('--quick',action='store_true');args=p.parse_args();OUT.mkdir(parents=True,exist_ok=True)
    matrix=[('annual-aapl',390,''),('annual-aapl',1440,''),('annual-aapl',320,''),('annual-aapl',390,'schedule'),('annual-aapl',1440,'schedule'),('annual-tsm',390,''),('annual-negative',390,''),('guided',390,''),('guided',1440,''),('learn',390,''),('learn',1440,''),('annual-aapl',390,'simulation'),('annual-aapl',1440,'simulation')]
    if args.quick:matrix=matrix[:2]
    manifest=[]
    for label,source in [('before',BASE),('after',ROOT)]:
        if args.only not in ('both',label):continue
        datafile=OUT/f'{label}-runtime.json';subprocess.run(['node','--input-type=module','-',str(source),str(datafile)],input=NODE,text=True,check=True);data=json.loads(datafile.read_text())
        for kind,width,mode in matrix:manifest.append(render(source,data,label,kind,width,mode))
        if not args.quick:
            for theme in ['forest','slate','midnight','sand','plum','ocean']:manifest.append(render(source,data,label,'annual-aapl',960,'theme',theme))
    (OUT/f'manifest-{args.only}.json').write_text(json.dumps(manifest,indent=2));(OUT/'README.md').write_text(README);finalize_outputs()
if __name__=='__main__':main()
