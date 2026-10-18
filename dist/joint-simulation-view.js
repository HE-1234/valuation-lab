import {displayNumber,precisionInputAttributes,readPrecisionInput,bindPrecisionInput} from './number-display.js';
import {registerCatalog,t,localizedText,localizeMarkedNodes} from './i18n.js';
import {isJoint,JOINT_NOTE,jointEffectiveConfig} from './joint-simulation-config.js';
const en={method:'Joint annual paths',independent:'Independent annual innovations',title:'Cross-metric innovations & year targets',loading:'Common-factor loading · −1 to 1',loadingNote:'Pairwise innovation correlation is the product of the two loadings. Zero-SD inputs have no realized innovation correlation. These are assumptions, not fitted estimates.',target:'Year target',year:'Forecast year',value:'Target level',error:'Target-error SD',exact:'Exact (SD 0)',noisy:'Noisy (SD > 0)',add:'Add year target',remove:'Remove target',none:'No year targets. Fixed-year buttons above keep exact baseline values.',unitsRate:'Rates and target-error SD use percentage points; 10 means 10%.',unitsMoney:'Target levels and error SD use {currency} millions of operating investment; protected fixed funding is separate.',unitsRatio:'Target levels and error SD use ratio / multiple units.',targetNote:'Use SD 0 for an exact target and SD > 0 for a noisy target. A noisy target shapes paths with Gaussian observation error; its SD is not a hard interval. Exact targets must agree with fixed years. Targets do not reweight terminal draws.',scope:JOINT_NOTE,relationships:'Annual relationships are set beside each operating input. Pairwise values below describe innovations before conditioning, not correlations of accepted valuation outcomes.',inactive:'Inactive: zero innovation SD',capitalRatio:'Higher sales / capital means less investment for each additional unit of revenue.',capitalFactor:'Higher investment factors mean more operating investment; fixed funding and required cash remain governed by the existing policy.',fixed:'Exact years hold their baseline input. Terminal draws can change the scenario mean even with zero residual SD. A noisy target cannot move a deterministic input.',enable:'Joint paths use the annual inputs below. Tax and WACC residual uncertainty are optional: keep their innovation SD at zero to leave only their terminal-scenario movement.',mapping:'Current SDs, fixed years and terminal distributions are retained separately for this method. New correlation loadings start at zero; choose explicit assumptions to link innovations.',preview:'Preview lines are actual accepted draws. Joint path SD in the export is conditional on selected terminal endpoints; it excludes between-endpoint variation and financial exclusions.',jointError:'Joint path settings need attention: {reason}',noPairs:'At least two nonzero innovation SDs are needed for an active cross-metric link.'};
const zh={method:'联合年度路径',independent:'独立年度创新',title:'跨指标创新与年份目标',loading:'共同因子载荷 · −1 至 1',loadingNote:'两个载荷的乘积为创新相关系数。标准差为零的输入没有实际创新相关性。这些是假设，并非拟合估计。',target:'年份目标',year:'预测年份',value:'目标水平',error:'目标误差标准差',exact:'精确（标准差 0）',noisy:'含噪声（标准差 > 0）',add:'添加年份目标',remove:'删除目标',none:'未设置年份目标。上方固定年份按钮保留精确基准值。',unitsRate:'比率与目标误差标准差使用百分点；10 表示 10%。',unitsMoney:'目标水平及误差标准差使用百万 {currency} 的经营投资；受保护的固定资金支出另行处理。',unitsRatio:'目标水平及误差标准差使用比率／倍数单位。',targetNote:'标准差为 0 表示精确目标，大于 0 表示含噪声目标。含噪声目标通过高斯观测误差影响路径；其标准差不是硬性区间。精确目标必须与固定年份一致。目标不会重新加权终值抽样。',scope:'联合年度创新遵循所选因子载荷。预设终值抽样先确定情景基准，再以精确年份及含噪声目标为条件生成联合残差路径。含噪声目标不会重新加权终值抽样。残差标准差为零时仍可出现终值驱动的变化。设置属于分析者假设，并非经校准的概率。',relationships:'年度关联在各经营输入旁设置。下方数值描述条件化之前的创新，而非已接受估值结果的相关性。',inactive:'未启用：创新标准差为零',capitalRatio:'销售额／资本越高，每单位新增收入所需的投资越少。',capitalFactor:'投资系数越高，经营投资越多；固定资金支出及所需现金仍遵循现有政策。',fixed:'精确年份保持其基准输入。即使残差标准差为零，终值抽样仍可改变情景均值。含噪声目标不能改变确定性输入。',enable:'联合路径使用下方年度输入。税率与 WACC 的残差不确定性可选：将创新标准差保持为零，即仅保留终值情景导致的变化。',mapping:'当前标准差、固定年份与终值分布独立保存在此方法中。新相关载荷从零开始；请明确设定创新关联假设。',preview:'预览线为实际已接受抽样。导出的联合路径标准差以所选终值端点为条件，不含端点间变化及财务排除的影响。',jointError:'联合路径设置需要修正：{reason}',noPairs:'至少两个非零创新标准差才会产生有效的跨指标关联。'};
registerCatalog('jointAnnual',{en,'zh-Hans':zh});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>displayNumber(x,2,{grouping:false,missing:''});
const scale=k=>['salesCapital','investmentFactor','reinvestment'].includes(k)?1:100;
export function renderJointMetric(config,context,key){
 if(!isJoint(config)||!key||key==='terminal')return '';
 const state=config.jointAnnual,observations=state.observations||[],s=scale(key),h=context?.baseline?.length||30;
 return `<fieldset id="mc-joint-${key}"><legend>${localizedText('jointAnnual.title')}</legend><label for="mc-joint-${key}-loading">${localizedText('jointAnnual.loading')}<input id="mc-joint-${key}-loading" type="number" min="-1" max="1" step="0.05" ${precisionInputAttributes(state.loadings?.[key]??0)}></label><p class="micro">${localizedText('jointAnnual.loadingNote')}</p>${['salesCapital','investmentFactor'].includes(key)?`<p class="micro">${localizedText('jointAnnual.'+(key==='salesCapital'?'capitalRatio':'capitalFactor'))}</p>`:''}<div id="mc-joint-${key}-targets">${observations.map((o,i)=>o.metric!==key?'':`<div class="mc-driver-parameters" id="mc-joint-target-${i}"><label for="mc-joint-target-${i}-year">${localizedText('jointAnnual.year')}<input id="mc-joint-target-${i}-year" type="number" min="1" max="${h}" step="1" ${precisionInputAttributes(o.year)}></label><label for="mc-joint-target-${i}-value">${localizedText('jointAnnual.value')}<input id="mc-joint-target-${i}-value" type="number" step="0.1" ${precisionInputAttributes(o.value,s)}></label><label for="mc-joint-target-${i}-sd">${localizedText('jointAnnual.error')}<input id="mc-joint-target-${i}-sd" type="number" min="0" step="0.1" ${precisionInputAttributes(o.errorSD,s)}></label><button type="button" id="mc-joint-target-${i}-remove" class="text-button">${localizedText('jointAnnual.remove')}</button></div>`).join('')||`<p class="micro">${localizedText('jointAnnual.none')}</p>`}</div><p class="micro">${localizedText('jointAnnual.'+(key==='reinvestment'?'unitsMoney':s===100?'unitsRate':'unitsRatio'),{currency:context.currency||''})} ${localizedText('jointAnnual.targetNote')}</p><button id="mc-joint-${key}-add" type="button" class="text-button">${localizedText('jointAnnual.add')}</button></fieldset>`;
}
export function renderJointRelationships(config){
 const c=jointEffectiveConfig(config),keys=['growth',...Object.keys(c.annualMetrics||{})],state=config.jointAnnual,pairs=[];
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const a=keys[i],b=keys[j],sa=a==='growth'?c.annualPath:c.annualMetrics[a],sb=b==='growth'?c.annualPath:c.annualMetrics[b];const label=k=>k==='growth'?t('simulation.t5'):t('annualMetrics.'+k);pairs.push(`<li>${esc(label(a))} / ${esc(label(b))}: ${sa.innovationSD&&sb.innovationSD?num((state.loadings[a]||0)*(state.loadings[b]||0)):localizedText('jointAnnual.inactive')}</li>`);}
 return `<p class="micro">${localizedText('jointAnnual.relationships')}</p><ul class="micro">${pairs.join('')}</ul><p class="micro">${localizedText('jointAnnual.scope')}</p>`;
}
export function collectJointControls(next,find){
 if(!isJoint(next))return;
 const read=id=>readPrecisionInput(find(id));
 const keys=['growth',...Object.keys(next.annualMetrics||{})];
 next.jointAnnual.loadings=Object.fromEntries(keys.map(k=>[k,read('#mc-joint-'+k+'-loading')]));
 // Display rounding must never alter an untouched exact anchor. Reuse the authored
 // number when the control still shows its rendered representation.
 const targetNumber=(id,value,s)=>find(id)?.dataset?.precisionValue!==undefined?readPrecisionInput(find(id),s):find(id)?.value===num(value*s)?value:read(id)/s;
 next.jointAnnual.observations=(next.jointAnnual.observations||[]).map((o,i)=>({...o,year:read(`#mc-joint-target-${i}-year`),value:targetNumber(`#mc-joint-target-${i}-value`,o.value,scale(o.metric)),errorSD:targetNumber(`#mc-joint-target-${i}-sd`,o.errorSD,scale(o.metric))}));
}
export function bindJointControls(config,context,find,changed,edit){
 if(!isJoint(config))return;
 for(const k of ['growth',...Object.keys(config.annualMetrics||{})]){
  const loading=find('#mc-joint-'+k+'-loading');if(loading){loading.oninput=changed;bindPrecisionInput(loading);}
  const add=find('#mc-joint-'+k+'-add');if(add)add.onclick=()=>edit(state=>{const year=Math.min(context?.baseline?.length||1,4),values=k==='growth'?context?.baseline:context?.metrics?.[k];state.observations.push({metric:k,year,value:values?.[year-1]??0,errorSD:0});},'#mc-joint-target-'+config.jointAnnual.observations.length+'-value');
 }
 config.jointAnnual.observations.forEach((o,i)=>{for(const part of ['year','value','sd']){const el=find(`#mc-joint-target-${i}-${part}`);if(el){el.oninput=changed;bindPrecisionInput(el);}}const remove=find(`#mc-joint-target-${i}-remove`);if(remove)remove.onclick=()=>edit(state=>state.observations.splice(i,1),'#mc-joint-'+o.metric+'-add');});
}
const jointErrors={
 'Direct annual investment requires the fixed-schedule policy; use annual investmentFactor with a revenue-response policy.':'直接年度投资需要固定计划政策；收入响应政策请使用年度投资系数。',
 'The application supports scenario-baseline terminal mixtures only.':'本应用仅支持情景基准终值混合模式。',
 'Invalid joint annual settings or version.':'联合年度设置或版本无效。',
 'Distinct metric keys are required.':'指标名称必须互不重复。',
 'Factor loadings must refer to active metrics.':'因子载荷只能指向已启用的指标。',
 'Innovation factor loadings must be between −1 and 1.':'创新因子载荷必须在 −1 至 1 之间。',
 'Terminal mode must be conditional-prior or scenario-baseline.':'终值模式必须为条件先验或情景基准。',
 'Supply at most 200 annual observations.':'年度目标最多为 200 个。',
 'Observation-error SD is too small relative to the other constraints to resolve. Increase its error SD or explicitly choose an exact anchor.':'目标误差标准差相对于其他约束太小，无法可靠求解。请增大误差标准差，或明确选择精确锚点。',
 'Distinct hard constraints are too nearly dependent to resolve reliably. Revise the innovation dependence or persistence, or remove redundant targets; no approximate constraint was substituted.':'不同硬性约束过于接近线性相关，无法可靠求解。请修改创新关联、持续性或删除冗余目标；模型未以近似约束替代。',
 'A user-fixed growth year at or after maturity conflicts with variable terminal growth.':'成熟年及其后的用户固定增长年份与可变终值增长率冲突。',
 'Growth at and after maturity must equal the baseline terminal growth.':'成熟年及之后的增长率必须等于基准终值增长率。',
 'A finite baseline growth path of 1–30 years is required.':'需要包含 1–30 年有限数值的基准增长路径。',
 'A valid hard terminal growth anchor is required.':'需要有效的精确终值增长锚点。',
 'Hard source constraints must be an array of at most 200 observations.':'来源硬性约束必须为不超过 200 项的数组。',
 'Hard source constraint is invalid.':'来源硬性约束无效。',
 'Terminal endpoints must contain only finite values for active primitive metrics.':'终值端点只能包含已启用原始指标的有限数值。',
 'Endpoint ranges must refer to active primitive metrics.':'端点范围只能指向已启用的原始指标。',
 'Endpoint ranges require finite low ≤ high.':'端点范围要求有限下限不大于上限。',
 'A target is too far from its baseline relative to uncertainty.':'目标相对于不确定性偏离基准过远。',
 'Joint sampling requires a random generator.':'联合抽样需要随机数生成器。',
 'Random uniforms must be finite and in [0, 1).':'均匀随机数必须是 [0, 1) 内的有限数。'
};
const jp=Object.entries(jointErrors);registerCatalog('jointErrors',{en:Object.fromEntries(jp.map(([e],i)=>['e'+i,e])),'zh-Hans':Object.fromEntries(jp.map(([,z],i)=>['e'+i,z]))});
const jpatterns=[
 [/^Observation (\d+) needs an active metric, forecast year, finite value and nonnegative observation-error SD\.$/,'observation','目标 {index} 必须包含已启用指标、预测年份、有限目标值与非负误差标准差。',['index']],
 [/^Conflicting exact (\w+) anchors in year (\d+)\.$/,'conflict','第 {year} 年的 {metric} 精确锚点冲突。',['metric','year']],
 [/^The (\w+) target in year (\d+) conflicts with a zero-variance path\. Increase its innovation SD or keep the target at baseline\.$/,'zero','第 {year} 年的 {metric} 目标与零方差路径冲突。请增大创新标准差，或将目标保持在基准。',['metric','year']],
 [/^The exact (\w+) target in year (\d+) conflicts with the other hard anchors and the specified innovation dependence\.$/,'dependent','第 {year} 年的 {metric} 精确目标与其他硬性锚点及创新关联冲突。',['metric','year']],
 [/^A finite (\w+) baseline is required for every explicit year\.$/,'baseline','每个明确预测年份都需要有限的 {metric} 基准值。',['metric']],
 [/^The (\w+) terminal baseline must be finite\.$/,'terminal','{metric} 的终值基准必须为有限数。',['metric']],
 [/^(.+) (?:exceeded|exceeds) the finite numerical range\.$/,'numerical','{subject} 超出有限数值范围，请修改输入规模。',['subject']],
 [/^(.+) contains unsupported settings\.$/,'settings','{subject} 包含不支持的设置。',['subject']]
];
for(const [,key,zh,names]of jpatterns)registerCatalog('jointErrors',{en:{[key]:({observation:'Observation {index} needs an active metric, forecast year, finite value and nonnegative observation-error SD.',conflict:'Conflicting exact {metric} anchors in year {year}.',zero:'The {metric} target in year {year} conflicts with a zero-variance path. Increase its innovation SD or keep the target at baseline.',dependent:'The exact {metric} target in year {year} conflicts with the other hard anchors and the specified innovation dependence.',baseline:'A finite {metric} baseline is required for every explicit year.',terminal:'The {metric} terminal baseline must be finite.',numerical:'{subject} exceeds the finite numerical range.',settings:'{subject} contains unsupported settings.'})[key]},'zh-Hans':{[key]:zh}});
export function jointErrorDescriptor(message){const i=jp.findIndex(([e])=>e===message);if(i>=0)return {key:'jointErrors.e'+i,params:{}};for(const [re,key,,names]of jpatterns){const m=message.match(re);if(m)return {key:'jointErrors.'+key,params:Object.fromEntries(names.map((n,i)=>[n,n==='metric'?t(m[i+1]==='growth'?'simulation.t5':'annualMetrics.'+m[i+1]):m[i+1]]))};}return null;}
