import assert from 'node:assert/strict';

// The approved fresh-default delta is one method selector plus an independent,
// exact copy of the existing annual settings. No valuation setting may be lost.
export function assertFreshJointDefaults(config){
 assert.equal(config.method,'joint-annual-path');
 const fields=['annualPath','annualMetrics','annualTerminal','drivers','dependence'];
 const expected={version:1,terminalMode:'scenario-baseline',
  ...Object.fromEntries(fields.filter(key=>config[key]!==undefined).map(key=>[key,structuredClone(config[key])])),
  loadings:Object.fromEntries(['growth',...Object.keys(config.annualMetrics)].map(key=>[key,0])),observations:[]};
 assert.deepEqual(config.jointAnnual,expected);
 const detached=(nested,outer,path)=>{if(outer&&typeof outer==='object'){assert.notEqual(nested,outer,path+' is independently stored');for(const key of Object.keys(outer))detached(nested[key],outer[key],path+'.'+key);}};
 for(const key of fields)detached(config.jointAnnual[key],config[key],key);
 return config;
}

// Old full-result hashes still include every original field and numerical value.
// Refuse unknown default deltas instead of normalizing them away.
export function preJointAnnualDefaults(config){
 assertFreshJointDefaults(config);
 const previous=structuredClone(config);
 previous.method='annual-path';
 delete previous.jointAnnual;
 return previous;
}
