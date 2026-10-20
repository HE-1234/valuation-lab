import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Native layout and Edit-focus corrections above the reviewed 508 integration. Every
// prior V86, upstream and reviewed UI hash remains independently unchanged.
export const NATIVE_GUIDE_BASE_COMMIT='508a85ad2101ce08fd441d93b7a532d50c8f0e7f';
export const NATIVE_GUIDE_FILES=Object.freeze(Object.fromEntries(Object.entries({
  "dist/skins/report.css": {
    "mode": "100644",
    "beforeBlob": "10b93c1c83ef5c6b85e03df11fe6cd35ec033754",
    "beforeSHA256": "7f4cd97607d59871a3e4b7be59db0f63519634264721102e27efd563cc8511a1",
    "afterBlob": "877f3a1d1d03a6e1f3191ce819a3777f8ef7a935",
    "afterSHA256": "75afbc3a6fb39eca6f2ed0481908e8a1512e0c149072216d7c319416867d8f1d",
    "repairs": [
      {
        "before": "    & body .rx-mcg [data-part] > details.rx-mcg-fold > summary { min-height: 54px; gap: 10px; }\n    & body .rx-mcg-ic { width: 28px; height: 28px; border-radius: 8px; }\n    & body .mc-setup > .rx-mcg { padding-bottom: 14px; }\n  }\n",
        "after": "    & body .rx-mcg [data-part] > details.rx-mcg-fold > summary { min-height: 54px; gap: 10px; }\n    & body .rx-mcg-ic { width: 28px; height: 28px; border-radius: 8px; }\n    /* Keep precision's long title and answer chip on separate phone rows. */\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; row-gap: 8px; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary > .rx-mcg-ic { grid-column: 1; grid-row: 1; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary > h4 { grid-column: 2; grid-row: 1; overflow-wrap: anywhere; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary > .rx-mcg-chip { grid-column: 2; grid-row: 2; justify-self: start; max-width: 100%; box-sizing: border-box; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary::after { grid-column: 3; grid-row: 1 / span 2; }\n    & body .mc-setup > .rx-mcg { padding-bottom: 14px; }\n  }\n"
      },
      {
        "before": "  /* Year markers on the path chart. */\n",
        "after": "  & body .mc-setup details.rx-mcg-edit-reveal[open]::details-content { transition: none !important; height: auto !important; content-visibility: visible !important; }\n  /* Year markers on the path chart. */\n"
      }
    ]
  },
  "dist/skins/report-mc-guide.js": {
    "mode": "100644",
    "beforeBlob": "453c96871b38f452659d93bb80f8bdff99b7fc82",
    "beforeSHA256": "6e393cb445af4261872f2a96e1a1e0b5e8f12b4ee9992b07e5cbf173cc3f08cd",
    "afterBlob": "3ff6eeb39809d0c14f7b7dd27da6b1bbfc560595",
    "afterSHA256": "3da2efa3dce66f0a2c0c97ba3725472149f0155a10e84b915a970824281e12ad",
    "repairs": [
      {
        "before": "  return words(l).replace(/\\s+/g, ' ').trim().slice(0, 64);\n}\nconst bare = label => label.split(/\\s*[\u00b7\u30fb]\\s*/)[0];\n// A row explains one setting and folds on its own. `k` names it for the focus\n// link with the field on the left; `f` is that field's id after \"mc-\".\nfunction knob(title, body, extra = '', k = '', f = '') {\n",
        "after": "  return words(l).replace(/\\s+/g, ' ').trim().slice(0, 64);\n}\nconst bare = label => label.split(/\\s*[\u00b7\u30fb]\\s*/)[0];\nfunction fieldAvailable(f) {\n  const el = f && curRoot?.querySelector(`.mc-setup [id$=\"mc-${f}\"]`);\n  // A closed disclosure can be opened; a hidden mode-specific panel cannot.\n  return !!el && !el.closest('[hidden]');\n}\n// A row explains one setting and folds on its own. `k` names it for the focus\n// link with the field on the left; `f` is that field's id after \"mc-\".\nfunction knob(title, body, extra = '', k = '', f = '') {\n"
      },
      {
        "before": "  if (!body && !extra) return `<li class=\"is-plain\"${attrs}><b>${esc(title)}</b></li>`;\n  const field = fieldLabel(f), key = 'kd:' + (k || name) + device(), open = folds.get(key) ?? false;\n  const head = `<summary><span class=\"rx-mcg-kn\"><b>${esc(name)}</b>${val ? `<em>${esc(val)}</em>` : ''}</span>${field ? `<small>${esc(copy('fieldIs', {f: field}))}</small>` : ''}</summary>`;\n  const edit = f ? `<button type=\"button\" class=\"rx-mcg-link\" data-edit=\"${esc(f)}\">${esc(copy('edit'))}</button>` : '';\n  return `<li${attrs}><details class=\"rx-mcg-kd\" data-fold=\"${key}\"${open ? ' open' : ''}>${head}<div class=\"rx-mcg-kb\">${body ? `<p>${esc(body)}</p>` : ''}${extra}${edit}</div></details></li>`;\n}\n\n",
        "after": "  if (!body && !extra) return `<li class=\"is-plain\"${attrs}><b>${esc(title)}</b></li>`;\n  const field = fieldLabel(f), key = 'kd:' + (k || name) + device(), open = folds.get(key) ?? false;\n  const head = `<summary><span class=\"rx-mcg-kn\"><b>${esc(name)}</b>${val ? `<em>${esc(val)}</em>` : ''}</span>${field ? `<small>${esc(copy('fieldIs', {f: field}))}</small>` : ''}</summary>`;\n  const edit = fieldAvailable(f) ? `<button type=\"button\" class=\"rx-mcg-link\" data-edit=\"${esc(f)}\">${esc(copy('edit'))}</button>` : '';\n  return `<li${attrs}><details class=\"rx-mcg-kd\" data-fold=\"${key}\"${open ? ' open' : ''}>${head}<div class=\"rx-mcg-kb\">${body ? `<p>${esc(body)}</p>` : ''}${extra}${edit}</div></details></li>`;\n}\n\n"
      },
      {
        "before": "  if (st?.hover) { st.hover = null; relink(root); }\n  for (const n of root.querySelectorAll('.rx-mcg-target')) n.classList.remove('rx-mcg-target');\n});\nfunction editField(root, f) {\n  const el = root.querySelector(`.mc-setup [id$=\"mc-${f}\"]`); if (!el) return;\n  const disclosures = [];\n  for (let n = el.parentElement; n && n !== root; n = n.parentElement) if (n.tagName === 'DETAILS') disclosures.unshift(n);\n  for (const d of disclosures) d.open = true;\n  const shown = x => x && (x.checkVisibility ? x.checkVisibility() : !!x.offsetParent);\n  let target = el.matches('input, select, textarea, button') ? el : el.querySelector('[aria-checked=\"true\"], input, select, button') || el;\n  if (!shown(target) || target.getAttribute('aria-hidden') === 'true' || target.tabIndex < 0) target = el.parentElement?.querySelector('[role=\"radiogroup\"] [aria-checked=\"true\"]') || el.parentElement?.querySelector('[role=\"radiogroup\"] button') || target;\n  target.scrollIntoView({block: 'center', behavior: calm() ? 'auto' : 'smooth'});\n  target.focus({preventScroll: true});\n}\nlet repaintQueued = false;\nfunction repaintSoon() {\n",
        "after": "  if (st?.hover) { st.hover = null; relink(root); }\n  for (const n of root.querySelectorAll('.rx-mcg-target')) n.classList.remove('rx-mcg-target');\n});\nfunction editField(root, f) {\n  const el = root.querySelector(`.mc-setup [id$=\"mc-${f}\"]`); if (!el || el.closest('[hidden]')) return;\n  const disclosures = [];\n  for (let n = el.parentElement; n && n !== root; n = n.parentElement) if (n.tagName === 'DETAILS') disclosures.unshift(n);\n  const opened = disclosures.filter(d => !d.open);\n  // Edit is direct navigation: reveal its target before focusing it. Manual\n  // disclosure toggles keep their normal animation after this scoped cleanup.\n  for (const d of opened) d.classList.add('rx-mcg-edit-reveal');\n  try {\n    for (const d of disclosures) d.open = true;\n    for (const d of opened) void d.offsetHeight;\n    const shown = x => x && (x.checkVisibility ? x.checkVisibility() : !!x.offsetParent);\n    let target = el.matches('input, select, textarea, button') ? el : el.querySelector('[aria-checked=\"true\"], input, select, button') || el;\n    if (!shown(target) || target.getAttribute('aria-hidden') === 'true' || target.tabIndex < 0) target = el.parentElement?.querySelector('[role=\"radiogroup\"] [aria-checked=\"true\"]') || el.parentElement?.querySelector('[role=\"radiogroup\"] button') || target;\n    target.scrollIntoView({block: 'center', behavior: calm() ? 'auto' : 'smooth'});\n    target.focus({preventScroll: true});\n  } finally {\n    for (const d of opened) d.classList.remove('rx-mcg-edit-reveal');\n  }\n}\nlet repaintQueued = false;\nfunction repaintSoon() {\n"
      }
    ]
  }
}).map(([path,item])=>[path,Object.freeze({...item,repairs:Object.freeze(item.repairs.map(Object.freeze))})])));
export const NATIVE_GUIDE_PATHS=Object.freeze(Object.keys(NATIVE_GUIDE_FILES));
export const NATIVE_PRECISION_RULES="    /* Keep precision's long title and answer chip on separate phone rows. */\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; row-gap: 8px; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary > .rx-mcg-ic { grid-column: 1; grid-row: 1; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary > h4 { grid-column: 2; grid-row: 1; overflow-wrap: anywhere; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary > .rx-mcg-chip { grid-column: 2; grid-row: 2; justify-self: start; max-width: 100%; box-sizing: border-box; }\n    & body .rx-mcg.is-sampling [data-part=\"value\"] > .rx-mcg-fold > summary::after { grid-column: 3; grid-row: 1 / span 2; }\n";
export const NATIVE_EDIT_REVEAL_RULE="  & body .mc-setup details.rx-mcg-edit-reveal[open]::details-content { transition: none !important; height: auto !important; content-visibility: visible !important; }\n";
export const nativeGuideSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const nativeGuideBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const productionPath=value=>typeof value==='string'&&value.startsWith('dist/')&&!/[\\\0\r\n]/.test(value)&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:64*1024*1024});
let cachedEntries;
function entries(){
 if(!cachedEntries){
  assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1');
  assert.equal(git('rev-parse',NATIVE_GUIDE_BASE_COMMIT+'^{commit}').toString().trim(),NATIVE_GUIDE_BASE_COMMIT,'Exact immutable reviewed native-QA baseline');
  cachedEntries=new Map(git('ls-tree','-r','-z','--full-tree',NATIVE_GUIDE_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{
   const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);
   assert.ok(productionPath(path));assert.equal(type,'blob');assert.ok(['100644','100755'].includes(mode));assert.match(oid,/^[0-9a-f]{40}$/);
   return [path,Object.freeze({mode,oid})];
  }));
  assert.equal(cachedEntries.size,979,'All 979 reviewed production paths remain pinned');
  for(const [path,item]of Object.entries(NATIVE_GUIDE_FILES)){
   assert.ok(cachedEntries.has(path));assert.equal(cachedEntries.get(path).oid,item.beforeBlob);assert.equal(cachedEntries.get(path).mode,item.mode);
   assert.notEqual(item.beforeSHA256,item.afterSHA256);
  }
 }
 return cachedEntries;
}
export const nativeGuideBaseEntries=()=>new Map(entries());
const EARLIER_GATES='; exact reviewed company period copy bytes; exact reviewed chart/trial geometry bytes; exact reviewed NFLX integration bytes; exact reviewed UBER integration bytes; exact reviewed MCD integration bytes; exact reviewed range header fix bytes; exact reviewed Claude simulation UI bytes';
export function reverseNativeGuideFix(path,bytes,earlierContext=''){
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');
 assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');
 if(!own(NATIVE_GUIDE_FILES,path))return bytes;
 const item=NATIVE_GUIDE_FILES[path];entries();
 const message=path+' exact reviewed native guide correction bytes; '+path+' exact reviewed latest user UI bytes'+EARLIER_GATES+'; '+path+' exact reviewed Claude simulation UI bytes'+earlierContext;
 assert.equal(nativeGuideSHA(bytes),item.afterSHA256,message);assert.equal(nativeGuideBlobSHA(bytes),item.afterBlob,message);
 let restored=bytes.toString('utf8');
 for(const repair of item.repairs){assert.equal(restored.split(repair.after).length-1,1,path+' exactly one native guide correction');restored=restored.replace(repair.after,repair.before);}
 const out=Buffer.from(restored,'utf8');
 assert.equal(nativeGuideSHA(out),item.beforeSHA256,path+' exact 508 reviewed SHA-256');
 assert.equal(nativeGuideBlobSHA(out),item.beforeBlob,path+' exact 508 immutable Git blob');
 return out;
}

