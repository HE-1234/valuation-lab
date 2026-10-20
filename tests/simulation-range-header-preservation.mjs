import {reverseMcdIntegration} from './mcd-integration-preservation.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const RANGE_HEADER_BASE='df4bb76d76f719037a6f1ed9595b377e539a7cca';
export const RANGE_HEADER_PATH='dist/skins/report.css';
export const RANGE_HEADER_BEFORE='f1a4ae88fb43848aebaf2996979bb063d5be353fd32400a14c498a7388ca7fdb';
export const RANGE_HEADER_AFTER='51c2fbfc2281b20b07aa72a20944cc249563edef8fe57eb237622fcb0d60b82d';
export const RANGE_HEADER_RULE='    & body .rx-mc-right > :is(.mc-heading, .mc-output-stage, .mc-extra) { flex-shrink: 0; }\n';
export const rangeHeaderSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseSimulationRangeHeader(path,bytes,earlierContext=''){
 bytes=reverseMcdIntegration(path,bytes,earlierContext);
 if(path!==RANGE_HEADER_PATH)return bytes;
 assert.ok(Buffer.isBuffer(bytes),'Exact production bytes are required');
 assert.equal(rangeHeaderSHA(bytes),RANGE_HEADER_AFTER,path+' exact reviewed range header fix bytes; exact reviewed Claude simulation UI bytes'+earlierContext);
 const source=bytes.toString('utf8');assert.equal(source.split(RANGE_HEADER_RULE).length-1,1,'Exactly one scoped non-shrinking rule is allowed');
 const restored=Buffer.from(source.replace(RANGE_HEADER_RULE,''));assert.equal(rangeHeaderSHA(restored),RANGE_HEADER_BEFORE,'The one-line repair must restore exact published V84 CSS');return restored;
}
