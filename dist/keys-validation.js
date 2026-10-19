import {keysError} from './keys-financial-engine.js';
export function keysValidationError(issues){return keysError(issues.join(' '),'invalid');}
