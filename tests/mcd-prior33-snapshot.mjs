// Snapshot method is inherited byte-for-byte from the prior-company regression.
// The fixture is captured from the clean, immutable final UI baseline, never
// from the MCD candidate; it covers all 33 prior companies and locale keys.
export {captureV81Snapshot as captureMcdBaselineSnapshot} from './umc-v81-snapshot.mjs';
