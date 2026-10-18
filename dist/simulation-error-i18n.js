import {MRVL_MESSAGES} from './mrvl-operating.js';
import {jointErrorDescriptor} from './joint-simulation-view.js';
import {annualMetricMessageKeys} from './annual-metric-messages.js';
import {t,registerCatalog,bindText,localizedText,escapeLocalizedText} from './i18n.js';
import en from './locales/simulation-errors.en.js';
import zh from './locales/simulation-errors.zh-Hans.js';
registerCatalog('simulation-errors',{en,'zh-Hans':zh});
registerCatalog('mrvl-errors',{en:Object.fromEntries(Object.entries(MRVL_MESSAGES).map(([k,v])=>[k,v[0]])),'zh-Hans':Object.fromEntries(Object.entries(MRVL_MESSAGES).map(([k,v])=>[k,v[1]]))});
const exact={"Trials must be an integer from 1 to 50,000.": "simulation-errors.e0", "Histogram bin count must be an integer from 1 to 200.": "simulation-errors.e1", "Seed must be a nonempty string of at most 128 characters or a safe integer.": "simulation-errors.e2", "Dependence must be independent or operating-linked.": "simulation-errors.e3", "Unsupported simulation method.": "simulation-errors.e4", "Invalid random seed.": "simulation-errors.e5", "Normal bounds/mean/SD are too extreme or too narrow to resolve numerically. Widen the bounds, revise mean/SD, or use Fixed.": "simulation-errors.e6", "Normal quantile cannot be resolved within the specified bounds; revise mean/SD or bounds.": "simulation-errors.e7", "EBIT normalization must be a finite number.": "simulation-errors.e8", "Baseline valuation is numerically nonfinite; revise the scale or assumptions before simulating.": "simulation-errors.e9", "Monte Carlo requires the coherent scalar growth/margin transition. Explicit yearly overrides are unsupported; remove them rather than silently ignoring them.": "simulation-errors.e10", "Histogram numerical range is too wide.": "simulation-errors.e11"};
Object.assign(exact,annualMetricMessageKeys,Object.fromEntries(Object.entries(MRVL_MESSAGES).map(([k,v])=>[v[0],'mrvl-errors.'+k])));
const patterns=[
[/^(.+) must be an object\.$/,"simulation-errors.object",["name"]],[/^(.+): unsupported distribution type\.$/,"simulation-errors.type",["driver"]],[/^(.+): (.+) must be finite numbers\.$/,"simulation-errors.finite",["driver", "fields"]],[/^(.+): (.+) supports only (.+)\.$/,"simulation-errors.fields",["driver", "type", "fields"]],[/^(.+): require low ≤ mode ≤ high\.$/,"simulation-errors.triangle",["driver"]],[/^(.+): require low < high; use Fixed for a constant input\.$/,"simulation-errors.bounds",["driver"]],[/^(.+): numerical range is too wide\.$/,"simulation-errors.width",["driver"]],[/^(.+): distribution outside supported bounds \((.+)\)\.$/,"simulation-errors.support",["driver", "bounds"]],[/^(.+): normal SD must be strictly positive; use Fixed for zero uncertainty\.$/,"simulation-errors.sd",["driver"]],[/^Unknown simulation setting: (.+)\.$/,"simulation-errors.unknown",["setting"]],[/^Unsupported uncertain driver: (.+)\.$/,"simulation-errors.driver",["driver"]]];
export function simulationErrorDescriptor(message){
 const key=exact[message];if(key)return {key,params:{}};
 const joint=jointErrorDescriptor(message);if(joint)return joint;
 for(const [pattern,key,names]of patterns){const match=pattern.exec(message);if(match)return {key,params:Object.fromEntries(names.map((name,i)=>[name,match[i+1]]))};}
 for(const [prefix,key]of [['Saved uncertainty settings are invalid. Starting ranges are shown below; edit them or reset to calculate. ','simulation-errors.saved'],['Restored uncertainty settings are invalid. ','simulation-errors.restored']])if(message.startsWith(prefix))return {key,params:{reason:translateSimulationError(message.slice(prefix.length))}};
 return null;
}
export function translateSimulationError(message){const d=simulationErrorDescriptor(String(message));return d?t(d.key,d.params):String(message);}

export function simulationErrorMarkup(message,prefix){
 const descriptor=simulationErrorDescriptor(message),key=prefix||descriptor?.key;
 if(!key)return escapeLocalizedText(message);
 const params=prefix?{reason:translateSimulationError(message)}:descriptor.params;
 return localizedText(key,params).replace('<span ',`<span data-simulation-error="${escapeLocalizedText(message)}"${prefix?` data-simulation-error-prefix="${prefix}"`:''} `);
}
export function localizeSimulationErrors(root){
 for(const node of root?.querySelectorAll?.('[data-simulation-error]')||[]){
  const source=node.getAttribute('data-simulation-error'),prefix=node.getAttribute('data-simulation-error-prefix'),descriptor=simulationErrorDescriptor(source),key=prefix||descriptor?.key;
  if(key)bindText(node,key,()=>prefix?{reason:translateSimulationError(source)}:simulationErrorDescriptor(source).params);
 }
}