// Normalize only the temporary Edit-reveal rule so the independently reviewed
// six-line mobile precision proof still sees its exact accepted CSS bytes.
export function reverseNativeEditReveal(bytes){
 assert.ok(Buffer.isBuffer(bytes),'Native Edit reveal requires exact CSS bytes');
 const item=NATIVE_GUIDE_FILES['dist/skins/report.css'];
 assert.equal(nativeGuideSHA(bytes),item.afterSHA256,'Exact reviewed native Edit reveal CSS bytes');
 assert.equal(nativeGuideBlobSHA(bytes),item.afterBlob,'Exact reviewed native Edit reveal CSS blob');
 const source=bytes.toString('utf8');
 assert.equal(source.split(NATIVE_EDIT_REVEAL_RULE).length-1,1,'Exactly one scoped native Edit reveal rule');
 const out=Buffer.from(source.replace(NATIVE_EDIT_REVEAL_RULE,''));
 assert.equal(nativeGuideSHA(out),'c8df52df271030a4a38ed81627e169e4cc6095f21ca23f4b2bc47527f2186dbe','Exact previously accepted mobile precision CSS');
 assert.equal(nativeGuideBlobSHA(out),'f5c9e84ab8a2f6991c800ca3c884a65902e09c44','Exact previously accepted mobile precision Git blob');
 return out;
}
