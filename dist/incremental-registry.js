// Versioned company packages are independent; earlier files stay byte-identical.
import {incrementalRegistry} from './incremental-research-registry.js';
import {amatRegistry} from './amat-research-registry.js';
import {lrcxRegistry} from './lrcx-research-registry.js';
export {incrementalRegistry};
export const incrementalPackages=Object.freeze([incrementalRegistry,amatRegistry,lrcxRegistry]);
export const incrementalRecords=Object.freeze(incrementalPackages.flatMap(bundle=>bundle.companies));
export const incrementalRecord=ticker=>incrementalRecords.find(row=>row.identity.ticker===ticker)||null;
