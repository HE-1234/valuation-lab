import {registerCatalog,t} from './i18n.js';
import {researchReferenceState,hasInactiveReferencePersistence} from './research-reference-defaults.js';
import {conditionedGrowthContext,prepareAnnualPath,prepareAnnualMetrics} from './annual-path-sampling.js';
registerCatalog('annualReference',{en:{
 status:'{width} {scope} {persistence}',
 introduction:'Research defaults reproduce a conditional company case. Change assumptions below, then run manually.',
 defaults:'Reset restores no user-fixed forecast years, zero innovation SD and baseline terminal values. Persistence 0 is an inactive reference placeholder at these fixed endpoints, not estimated independence.',
 zero:'Uncalibrated zero-width reference. A single conditional result is not a confidence range. Set explicit uncertainty assumptions to explore a range.',
 variable:'User-defined uncertainty is active. Any resulting range is conditional on these assumptions, not research-calibrated probabilities.',
 noAnchors:'No user-fixed forecast years selected. Source-defined terminal anchors, fixed opening stubs and obligations are separate.',
 anchors:'Selected forecast years hold those inputs at baseline. Source-defined terminal anchors, fixed opening stubs and obligations are separate.',
 persistence:'At this zero-SD, fixed-endpoint reference, persistence 0 is inactive, not estimated independence.',
 scalar:'Scalar method: annual-path SDs, persistence, terminal growth/tax/ROIC settings and forecast-year selections are inactive. Source-defined opening stubs and obligations stay fixed.',
 invalid:'Reference status unavailable while settings are invalid. Correct them before running; saved choices are retained.'
},'zh-Hans':{
 status:'{width} {scope} {persistence}',
 introduction:'研究默认值重现公司的条件情景。修改下方假设后，请手动运行。',
 defaults:'重置后不选取用户固定预测年份，创新标准差为零，终值采用基准值。在这些固定端点下，持续性 0 仅为未启用的参考占位值，并非估计出的独立性。',
 zero:'未经校准的零宽度参考情景。单一条件结果不是置信区间；请明确设定不确定性假设以探索范围。',
 variable:'已启用用户设定的不确定性。所得范围以这些假设为条件，并非经研究校准的概率。',
 noAnchors:'未选取用户固定预测年份。来源定义的终值锚点、固定期初短期现金流及义务另行保留。',
 anchors:'所选预测年份将对应输入固定在基准值。来源定义的终值锚点、固定期初短期现金流及义务另行保留。',
 persistence:'在此零标准差、固定端点参考情景中，持续性 0 未启用，并非估计出的独立性。',
 scalar:'标量模式：年度路径标准差、持续性、终值增长率/税率/ROIC 设置及预测年份选择均不启用。来源定义的期初短期现金流及义务保持固定。',
 invalid:'设置无效时无法判断参考状态。请修正后再运行；已保存的选择仍予保留。'
}});
export function referenceStatusMessage(config,context,validate){
 let state,c;try{
  c=validate(config);
  if(c.annualMetrics?.reinvestment&&c.capitalPolicy!=='fixed-schedule')throw Error('Direct annual investment requires the fixed-schedule policy.');
  if(c.method==='annual-path'){
   const conditioned=conditionedGrowthContext(context,c.annualTerminal);
   prepareAnnualPath(conditioned.baseline,c.annualPath,conditioned);
   if(c.annualMetrics)prepareAnnualMetrics(conditioned,c.annualMetrics);
  }
  state=researchReferenceState(c,context);
 }catch{return {key:'annualReference.status',params:{width:t('annualReference.invalid'),scope:'',persistence:''}};}
 return {key:'annualReference.status',params:{width:t('annualReference.'+(state.stochastic?'variable':'zero')),scope:t('annualReference.'+(!state.annual?'scalar':state.userFixed?'anchors':'noAnchors')),persistence:hasInactiveReferencePersistence(c,context)?t('annualReference.persistence'):''}};
}
