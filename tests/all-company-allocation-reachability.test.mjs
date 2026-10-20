import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';import {calculateResearchBridge} from '../dist/research-claims.js';
import {createAnalystAllocationState,getAnalystAllocationDefinition,calculateAnalystAllocation} from '../dist/analyst-conditional-allocation.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {allocateNvmiCommon} from '../dist/nvmi-conditional-allocation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {incrementalPackages} from '../dist/incremental-registry.js';
test('all30 researched operating values remain finite; exactly5 need explicit unknown claims and NVMI existing opt-in works',async()=>{
 const w=await startResearchWorkspace({catalogBundle:JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url))),incrementalBundle:incrementalPackages});
 const tickers=w.root.querySelectorAll('[data-research-company]').map(x=>x.getAttribute('data-research-company'));
 assert.equal(tickers.length,36);assert.deepEqual(tickers.slice(-6),['CEVA','RMBS','UMC','MCD','UBER','NFLX']);
 const priorTickers=tickers.filter(t=>t!=='CEVA'&&t!=='RMBS'&&t!=='UMC'&&t!=='MCD'&&t!=='UBER'&&t!=='NFLX');
 let defaultCommon=0,unknownGroups=0,conditionalReachable=0;assert.equal(priorTickers.length,30);
 for(const ticker of priorTickers){w.choose(ticker);const d=structuredClone(w.getState().draft),operating=calculateResearchOperating(d),timing=researchTimingResult(d,operating);assert.ok(Number.isFinite(operating.enterprise),d.ticker);const bridge=calculateResearchBridge(d,timing.enterprise,{...(d.bridgeInputs||{}),calculationDate:timing.date});
  const definition=getAnalystAllocationDefinition(d.ticker);
  if(definition){unknownGroups++;assert.equal(bridge.perShare,null,d.ticker);const state=createAnalystAllocationState(d.ticker),blank=calculateAnalystAllocation(d,timing,state);assert.equal(blank.status,'incomplete',d.ticker);assert.ok(blank.missing.length>0);assert.ok(definition.fields.filter(f=>f.default===null).every(f=>blank.missing.includes(f.key)));assert.ok(definition.fields.every(f=>f.label.length===2&&f.provenance.length===2));
   // Synthetic test values only: never persisted or loaded as research defaults.
   for(const key of blank.missing)state.inputs[key]=1;const explicit=calculateAnalystAllocation(d,timing,state);assert.ok(['analyst-conditional','no-positive-common'].includes(explicit.status),JSON.stringify({ticker:d.ticker,errors:explicit.errors}));assert.ok(Number.isFinite(explicit.signedResidualPerShare));conditionalReachable++;const config={...d.researchSimulationConfig,trials:3,seed:'allocation-EV-only-'+d.ticker};const originalMC=simulateResearch(d,config),conditionalMC=simulateResearch({...d,analystConditionalAllocation:state},config);assert.deepEqual(conditionalMC,originalMC,d.ticker+' optional allocation cannot alter Monte Carlo');assert.equal(conditionalMC.perShare.accepted,0,d.ticker);assert.equal(calculateResearchBridge(d,timing.enterprise,{...(d.bridgeInputs||{}),calculationDate:timing.date}).perShare,null);
  }else if(d.ticker==='NVMI'){assert.equal(bridge.perShare,null);const optional=allocateNvmiCommon(operating.enterprise);assert.ok(Math.abs(optional.perShare-154.26720189007807)<1e-8);conditionalReachable++;}
  else{assert.ok(Number.isFinite(bridge.perShare),d.ticker);defaultCommon++;}
 }
 w.destroy();assert.equal(defaultCommon,24);assert.equal(unknownGroups,5);assert.equal(conditionalReachable,6);
});
