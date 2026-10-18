import {displayNumber,precisionInputAttributes,readPrecisionInput,bindPrecisionInput} from './number-display.js';
import {renderJointMetric} from './joint-simulation-view.js';
import {isJoint} from './joint-simulation-config.js';
import './annual-metrics-i18n.js';
import {t, localizeMarkedNodes, localizedText} from './i18n.js';
import {annualTextHTML} from './annual-localization.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Presentation only. All plotted scenarios are completed engine draws.
import {annualPathDefaults,annualMetricDefaults} from './annual-path-sampling.js';
const number=n=>displayNumber(n,2,{grouping:false,missing:''});
const displayedRate=n=>number(Math.round(n*10000)/100);
const yearLabel=(year,growth,fixed,stable=false)=>`${localizedText('annual.path.year',{year,growth:displayedRate(growth)})}<small>${stable?localizedText('annualMetrics.terminalLinked'):annualTextHTML(fixed?'Fixed':'Variable')}</small>`;
export function renderAnnualPathControls(config,context){
 const spec=config.annualPath||annualPathDefaults(),annual=['annual-path','joint-annual-path'].includes(config.method);
 const baseline=context?.baseline||[],terminalYear=context?.terminalYear;
 return `<label for="mc-growth-method">${localizedText('annualMetrics.method')}<select id="mc-growth-method"><option value="joint-annual-path" ${isJoint(config)?'selected':''} data-i18n="jointAnnual.method">Joint annual paths</option><option value="annual-path" ${config.method==='annual-path'?'selected':''} data-i18n="jointAnnual.independent">Independent annual innovations</option><option value="legacy" ${annual?'':'selected'} data-i18n="annualMetrics.legacy">Legacy scalar input draws</option></select></label><div id="mc-annual-path-controls" ${annual?'':'hidden'}><fieldset><legend data-i18n="annual.copy.461ccbd043de">Annual growth uncertainty</legend><div class="mc-driver-parameters"><label for="mc-annual-innovation-sd"><span data-i18n="annual.copy.6af9bd88185b">Annual innovation SD · percentage points</span><input id="mc-annual-innovation-sd" type="number" min="0" max="200" step="0.1" inputmode="decimal" ${precisionInputAttributes(spec.innovationSD,100)} aria-describedby="mc-annual-path-note"></label><label for="mc-annual-persistence"><span data-i18n="annual.copy.1c7ffac66ad8">Year-to-year persistence</span><input id="mc-annual-persistence" type="number" min="-1" max="1" step="0.05" inputmode="decimal" ${precisionInputAttributes(spec.persistence)} aria-describedby="mc-annual-path-note"></label></div><p id="mc-annual-path-note" class="micro" data-i18n="annual.copy.52f0e73eec0d">SD controls each new Gaussian innovation, in percentage points; it is not the total width of the growth path. Persistence carries deviations between years. Paths are conditioned on future fixed years and the stable-growth endpoint. These are illustrative assumptions, not calibrated probabilities.</p></fieldset><fieldset><legend data-i18n="annual.copy.abc00d6d2d2a">Fixed forecast years</legend><p class="micro" data-i18n="annualMetrics.growthFixedNote">Selected pre-maturity years keep their exact edited baseline growth. Growth at and after maturity follows the terminal growth setting. Displayed rates are rounded; fixed years use exact model values.</p><div class="mc-annual-years">${baseline.map((growth,i)=>{const year=i+1,stable=year>=terminalYear,fixed=stable||spec.fixedYears.includes(year);return `<button id="mc-annual-fixed-${year}" class="mc-annual-year" type="button" aria-pressed="${fixed}" ${stable?'disabled':''} aria-label="${esc(t(stable?'annualMetrics.terminalYearAria':'annual.path.yearAria',{year,growth:number(growth*100)}))}" data-i18n-aria-label="${stable?'annualMetrics.terminalYearAria':'annual.path.yearAria'}" data-i18n-params="${esc(JSON.stringify({year,growth:number(growth*100)}))}">${yearLabel(year,growth,fixed,stable)}</button>`}).join('')}</div>${terminalYear>baseline.length?`<p class="micro">${localizedText("annualMetrics.terminalBaseline",{growth:number(context.terminalGrowth*100)})}</p>`:''}${!baseline.length?'<p class="micro" data-i18n="annual.copy.b8ac185b43bc">Correct the model inputs to show the forecast years.</p>':''}</fieldset>${renderJointMetric(config,context,'growth')}${renderMetricControls(config,context)}<div id="mc-annual-preview" aria-live="polite"><p class="micro" data-i18n="annual.copy.a03fb0d32a58">Path preview is available after the current simulation completes.</p></div></div>`;
}
export function collectAnnualPathSettings(next,find,context){
 next.method=find('#mc-growth-method').value;
 // Preserve saved legacy configs without introducing annual assumptions until selected.
 if(['annual-path','joint-annual-path'].includes(next.method)||next.annualPath){
  const read=(id,scale=1)=>readPrecisionInput(find(id),scale);
  next.annualPath={fixedYears:(context?.baseline||[]).map((_,i)=>i+1).filter(year=>year<context.terminalYear&&find('#mc-annual-fixed-'+year)?.getAttribute('aria-pressed')==='true'),innovationSD:read('#mc-annual-innovation-sd',100),persistence:read('#mc-annual-persistence')};
 }
 if(['annual-path','joint-annual-path'].includes(next.method))collectMetricControls(next,find,context);
 return next;
}
export function bindAnnualPathControls(find,context,changed){
 bindMetricControls(find,context,changed);
 find('#mc-growth-method').onchange=()=>{const annual=['annual-path','joint-annual-path'].includes(find('#mc-growth-method').value);find('#mc-annual-path-controls').hidden=!annual;find('#mc-legacy-growth-controls').hidden=annual;refreshMetricVisibility(find,context);changed();};
 for(const id of ['#mc-annual-innovation-sd','#mc-annual-persistence']){find(id).oninput=changed;bindPrecisionInput(find(id));}
 (context?.baseline||[]).forEach((growth,i)=>{const year=i+1,button=find('#mc-annual-fixed-'+year);if(!button||year>=context.terminalYear)return;button.onclick=()=>{const fixed=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(fixed));button.innerHTML=yearLabel(year,growth,fixed);localizeMarkedNodes(button);changed();};});
}
export function renderAnnualPathPreview(paths){
 const main=renderSingleAnnualPathPreview(paths);
 return main+Object.entries(paths?.metrics||{}).map(([key,value])=>`<details><summary>${localizedText('annualMetrics.preview.'+key)}</summary>${renderSingleAnnualPathPreview({...value,preview:value.preview.map(p=>({trial:p.trial,growth:p.values,terminalGrowth:p.terminalGrowth})),metric:key})}</details>`).join('');
}
function renderSingleAnnualPathPreview(paths){
 if(!paths?.baseline?.length)return '<p class="micro" data-i18n="annual.copy.4405742875fe">No completed annual growth paths are available.</p>';
 const baseline=[...paths.baseline],samples=(paths.preview||[]).slice(0,12).map(p=>[...p.growth]);
 if(paths.terminalYear===baseline.length+1&&Number.isFinite(paths.terminalGrowth)){baseline.push(paths.terminalGrowth);samples.forEach((p,i)=>p.push(paths.preview?.[i]?.terminalGrowth??paths.terminalGrowth));}
 const values=[...baseline,...samples.flat()];if(!values.every(Number.isFinite))return '<p class="micro" data-i18n="annual.copy.ce249a816efc">Path preview unavailable: invalid growth values.</p>';
 const low=Math.min(...values),high=Math.max(...values),padding=Math.max((high-low)*.12,.005),lo=low-padding,hi=high+padding;
 const x=i=>44+i*552/Math.max(1,baseline.length-1),y=g=>166-(g-lo)/(hi-lo)*138;
 const line=path=>path.map((g,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(g).toFixed(2)}`).join(' ');
 return `<p class="micro">${localizedText("annual.path.preview",{count:samples.length})}</p><svg viewBox="0 0 640 206" width="100%" role="img" aria-label="${esc(t("annual.path.previewAria",{years:baseline.length,count:samples.length}))}" data-i18n-aria-label="annual.path.previewAria" data-i18n-params="${esc(JSON.stringify({years:baseline.length,count:samples.length}))}" style="display:block;color:var(--chart-one,var(--accent,currentColor))"><line x1="44" x2="596" y1="166" y2="166" stroke="currentColor" opacity=".25"/>${[lo,hi].map(g=>`<text x="4" y="${y(g)+4}" fill="currentColor" font-size="12">${number(g*(paths.metric?metricScale(paths.metric):100))}${!paths.metric||metricScale(paths.metric)===100?'%':''}</text>`).join('')}${samples.map(path=>`<path d="${line(path)}" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"/>`).join('')}<path d="${line(baseline)}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 4"/>${baseline.map((g,i)=>(paths.fixedYears||[]).includes(i+1)||!paths.variableTerminal&&i+1>=paths.terminalYear?`<circle cx="${x(i)}" cy="${y(g)}" r="3.5" fill="currentColor"/>`:'').join('')}<text x="44" y="192" fill="currentColor" font-size="12" data-i18n="annual.copy.598143299f35">Year 1</text><text x="596" y="192" text-anchor="end" fill="currentColor" font-size="12" data-i18n="${paths.terminalYear===baseline.length&&paths.terminalYear>paths.baseline.length?'annual.copy.a1f52cdcb3f2':'annual.year'}" data-i18n-params="${esc(JSON.stringify({year:baseline.length}))}">${esc(t(paths.terminalYear===baseline.length&&paths.terminalYear>paths.baseline.length?'annual.copy.a1f52cdcb3f2':'annual.year',{year:baseline.length}))}</text></svg>`;
}

function metricScale(key){return ['salesCapital','reinvestment','investmentFactor'].includes(key)?1:100;}
function metricUnit(key,context){return key==='reinvestment'?t('annualMetrics.money',{currency:context?.currency||''}):t('annualMetrics.'+(key==='salesCapital'?'ratio':key==='investmentFactor'?'factor':'pp'));}
function metricKeys(context,config){if(isJoint(config)&&config.annualMetrics)return Object.keys(config.annualMetrics).filter(k=>context?.metrics?.[k]);return [...new Set(['margin','taxRate','wacc',context?.capital||'salesCapital',...Object.keys(config.annualMetrics||{})])].filter(k=>context?.metrics?.[k]);}
function metricYearHTML(key,year,value,fixed){return `${localizedText('annualMetrics.year',{year,value:number(value*metricScale(key))})}<small>${localizedText('annualMetrics.'+(fixed?'fixed':'variable'))}</small>`;}
const terminalParts={fixed:['value'],uniform:['low','high'],triangular:['low','mode','high'],normal:['mean','sd','low','high']};
function renderMetricControls(config,context){
 const enabled=!!config.annualMetrics;
 return `<fieldset><legend>${localizedText('annualMetrics.title')}</legend><label><input id="mc-annual-metrics-enabled" type="checkbox" ${isJoint(config)?'disabled':''} ${enabled?'checked':''}>${localizedText(isJoint(config)?'jointAnnual.method':'annualMetrics.enable')}</label><div id="mc-annual-metrics-fields" ${enabled?'':'hidden'}><p class="micro">${localizedText(isJoint(config)?'jointAnnual.mapping':'annualMetrics.defaults')}</p><p class="micro">${localizedText(isJoint(config)?'jointAnnual.scope':'annualMetrics.note')}</p></div></fieldset>`;
}
export function renderAnnualMetricPanel(config,context,key){
 const annual=['annual-path','joint-annual-path'].includes(config.method),enabled=!!config.annualMetrics;
 if(key==='terminal')return `<div id="mc-metric-panel-terminal" ${annual?'':'hidden'}><fieldset><legend>${localizedText('annualMetrics.terminal')}</legend><p class="micro">${localizedText('annualMetrics.terminalNote')}</p>${['growth','taxRate','roic'].map(key=>{
 const spec=config.annualTerminal?.[key]||{type:'fixed',value:context?.terminalScalars?.[key]??0},fallback=context?.terminalScalars?.[key]??0;
 return `<details><summary>${localizedText('annualMetrics.'+(key==='taxRate'?'terminalTax':key))}</summary><label for="mc-terminal-${key}-type">${localizedText('annualMetrics.type')}<select id="mc-terminal-${key}-type">${Object.keys(terminalParts).map(type=>`<option data-i18n="annualMetrics.${type==='fixed'?'fixedType':type}" value="${type}" ${spec.type===type?'selected':''}>${esc(t('annualMetrics.'+(type==='fixed'?'fixedType':type)))}</option>`).join('')}</select></label><div class="mc-driver-parameters">${['value','low','mode','high','mean','sd'].map(part=>`<label id="mc-terminal-${key}-${part}-label" for="mc-terminal-${key}-${part}" ${terminalParts[spec.type]?.includes(part)?'':'hidden'}>${localizedText('annualMetrics.'+(part==='sd'?'normalSD':part))}<input id="mc-terminal-${key}-${part}" type="number" step="0.1" ${precisionInputAttributes(spec[part]??(part==='sd'?.005:part==='low'?Math.max(0,fallback-.005):part==='high'?fallback+.005:fallback),100)}></label>`).join('')}</div></details>`;
 }).join('')}</fieldset></div>`;
 if(!context?.metrics?.[key]||isJoint(config)&&!config.annualMetrics?.[key])return '';
 const spec=config.annualMetrics?.[key]||{...annualPathDefaults(context.baseline.length),innovationSD:0};
 const body=(()=>{
 return `<details class="mc-annual-metric" open><summary>${localizedText('annualMetrics.'+key)}</summary><div class="mc-driver-parameters"><label for="mc-metric-${key}-sd">${localizedText('annualMetrics.'+(key==='reinvestment'?'sdMoney':key==='salesCapital'?'sdRatio':key==='investmentFactor'?'sdFactor':'sdPP'),{currency:context.currency||''})}<input id="mc-metric-${key}-sd" type="number" min="0" step="0.1" ${precisionInputAttributes(spec.innovationSD,metricScale(key))}></label><label for="mc-metric-${key}-persistence">${localizedText('annualMetrics.persistence')}<input id="mc-metric-${key}-persistence" type="number" min="-1" max="1" step="0.05" ${precisionInputAttributes(spec.persistence)}></label></div><p class="micro">${localizedText(isJoint(config)?'jointAnnual.fixed':'annualMetrics.fixedNote')}</p><div class="mc-annual-years">${context.metrics[key].map((value,i)=>`<button id="mc-metric-${key}-fixed-${i+1}" class="mc-annual-year" type="button" aria-pressed="${spec.fixedYears.includes(i+1)}">${metricYearHTML(key,i+1,value,spec.fixedYears.includes(i+1))}</button>`).join('')}</div></details>`;
 })();
 return `<div id="mc-metric-panel-${key}" ${annual&&enabled?'':'hidden'}>${body}${renderJointMetric(config,context,key)}</div>`;
}
function collectMetricControls(next,find,context){
 const read=(id,scale=1)=>readPrecisionInput(find(id),scale);
 if(find('#mc-annual-metrics-enabled')?.checked){
  next.annualMetrics=Object.fromEntries(metricKeys(context,next).map(k=>[k,{innovationSD:read('#mc-metric-'+k+'-sd',metricScale(k)),persistence:read('#mc-metric-'+k+'-persistence'),fixedYears:context.metrics[k].map((_,i)=>i+1).filter(year=>find(`#mc-metric-${k}-fixed-${year}`)?.getAttribute('aria-pressed')==='true')} ]));
 }else delete next.annualMetrics;
 // Do not silently migrate old saved configurations merely by collecting them.
 if(!context?.terminalScalars||!find('#mc-terminal-growth-type'))return;
 const terminal=Object.fromEntries(['growth','taxRate','roic'].map(k=>{const type=find(`#mc-terminal-${k}-type`)?.value||'fixed';return [k,{type,...Object.fromEntries(terminalParts[type].map(p=>[p,read(`#mc-terminal-${k}-${p}`,100)]))}];}));
 if(next.annualTerminal||Object.entries(terminal).some(([k,s])=>s.type!=='fixed'||s.value!==context?.terminalScalars?.[k]))next.annualTerminal=terminal;
}
function refreshMetricVisibility(find,context){
 const annual=['annual-path','joint-annual-path'].includes(find('#mc-growth-method')?.value),enabled=find('#mc-annual-metrics-enabled')?.checked;
 for(const k of [...Object.keys(context?.metrics||{}),'terminal']){const panel=find('#mc-metric-panel-'+k);if(panel)panel.hidden=!annual||(k!=='terminal'&&!enabled);}
}
function bindMetricControls(find,context,changed){
 const enable=find('#mc-annual-metrics-enabled');if(!enable)return;
 enable.onchange=()=>{find('#mc-annual-metrics-fields').hidden=!enable.checked;refreshMetricVisibility(find,context);changed();};
 for(const key of Object.keys(context?.metrics||{})){
  for(const suffix of ['sd','persistence']){const input=find(`#mc-metric-${key}-${suffix}`);if(input){input.oninput=changed;bindPrecisionInput(input);}}
  context.metrics[key].forEach((value,i)=>{const button=find(`#mc-metric-${key}-fixed-${i+1}`);if(button)button.onclick=()=>{const fixed=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(fixed));button.innerHTML=metricYearHTML(key,i+1,value,fixed);localizeMarkedNodes(button);changed();};});
 }
 for(const key of ['growth','taxRate','roic']){
  const type=find(`#mc-terminal-${key}-type`);if(!type)continue;type.onchange=()=>{for(const part of ['value','low','mode','high','mean','sd'])find(`#mc-terminal-${key}-${part}-label`).hidden=!terminalParts[type.value].includes(part);changed();};
  for(const part of ['value','low','mode','high','mean','sd']){const input=find(`#mc-terminal-${key}-${part}`);input.oninput=changed;bindPrecisionInput(input);}
 }
}
