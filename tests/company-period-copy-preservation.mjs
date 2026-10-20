import {reverseLatestUserUi} from './latest-user-ui-preservation.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Two exact presentation-only repairs above V86. Every research and older fixture byte stays frozen.
export const COMPANY_COPY_BASE='fda9fcfa566d174e97924305b4ff3f6b7daabd4d';
export const COMPANY_COPY_FILES=Object.freeze(Object.fromEntries(Object.entries({
  "dist/research-view.js": {
    "beforeSHA256": "c1a9080e22ce4928e6123032127299dadc3c123a6f907774ba6993bc6e8fcb15",
    "afterSHA256": "b336837ddd39dbd76f6ab927b1204398ad0b14221bc5f48e7a4d99ee5ba61270",
    "repairs": [
      {
        "before": "['UMC','MCD','UBER'].includes(c.ticker)&&caveat===incrementalRecord(c.ticker).prose.scope.en",
        "after": "['UMC','MCD','UBER','NFLX'].includes(c.ticker)&&caveat===incrementalRecord(c.ticker).prose.scope.en"
      },
      {
        "before": "c.anchor.kind==='source_derived_TTM_actual'?'Source-derived TTM'",
        "after": "['source_derived_TTM_actual','source_derived_ttm'].includes(c.anchor.kind)?'Source-derived TTM'"
      }
    ]
  }
}).map(([path,item])=>[path,Object.freeze({...item,repairs:Object.freeze(item.repairs.map(Object.freeze))})])));
export const companyCopySHA=bytes=>createHash('sha256').update(bytes).digest('hex');
const productionPath=x=>typeof x==='string'&&x.startsWith('dist/')&&!/[\\\0\r\n]/.test(x)&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
export function reverseCompanyPeriodCopy(path,bytes,earlierContext=''){
 bytes=reverseLatestUserUi(path,bytes,earlierContext);
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');
 assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');
 if(!Object.prototype.hasOwnProperty.call(COMPANY_COPY_FILES,path))return bytes;
 const f=COMPANY_COPY_FILES[path];
 assert.equal(companyCopySHA(bytes),f.afterSHA256,path+' exact reviewed company period copy bytes; exact reviewed NFLX integration bytes; exact reviewed UBER integration bytes; exact reviewed MCD integration bytes; exact reviewed range header fix bytes; exact reviewed Claude simulation UI bytes'+earlierContext);
 let restored=bytes.toString('utf8');
 for(const repair of f.repairs){assert.equal(restored.split(repair.after).length-1,1,'Exactly one reviewed company copy replacement is allowed');restored=restored.replace(repair.after,repair.before);}
 const out=Buffer.from(restored);assert.equal(companyCopySHA(out),f.beforeSHA256,'Company copy reversal must restore exact V86 source');return out;
}
