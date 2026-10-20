import {reverseNativeGuideFix} from './native-guide-layout-preservation.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {GEOMETRY_FILES} from './chart-trial-geometry-preservation.mjs';

// Exact latest user UI, above the independent company-copy and geometry layers.
// Source SHA-256 and Git blob IDs were checked against the retrieved upstream
// commit. Before bytes come only from this independently pinned published V86.
// This layer adds no fixtures and changes no older source/hash allowance.
export const LATEST_UI_BASE_COMMIT='fda9fcfa566d174e97924305b4ff3f6b7daabd4d';
export const LATEST_UI_SOURCE_COMMIT='c8ec118ae7ff2538a70a95b274632f78b836e4c5';
export const LATEST_UI_SOURCE_BASE='223174cb067ff23289e4412b5786810b3a18076e';
export const LATEST_UI_FILES=Object.freeze(Object.fromEntries(Object.entries({
  "dist/approved-charts.js": {
    "mode": "100644",
    "baseBlob": "3b25b05d281158827547abb966e4beb7d1d04845",
    "beforeSHA256": "97b39298c782090d8966ecb2ccc349fffdd3b41896807c0198e14af7f1779fec",
    "sourceBlob": "29c533cf5c9ab3abbd1a72cfd31117aa0cfde5c3",
    "sourceSHA256": "5d1f3d08e36b850440eff11ea4df88ec1415a03e6ce892217e7443772c14a1e9",
    "afterSHA256": "5d1f3d08e36b850440eff11ea4df88ec1415a03e6ce892217e7443772c14a1e9"
  },
  "dist/guided-localization.js": {
    "mode": "100644",
    "baseBlob": "25a2f148050a7d48089f0412a5291f2c796f776b",
    "beforeSHA256": "cf8b3086c62ab7b29815fb0c6ed5a5927a8558e517c0daab11ba14fbea312b1a",
    "sourceBlob": "ca9c4644118baea443a5d2ba349856ea4d153739",
    "sourceSHA256": "0a4bd8085aa29cbd450042fd8ee6849e3b9fb9775835c91f9418c2c3f33e4c02",
    "afterSHA256": "0a4bd8085aa29cbd450042fd8ee6849e3b9fb9775835c91f9418c2c3f33e4c02"
  },
  "dist/historical-workspace.js": {
    "mode": "100644",
    "baseBlob": "766fd96a071de6e90bdee9ab5c71a50acc1eaba6",
    "beforeSHA256": "fa07140c30abf46ef4bd7098e168b6b864463f6c72d9a022c8be94ff266aff7f",
    "sourceBlob": "78cf748cff4cdf9cfee2e4c9dacff18f524552e7",
    "sourceSHA256": "1ba05c75b41c348e39afd125cef167e0c6ee6c19e567531a27eaa9a58973c16c",
    "afterSHA256": "1ba05c75b41c348e39afd125cef167e0c6ee6c19e567531a27eaa9a58973c16c"
  },
  "dist/skins/report-interactions.js": {
    "mode": "100644",
    "baseBlob": "beedff46a3bf83cbcaacc2cfa7ecd082ddabb50e",
    "beforeSHA256": "0d3dcbff6fef0cb1872852f64b3eb15f6803c7e3dbe323d57b5798f1f0057899",
    "sourceBlob": "fd702f973fb04947078676b4ea44a3106b46dbf2",
    "sourceSHA256": "00e691b0634c3d27afd02a03a8e183f4bc4fc290f648e32916c9df6930a0ff48",
    "afterSHA256": "00e691b0634c3d27afd02a03a8e183f4bc4fc290f648e32916c9df6930a0ff48"
  },
  "dist/skins/report-journey.js": {
    "mode": "100644",
    "baseBlob": "caeffceea63d18f7c516dd150e9212ce43831895",
    "beforeSHA256": "5405b95f0f09106c19dab3ea7fcc240d85c4c37e94582ffd08524bcfdce769c4",
    "sourceBlob": "c1c1e5d0a451d05c5a504d13529baaf7f46a133e",
    "sourceSHA256": "de36db16685c8c07df16b2595c8478970e795dd749812e81a53789c549ff3cc5",
    "afterSHA256": "de36db16685c8c07df16b2595c8478970e795dd749812e81a53789c549ff3cc5"
  },
  "dist/skins/report-mc-guide.js": {
    "mode": "100644",
    "baseBlob": "23acb02aef7dc7442ca59543b4c3acf5d2264693",
    "beforeSHA256": "19b447feedafefcca61cef93c7bbd6e387ac55b689bf5bef6e8015b3efd4cc53",
    "sourceBlob": "00c8924575e42cc52dab0522f0c535e30d5c621c",
    "sourceSHA256": "6cd7ce0861e459deabbfed42f1ec9619a38291a46f3dd9fd9e6aa73cccbfd6d3",
    "afterSHA256": "6e393cb445af4261872f2a96e1a1e0b5e8f12b4ee9992b07e5cbf173cc3f08cd"
  },
  "dist/skins/report.css": {
    "mode": "100644",
    "baseBlob": "356370e6b4fedde7697a05a362d11251fa6bfebf",
    "beforeSHA256": "23dfd58a7d90dede8b302fcf252e3078cd41ae056405aa4839b327e8e78b3fba",
    "sourceBlob": "59c3fc679893646e6db0fab33b806148d34f7126",
    "sourceSHA256": "27165de686b68eced9486e9987bcdda33fc29df589a0b608e49ebbe83db6891a",
    "afterSHA256": "7f4cd97607d59871a3e4b7be59db0f63519634264721102e27efd563cc8511a1"
  }
}).map(([path,item])=>[path,Object.freeze(item)])));
export const LATEST_UI_PATHS=Object.freeze(Object.keys(LATEST_UI_FILES));
// This separate compatibility-only file is not an upstream UI change.
export const LATEST_UI_COMPATIBILITY_FILES=Object.freeze(Object.fromEntries(Object.entries({
  "dist/simulation-view.js": {
    "mode": "100644",
    "baseBlob": "16d1482cc0bb3c7967214697dc9da239cbe265ff",
    "beforeSHA256": "3dbe421504e50b0a3fa4839e468a60138c24952be1b6c918a2a86aeb363c023d",
    "afterSHA256": "2c5c0c6edc6b74984843413a64fb63e6c533a39a50e6af5a7cae66997ac77e78"
  }
}).map(([path,item])=>[path,Object.freeze(item)])));
const MODIFIED_FILES=Object.freeze({...LATEST_UI_FILES,...LATEST_UI_COMPATIBILITY_FILES});
export const LATEST_UI_MODIFIED_PATHS=Object.freeze(Object.keys(MODIFIED_FILES));
// The pre-existing V86 custom-mobile-trial geometry repair is retained verbatim.
// Every other difference from the upstream files must be explicitly listed here.
export const LATEST_UI_COMPATIBILITY=Object.freeze({
 'dist/skins/report-mc-guide.js':Object.freeze([
  {
    "before": "    fieldIs: 'On the left: {f}',\n    nSettings: '{n} settings',\n    leads: '{tab} leads',\n    precChip: 'median ±{v} at your count',\n    pairT: '{a} vs {b}',\n    pairChip: 'end vs journey',\n    pairRange: 'Range',\n",
    "after": "    fieldIs: 'On the left: {f}',\n    nSettings: '{n} settings',\n    leads: '{tab} leads',\n    precChip: 'rough median ±{v} at your count',\n    pairT: '{a} vs {b}',\n    pairChip: 'end vs journey',\n    pairRange: 'Range',\n"
  },
  {
    "before": "    // sampling\n    q_sampling: 'How many scenarios are enough?',\n    l_sampling: 'Each scenario is one random draw of every input. More scenarios give a steadier range, but precision grows only with the square root of the count.',\n    precT: 'How much luck moves the result',\n    precLead: 'How far luck alone can push each number from where unlimited scenarios would put it, about 95% of the time. Estimated from the spread of {src}.',\n    precSrcRun: 'your last run',\n    precSrcPreview: 'a {n}-scenario preview',\n    precMed: 'median ±{v}',\n",
    "after": "    // sampling\n    q_sampling: 'How many scenarios are enough?',\n    l_sampling: 'Each scenario is one random draw of every input. More scenarios give a steadier range, but precision grows only with the square root of the count.',\n    precT: 'Approximate sampling precision',\n    precLead: 'Rough normal-reference estimates of sampling variation, based on accepted scenarios from {src}. They assume approximately bell-shaped accepted values and are not validated 95% intervals. Skewed, heavy-tailed or repeated values can make them unreliable.',\n    precAccepted: '{accepted} accepted of {attempts} attempted. Comparisons project this acceptance rate.',\n    precRowAccepted: '≈{n} accepted (projected)',\n    precRowActual: '{n} accepted',\n    precWithheld: 'Estimate withheld',\n    precUnavailable: 'Precision estimate withheld: it needs at least 100 accepted scenarios, valid counts and a measurable central spread. This cutoff is a display safeguard, not proof the approximation is reliable. Run more scenarios and inspect the distribution.',\n    precSrcRun: 'your last run',\n    precSrcPreview: 'a {n}-scenario preview',\n    precMed: 'median ±{v}',\n"
  },
  {
    "before": "    fieldIs: '左侧字段：{f}',\n    nSettings: '{n} 项设置',\n    leads: '{tab}居首',\n    precChip: '当前情景数下中位数 ±{v}',\n    pairT: '{a} vs {b}',\n    pairChip: '终点 vs 途中',\n    pairRange: '范围',\n",
    "after": "    fieldIs: '左侧字段：{f}',\n    nSettings: '{n} 项设置',\n    leads: '{tab}居首',\n    precChip: '当前情景数下中位数约 ±{v}',\n    pairT: '{a} vs {b}',\n    pairChip: '终点 vs 途中',\n    pairRange: '范围',\n"
  },
  {
    "before": "    toRel: '打开{tab} →',\n    q_sampling: '需要多少个情景才够？',\n    l_sampling: '每个情景都是对所有输入的一次随机抽取。情景越多，区间越稳定，但精确度只随情景数的平方根提高。',\n    precT: '运气会让结果变动多少',\n    precLead: '单凭运气，每个数字可能偏离“无限多情景”结果的幅度（约 95% 的情况下）。根据{src}的分散程度估算。',\n    precSrcRun: '你最近一次模拟',\n    precSrcPreview: '{n} 个情景的预览',\n    precMed: '中位数 ±{v}',\n",
    "after": "    toRel: '打开{tab} →',\n    q_sampling: '需要多少个情景才够？',\n    l_sampling: '每个情景都是对所有输入的一次随机抽取。情景越多，区间越稳定，但精确度只随情景数的平方根提高。',\n    precT: '抽样精度的近似估计',\n    precLead: '根据{src}中被接受的情景估算抽样波动，仅以正态分布作粗略参照。这些数字假设被接受的估值近似钟形分布，未经验证为 95% 置信区间。偏态、厚尾或大量重复结果都可能使估算不可靠。',\n    precAccepted: '尝试 {attempts} 个情景，接受 {accepted} 个。比较结果按此接受率推算。',\n    precRowAccepted: '预计接受 {n} 个',\n    precRowActual: '已接受 {n} 个',\n    precWithheld: '暂不提供精度估计',\n    precUnavailable: '暂不提供精度估计：需要至少 100 个被接受的情景、有效计数和可衡量的中间区间。此门槛仅为显示保护，并不证明近似方法可靠。请增加情景数并检查分布。',\n    precSrcRun: '你最近一次模拟',\n    precSrcPreview: '{n} 个情景的预览',\n    precMed: '中位数 ±{v}',\n"
  },
  {
    "before": "\n// Monte Carlo error of the reported numbers, from the normal approximation:\n// SE(median) = √(π/2)·σ/√n and SE(P10) = √(0.1·0.9)/φ(1.2816)·σ/√n = 1.709·σ/√n,\n// with σ estimated as (P90 − P10) / 2.563. Shown at 95% (×1.96), as \"about\".\nfunction samplingGuide(st) {\n  const c = st.config, n = c.trials;\n  let sum, src;\n  if (st.latest) { sum = {p10: st.latest.p10, p50: st.latest.p50, p90: st.latest.p90}; src = copy('precSrcRun'); }\n  else { sum = request(st, 'samp', full(st), true); src = copy('precSrcPreview', {n: num(TRIALS, 0)}); }\n  let value, chip = !sum ? '…' : '';\n  if (!sum || sum.error) value = valueBlock(st, sum);\n  else {\n    const sigma = Math.max(0, sum.p90 - sum.p10) / 2.5631;\n    const counts = uniq([1000, 5000, 10000, n].filter(k => finite(k) && k > 0));\n    const med = k => 1.96 * 1.2533 * sigma / Math.sqrt(k), edge = k => 1.96 * 1.7094 * sigma / Math.sqrt(k);\n    const widest = 2 * edge(counts[0]) || 1;\n    const rows = counts.map(k => {\n      const w = 2 * med(k) / widest, we = 2 * edge(k) / widest;\n      const rel = finite(sum.p50) && sum.p50 ? ` (${fmtPct(med(k) / Math.abs(sum.p50))})` : '';\n      return `<li class=\"${k === n ? 'is-yours' : ''}\"><span>${esc(num(k, 0))}${k === n ? `<small>${esc(copy('precCur'))}</small>` : ''}</span><i class=\"is-err\" style=\"--a:${(.5 - w / 2).toFixed(4)};--w:${w.toFixed(4)};--ea:${(.5 - we / 2).toFixed(4)};--ew:${we.toFixed(4)};--b:.5\"></i><em>${esc(copy('precMed', {v: fmtVal(med(k)) + rel}))} · ${esc(copy('precEdge', {v: fmtVal(edge(k))}))}</em></li>`;\n    }).join('');\n    // Luck against what the inputs themselves do: the noise should be a small fraction of the range.\n    if (finite(sum.p50) && sum.p50 && finite(n)) chip = copy('precChip', {v: fmtPct(med(n) / Math.abs(sum.p50))});\n    const half = (sum.p90 - sum.p10) / 2, verdict = half > 0 && finite(n) ? copy('precVs', {n: num(n, 0), noise: fmtVal(med(n)), range: fmtVal(half), x: num(Math.max(1, half / med(n)), 0)}) : '';\n    value = `<figure class=\"rx-mcg-wi rx-mcg-prec\" aria-label=\"${esc(copy('precT'))}\"><ul>${rows}</ul><figcaption><span class=\"rx-mcg-key\"><i class=\"is-hi\"></i>${esc(copy('precKeyMed'))}<i class=\"is-soft\"></i>${esc(copy('precKeyEdge'))}</span></figcaption></figure><p class=\"rx-mcg-read\">${esc(verdict)}</p><p class=\"rx-mcg-sub rx-mcg-after\">${esc(copy('precRead'))}</p>`;\n  }\n  const knobs = knob(copy('trialsT', {v: num(n, 0)}), copy('trialsB'), '', 'trials', 'trials') + knob(copy('seedT', {v: String(c.seed ?? '—')}), copy('seedB'), '', 'seed', 'seed');\n  return [\n    ['head', `<header class=\"rx-mcg-head\"><span class=\"rx-mcg-eyebrow\">${esc(copy('eyebrow'))}</span></header><h3>${esc(copy('q_sampling'))}</h3><p class=\"rx-mcg-lead\">${esc(copy('l_sampling'))}</p>`],\n    // Folded: on Sampling the latest range below should stay in view.\n    ['value', fold('prec', copy('precT'), `<p class=\"rx-mcg-sub\">${esc(copy('precLead', {src}))}</p>${value}`, {chip, ic: 'prec'})],\n    ['knobs', fold('sknobs', copy('knobs'), `<ul class=\"rx-mcg-knobs\">${knobs}</ul>`, {chip: copy('nSettings', {n: 2}), ic: 'knobs'})]\n  ];\n}\n",
    "after": "\n// Monte Carlo error of the reported numbers, from the normal approximation:\n// SE(median) = √(π/2)·σ/√n and SE(P10) = √(0.1·0.9)/φ(1.2816)·σ/√n = 1.709·σ/√n,\n// with σ estimated as (P90 − P10) / 2.563. This is an illustrative normal-output\n// approximation, not a validated confidence interval. Exclusions reduce n.\nfunction samplingPrecision(sum, attempts, count) {\n  if (!sum || !Number.isInteger(sum.accepted) || sum.accepted < 100 || !Number.isInteger(attempts) || sum.accepted > attempts || !Number.isInteger(count) || count <= 0) return null;\n  if (![sum.p10, sum.p50, sum.p90].every(finite) || !(sum.p10 <= sum.p50 && sum.p50 <= sum.p90 && sum.p90 > sum.p10)) return null;\n  const accepted = count === attempts ? sum.accepted : Math.floor(count * (sum.accepted / attempts)), width = sum.p90 - sum.p10;\n  if (!(width > Number.EPSILON * Math.max(Math.abs(sum.p10), Math.abs(sum.p90)))) return null;\n  const sigma = width / 2.5631;\n  if (!(accepted >= 100) || !finite(sigma)) return null;\n  const median = (sigma / Math.sqrt(accepted)) * (1.96 * 1.2533), edge = (sigma / Math.sqrt(accepted)) * (1.96 * 1.7094);\n  return finite(median) && finite(edge) && median > 0 && edge > 0 ? {accepted, median, edge} : null;\n}\nconst precisionValue = v => v > 0 && v < .01 ? '<' + fmtVal(.01) : fmtVal(v);\nconst precisionPercent = v => (v > 0 && v * 100 < .01 ? '<0.01' : num(v * 100, 2)) + '%';\nfunction samplingGuide(st) {\n  const c = st.config, n = c.trials;\n  let sum, src;\n  if (st.latest) { sum = {p10: st.latest.p10, p50: st.latest.p50, p90: st.latest.p90, accepted: st.latest.accepted}; src = copy('precSrcRun'); }\n  else { sum = request(st, 'samp', full(st), true); src = copy('precSrcPreview', {n: num(TRIALS, 0)}); }\n  const attempts = st.latest ? n : TRIALS, precision = samplingPrecision(sum, attempts, n);\n  let value, chip = !sum ? '…' : '', acceptedNote = '';\n  if (!sum) value = valueBlock(st, sum);\n  else if (sum.error || !precision) { value = `<p class=\"rx-mcg-read\">${esc(copy('precUnavailable'))}</p>`; chip = copy('precWithheld'); }\n  else {\n    acceptedNote = `<p class=\"rx-mcg-sub\">${esc(copy('precAccepted', {accepted: num(sum.accepted, 0), attempts: num(attempts, 0)}))}</p>`;\n    const counts = uniq([1000, 5000, 10000, n].filter(k => finite(k) && k > 0));\n    const estimates = counts.map(k => samplingPrecision(sum, attempts, k));\n    const med = k => samplingPrecision(sum, attempts, k)?.median, edge = k => samplingPrecision(sum, attempts, k)?.edge;\n    const widest = 2 * Math.max(...estimates.filter(Boolean).map(x => x.edge)) || 1;\n    const rows = counts.map(k => {\n      const estimate = samplingPrecision(sum, attempts, k);\n      if (!estimate) return `<li><span>${esc(num(k, 0))}</span><i></i><em>${esc(copy('precWithheld'))}</em></li>`;\n      const w = 2 * med(k) / widest, we = 2 * edge(k) / widest;\n      const rel = finite(sum.p50) && sum.p50 ? ` (${precisionPercent(med(k) / Math.abs(sum.p50))})` : '';\n      return `<li class=\"${k === n ? 'is-yours' : ''}\"><span>${esc(num(k, 0))}${k === n ? `<small>${esc(copy('precCur'))}</small>` : ''}<small>${esc(copy(st.latest && k === n ? 'precRowActual' : 'precRowAccepted', {n: num(estimate.accepted, 0)}))}</small></span><i class=\"is-err\" style=\"--a:${(.5 - w / 2).toFixed(4)};--w:${w.toFixed(4)};--ea:${(.5 - we / 2).toFixed(4)};--ew:${we.toFixed(4)};--b:.5\"></i><em>${esc(copy('precMed', {v: precisionValue(med(k)) + rel}))} · ${esc(copy('precEdge', {v: precisionValue(edge(k))}))}</em></li>`;\n    }).join('');\n    // Luck against what the inputs themselves do: the noise should be a small fraction of the range.\n    if (finite(sum.p50) && sum.p50 && finite(n)) chip = copy('precChip', {v: precisionPercent(med(n) / Math.abs(sum.p50))});\n    const half = (sum.p90 - sum.p10) / 2, verdict = half > 0 && finite(n) ? copy('precVs', {n: num(n, 0), noise: precisionValue(med(n)), range: precisionValue(half), x: num(Math.max(1, half / med(n)), 0)}) : '';\n    value = `<figure class=\"rx-mcg-wi rx-mcg-prec\" aria-label=\"${esc(copy('precT'))}\"><ul>${rows}</ul><figcaption><span class=\"rx-mcg-key\"><i class=\"is-hi\"></i>${esc(copy('precKeyMed'))}<i class=\"is-soft\"></i>${esc(copy('precKeyEdge'))}</span></figcaption></figure><p class=\"rx-mcg-read\">${esc(verdict)}</p><p class=\"rx-mcg-sub rx-mcg-after\">${esc(copy('precRead'))}</p>`;\n  }\n  const knobs = knob(copy('trialsT', {v: num(n, 0)}), copy('trialsB'), '', 'trials', 'trials') + knob(copy('seedT', {v: String(c.seed ?? '—')}), copy('seedB'), '', 'seed', 'seed');\n  return [\n    ['head', `<header class=\"rx-mcg-head\"><span class=\"rx-mcg-eyebrow\">${esc(copy('eyebrow'))}</span></header><h3>${esc(copy('q_sampling'))}</h3><p class=\"rx-mcg-lead\">${esc(copy('l_sampling'))}</p>`],\n    // Folded: on Sampling the latest range below should stay in view.\n    ['value', fold('prec', copy('precT'), `<p class=\"rx-mcg-sub\">${esc(copy('precLead', {src}))}</p>${acceptedNote}${value}`, {chip, ic: 'prec'})],\n    ['knobs', fold('sknobs', copy('knobs'), `<ul class=\"rx-mcg-knobs\">${knobs}</ul>`, {chip: copy('nSettings', {n: 2}), ic: 'knobs'})]\n  ];\n}\n"
  },
  {
    "before": "document.addEventListener('focusin', e => {\n  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;\n  const st = links.get(root) || {}, row = rowFor(e.target);\n  if (same(st.focus, row)) return;\n  st.focus = row; links.set(root, st); relink(root, !!row);\n});\ndocument.addEventListener('focusout', e => {\n  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;\n",
    "after": "document.addEventListener('focusin', e => {\n  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;\n  const st = links.get(root) || {}, row = rowFor(e.target);\n  clearTimeout(hoverTimer);\n  if (same(st.focus, row) && !st.hover) return;\n  st.hover = null; st.focus = row; links.set(root, st); relink(root, !!row);\n});\ndocument.addEventListener('focusout', e => {\n  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;\n"
  },
  {
    "before": "  for (const n of root.querySelectorAll('.rx-mcg-target')) if (!li || !n.id.endsWith('mc-' + li.dataset.f)) n.classList.remove('rx-mcg-target');\n  if (li) root.querySelector(`.mc-setup [id$=\"mc-${li.dataset.f}\"]`)?.classList.add('rx-mcg-target');\n  // Left to right, after a short rest so a pointer passing by does not flicker.\n  if (e.target.closest('.rx-mcg')) return;\n  const row = rowFor(e.target), st = links.get(root) || {};\n  if (same(st.hover, row)) return;\n  clearTimeout(hoverTimer);\n  hoverTimer = setTimeout(() => { st.hover = row; links.set(root, st); relink(root, false); }, row ? 90 : 160);\n});\nfunction editField(root, f) {\n  const el = root.querySelector(`.mc-setup [id$=\"mc-${f}\"]`); if (!el) return;\n  const shown = x => x && (x.checkVisibility ? x.checkVisibility() : !!x.offsetParent);\n  let target = el.matches('input, select, textarea, button') ? el : el.querySelector('[aria-checked=\"true\"], input, select, button') || el;\n  if (!shown(target) || target.getAttribute('aria-hidden') === 'true' || target.tabIndex < 0) target = el.parentElement?.querySelector('[role=\"radiogroup\"] [aria-checked=\"true\"]') || el.parentElement?.querySelector('[role=\"radiogroup\"] button') || target;\n",
    "after": "  for (const n of root.querySelectorAll('.rx-mcg-target')) if (!li || !n.id.endsWith('mc-' + li.dataset.f)) n.classList.remove('rx-mcg-target');\n  if (li) root.querySelector(`.mc-setup [id$=\"mc-${li.dataset.f}\"]`)?.classList.add('rx-mcg-target');\n  // Left to right, after a short rest so a pointer passing by does not flicker.\n  if (e.target.closest('.rx-mcg')) {\n    clearTimeout(hoverTimer); const st = links.get(root);\n    if (st?.hover) { st.hover = null; relink(root); }\n    return;\n  }\n  const row = rowFor(e.target), st = links.get(root) || {};\n  if (same(st.hover, row)) return;\n  clearTimeout(hoverTimer);\n  const mountId = root.mcState?.mountId;\n  hoverTimer = setTimeout(() => { if (!root.mcState || root.mcState.mountId !== mountId) return; st.hover = row; links.set(root, st); relink(root, false); }, row ? 90 : 160);\n});\ndocument.addEventListener('pointerout', e => {\n  const root = e.target.closest?.('[data-rx-mcv]');\n  if (!root || e.relatedTarget && root.contains(e.relatedTarget)) return;\n  clearTimeout(hoverTimer); const st = links.get(root);\n  if (st?.hover) { st.hover = null; relink(root); }\n  for (const n of root.querySelectorAll('.rx-mcg-target')) n.classList.remove('rx-mcg-target');\n});\nfunction editField(root, f) {\n  const el = root.querySelector(`.mc-setup [id$=\"mc-${f}\"]`); if (!el) return;\n  const disclosures = [];\n  for (let n = el.parentElement; n && n !== root; n = n.parentElement) if (n.tagName === 'DETAILS') disclosures.unshift(n);\n  for (const d of disclosures) d.open = true;\n  const shown = x => x && (x.checkVisibility ? x.checkVisibility() : !!x.offsetParent);\n  let target = el.matches('input, select, textarea, button') ? el : el.querySelector('[aria-checked=\"true\"], input, select, button') || el;\n  if (!shown(target) || target.getAttribute('aria-hidden') === 'true' || target.tabIndex < 0) target = el.parentElement?.querySelector('[role=\"radiogroup\"] [aria-checked=\"true\"]') || el.parentElement?.querySelector('[role=\"radiogroup\"] button') || target;\n"
  },
  {
    "before": "    root.querySelector('.rx-mcg')?.setAttribute('hidden', '');\n    root.querySelector('.rx-mcg-back')?.remove();\n    setView(root, 'range');\n    views.delete(root); seen.delete(root);\n    clearTimeout(timers.get(root));\n    queue = queue.filter(q => q.st.mountId !== st.mountId);\n    if (busy?.key.startsWith(st.mountId)) busy.controller.abort();\n",
    "after": "    root.querySelector('.rx-mcg')?.setAttribute('hidden', '');\n    root.querySelector('.rx-mcg-back')?.remove();\n    setView(root, 'range');\n    views.delete(root); seen.delete(root); links.delete(root);\n    clearTimeout(hoverTimer);\n    clearTimeout(timers.get(root));\n    queue = queue.filter(q => q.st.mountId !== st.mountId);\n    if (busy?.key.startsWith(st.mountId)) busy.controller.abort();\n"
  }
].map(Object.freeze)),
 'dist/skins/report.css':GEOMETRY_FILES['dist/skins/report.css'].repairs,
 'dist/simulation-view.js':Object.freeze([
  {
    "before": "simMessage(find('#mc-output'),'simulationManual.invalid');publish('settings',false);",
    "after": "simMessage(find('#mc-output').firstElementChild,'simulationManual.invalid');publish('settings',false);"
  }
].map(Object.freeze)),
});
export const latestUiSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const latestUiBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const productionPath=value=>typeof value==='string'&&value.startsWith('dist/')&&!/[\\\0\r\n]/.test(value)&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:64*1024*1024});
let cachedEntries;
function entries(){
 if(!cachedEntries){
  assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1','Exact latest UI Git blob format');
  assert.equal(git('rev-parse',LATEST_UI_BASE_COMMIT+'^{commit}').toString().trim(),LATEST_UI_BASE_COMMIT,'Exact immutable published V86 baseline');
  cachedEntries=new Map(git('ls-tree','-r','-z','--full-tree',LATEST_UI_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{
   const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);
   assert.ok(productionPath(path));assert.equal(type,'blob');assert.ok(['100644','100755'].includes(mode));assert.match(oid,/^[0-9a-f]{40}$/);
   return [path,Object.freeze({mode,oid})];
  }));
  assert.equal(cachedEntries.size,979,'All 979 published V86 production paths are pinned');
  for(const [path,item]of Object.entries(MODIFIED_FILES)){
   assert.ok(cachedEntries.has(path),'Only existing exact paths can be latest UI modifications');
   assert.equal(cachedEntries.get(path).oid,item.baseBlob,path+' independently pinned V86 source blob');
   assert.equal(cachedEntries.get(path).mode,item.mode,path+' immutable V86 mode');
   assert.notEqual(item.beforeSHA256,item.afterSHA256,path+' must be an exact modification');
  }
 }
 return cachedEntries;
}
export const latestUiBaseEntries=()=>new Map(entries());
const beforeBytes=new Map();
function original(path){
 if(!beforeBytes.has(path)){
  const item=MODIFIED_FILES[path];entries();
  const bytes=git('show',LATEST_UI_BASE_COMMIT+':'+path);
  assert.equal(latestUiBlobSHA(bytes),item.baseBlob,path+' exact immutable V86 blob');
  assert.equal(latestUiSHA(bytes),item.beforeSHA256,path+' exact immutable V86 SHA-256');
  beforeBytes.set(path,bytes);
 }
 // Never expose a mutable cached Buffer to a caller.
 return Buffer.from(beforeBytes.get(path));
}
function validateInput(path,bytes){
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');
 assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');
}
const EARLIER_GATES='; exact reviewed company period copy bytes; exact reviewed chart/trial geometry bytes; exact reviewed NFLX integration bytes; exact reviewed UBER integration bytes; exact reviewed MCD integration bytes; exact reviewed range header fix bytes; exact reviewed Claude simulation UI bytes';
export function latestUiUpstreamBytes(path,bytes,earlierContext=''){
 validateInput(path,bytes);assert.ok(own(LATEST_UI_FILES,path),path+' must be one of the seven exact latest UI paths');
 const item=LATEST_UI_FILES[path];
 assert.equal(latestUiSHA(bytes),item.afterSHA256,path+' exact reviewed latest user UI bytes'+EARLIER_GATES+'; '+path+' exact reviewed Claude simulation UI bytes'+earlierContext);
 let restored=bytes.toString('utf8');
 for(const repair of LATEST_UI_COMPATIBILITY[path]??[]){
  assert.equal(restored.split(repair.after).length-1,1,path+' exactly one reviewed compatibility replacement');
  restored=restored.replace(repair.after,repair.before);
 }
 const upstream=Buffer.from(restored,'utf8');
 assert.equal(latestUiSHA(upstream),item.sourceSHA256,path+' exact retrieved upstream SHA-256');
 assert.equal(latestUiBlobSHA(upstream),item.sourceBlob,path+' exact retrieved upstream Git blob');
 return upstream;
}
export function latestUiCompatibilityBaseBytes(path,bytes,earlierContext=''){
 validateInput(path,bytes);assert.ok(own(LATEST_UI_COMPATIBILITY_FILES,path),path+' must be an exact compatibility-only path');
 const item=LATEST_UI_COMPATIBILITY_FILES[path];
 assert.equal(latestUiSHA(bytes),item.afterSHA256,path+' exact reviewed latest user UI bytes'+EARLIER_GATES+'; '+path+' exact reviewed Claude simulation UI bytes'+earlierContext);
 let restored=bytes.toString('utf8');
 for(const repair of LATEST_UI_COMPATIBILITY[path]){
  assert.equal(restored.split(repair.after).length-1,1,path+' exactly one reviewed compatibility-only replacement');
  restored=restored.replace(repair.after,repair.before);
 }
 const out=Buffer.from(restored,'utf8');
 assert.equal(latestUiSHA(out),item.beforeSHA256,path+' exact V86 compatibility source SHA-256');
 assert.equal(latestUiBlobSHA(out),item.baseBlob,path+' exact V86 compatibility Git blob');
 assert.deepEqual(out,original(path),path+' one-line repair restores exact immutable V86 source');
 return out;
}
export function reverseLatestUserUi(path,bytes,earlierContext=''){
 bytes=reverseNativeGuideFix(path,bytes,earlierContext);
 validateInput(path,bytes);
 if(own(LATEST_UI_COMPATIBILITY_FILES,path))return latestUiCompatibilityBaseBytes(path,bytes,earlierContext);
 if(!own(LATEST_UI_FILES,path))return bytes;
 latestUiUpstreamBytes(path,bytes,earlierContext);
 return original(path);
}
