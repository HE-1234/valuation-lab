// Presentation only. All plotted scenarios are completed engine draws.
import {annualPathDefaults} from './annual-path-sampling.js';
const number=n=>Number.isFinite(n)?String(Math.round(n*1e6)/1e6):'';
const displayedRate=n=>number(Math.round(n*10000)/100);
const yearLabel=(year,growth,fixed,stable=false)=>`<span>Y${year} · ${displayedRate(growth)}%</span><small>${stable?'Stable · fixed':fixed?'Fixed':'Variable'}</small>`;
export function renderAnnualPathControls(config,context){
 const spec=config.annualPath||annualPathDefaults(),annual=config.method==='annual-path';
 const baseline=context?.baseline||[],terminalYear=context?.terminalYear;
 return `<label for="mc-growth-method">Growth sampling method<select id="mc-growth-method"><option value="annual-path" ${annual?'selected':''}>Correlated annual growth paths</option><option value="legacy" ${annual?'':'selected'}>Legacy single growth draw</option></select></label><div id="mc-annual-path-controls" ${annual?'':'hidden'}><fieldset><legend>Annual growth uncertainty</legend><div class="mc-driver-parameters"><label for="mc-annual-innovation-sd">Annual innovation SD · percentage points<input id="mc-annual-innovation-sd" type="number" min="0" max="200" step="0.1" inputmode="decimal" value="${number(spec.innovationSD*100)}" aria-describedby="mc-annual-path-note"></label><label for="mc-annual-persistence">Year-to-year persistence<input id="mc-annual-persistence" type="number" min="-1" max="1" step="0.05" inputmode="decimal" value="${number(spec.persistence)}" aria-describedby="mc-annual-path-note"></label></div><p id="mc-annual-path-note" class="micro">SD controls each new Gaussian innovation, in percentage points; it is not the total width of the growth path. Persistence carries deviations between years. Paths are conditioned on future fixed years and the stable-growth endpoint. These are illustrative assumptions, not calibrated probabilities.</p></fieldset><fieldset><legend>Fixed forecast years</legend><p class="micro">Select a year to keep its current baseline growth exact in every scenario. Other years vary around the existing growth path. Stable growth stays fixed. Displayed rates are rounded; fixed years use exact model values.</p><div class="mc-annual-years">${baseline.map((growth,i)=>{const year=i+1,stable=year>=terminalYear,fixed=stable||spec.fixedYears.includes(year);return `<button id="mc-annual-fixed-${year}" class="mc-annual-year" type="button" aria-pressed="${fixed}" ${stable?'disabled':''} aria-label="Year ${year}, ${number(growth*100)} percent baseline growth${stable?', stable growth fixed':''}">${yearLabel(year,growth,fixed,stable)}</button>`}).join('')}</div>${terminalYear>baseline.length?`<p class="micro">Terminal continuation · ${number(context.terminalGrowth*100)}% growth · Fixed</p>`:''}${!baseline.length?'<p class="micro">Correct the model inputs to show the forecast years.</p>':''}</fieldset><div id="mc-annual-preview" aria-live="polite"><p class="micro">Path preview is available after the current simulation completes.</p></div></div>`;
}
export function collectAnnualPathSettings(next,find,context){
 next.method=find('#mc-growth-method').value;
 // Preserve saved legacy configs without introducing annual assumptions until selected.
 if(next.method==='annual-path'||next.annualPath){
  const read=id=>{const value=find(id).value.trim();return value===''?NaN:Number(value)};
  next.annualPath={fixedYears:(context?.baseline||[]).map((_,i)=>i+1).filter(year=>year<context.terminalYear&&find('#mc-annual-fixed-'+year)?.getAttribute('aria-pressed')==='true'),innovationSD:read('#mc-annual-innovation-sd')/100,persistence:read('#mc-annual-persistence')};
 }
 return next;
}
export function bindAnnualPathControls(find,context,changed){
 find('#mc-growth-method').onchange=()=>{const annual=find('#mc-growth-method').value==='annual-path';find('#mc-annual-path-controls').hidden=!annual;find('#mc-legacy-growth-controls').hidden=annual;changed();};
 for(const id of ['#mc-annual-innovation-sd','#mc-annual-persistence'])find(id).oninput=changed;
 (context?.baseline||[]).forEach((growth,i)=>{const year=i+1,button=find('#mc-annual-fixed-'+year);if(!button||year>=context.terminalYear)return;button.onclick=()=>{const fixed=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(fixed));button.innerHTML=yearLabel(year,growth,fixed);changed();};});
}
export function renderAnnualPathPreview(paths){
 if(!paths?.baseline?.length)return '<p class="micro">No completed annual growth paths are available.</p>';
 const baseline=[...paths.baseline],samples=(paths.preview||[]).slice(0,12).map(p=>[...p.growth]);
 if(paths.terminalYear===baseline.length+1&&Number.isFinite(paths.terminalGrowth)){baseline.push(paths.terminalGrowth);samples.forEach(p=>p.push(paths.terminalGrowth));}
 const values=[...baseline,...samples.flat()];if(!values.every(Number.isFinite))return '<p class="micro">Path preview unavailable: invalid growth values.</p>';
 const low=Math.min(...values),high=Math.max(...values),padding=Math.max((high-low)*.12,.005),lo=low-padding,hi=high+padding;
 const x=i=>44+i*552/Math.max(1,baseline.length-1),y=g=>166-(g-lo)/(hi-lo)*138;
 const line=path=>path.map((g,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(g).toFixed(2)}`).join(' ');
 return `<p class="micro">Growth paths · ${samples.length} actual completed scenarios. Dashed line: current baseline. Dots: fixed years. This subset is not a confidence band.</p><svg viewBox="0 0 640 206" width="100%" role="img" aria-label="Annual growth path preview, ${baseline.length} years, ${samples.length} sampled paths and current baseline" style="display:block;color:var(--chart-one,var(--accent,currentColor))"><line x1="44" x2="596" y1="166" y2="166" stroke="currentColor" opacity=".25"/>${[lo,hi].map(g=>`<text x="4" y="${y(g)+4}" fill="currentColor" font-size="12">${number(Math.round(g*1000)/10)}%</text>`).join('')}${samples.map(path=>`<path d="${line(path)}" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"/>`).join('')}<path d="${line(baseline)}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 4"/>${baseline.map((g,i)=>(paths.fixedYears||[]).includes(i+1)||i+1>=paths.terminalYear?`<circle cx="${x(i)}" cy="${y(g)}" r="3.5" fill="currentColor"/>`:'').join('')}<text x="44" y="192" fill="currentColor" font-size="12">Year 1</text><text x="596" y="192" text-anchor="end" fill="currentColor" font-size="12">${paths.terminalYear===baseline.length&&paths.terminalYear>paths.baseline.length?'Terminal':'Year '+baseline.length}</text></svg>`;
}
