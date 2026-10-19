// Frozen UBER v2 annual FCFF and conditional June/October allocation port.
// All money is USD million except explicitly named EUR million; shares are actual units.
// Source ZIP SHA-256: d58a42336df8bcf034bb905b05116fc3884002c1b70e2ee6b1536ab239ca0acc.
// No acknowledgement/rationale UX gates. Unknown economic inputs never become zero.
export const UBER_SEGMENTS = Object.freeze(['mobility', 'delivery', 'freight']);
export const UBER_ANNUAL_ARRAY_FIELDS = Object.freeze([
  ...UBER_SEGMENTS.flatMap(s => [`${s}_growth`, `${s}_revenue_ratio`]),
  'ebit_bookings_margin', 'da_revenue_ratio', 'gross_reinvestment_revenue_ratio',
]);
export const UBER_ANNUAL_SCALAR_FIELDS = Object.freeze([
  'wacc', 'cash_tax_rate', 'incremental_noninsurance_nwc_revenue_ratio',
  'insurance_reserve_to_mobility_bookings', 'collateral_to_insurance_reserve',
]);
export const UBER_TERMINAL_FIELDS = Object.freeze([
  'terminal_growth', 'terminal_roic', 'wacc', 'cash_tax_rate', 'ebit_bookings_margin',
  'da_revenue_ratio', 'gross_reinvestment_revenue_ratio', 'incremental_noninsurance_nwc_revenue_ratio',
]);
export const UBER_CLAIMS = Object.freeze([
  'existing_option_value_reserve', 'debt_total_value', 'finance_lease_claim',
  'nonredeemable_nci_claim', 'redeemable_nci_claim', 'legacy_legal_regulatory_tax_claim',
  'income_other_tax_claim', 'additional_mixed_and_derivative_claim',
  'investment_and_vehicle_commitment_net_cost_reserve', 'additional_other_claim',
]);
export const UBER_JUNE_REQUIRED = Object.freeze([
  'common_shares', 'existing_earned_award_incremental_shares',
  'cash_operating_reserve', 'investment_asset_value', ...UBER_CLAIMS,
]);
export const UBER_CASH_RECON = Object.freeze([
  'sbc_cash_equivalent_reversal', 'operating_cash_tax_difference',
  'insurance_collateral_nwc_difference', 'reinvestment_timing_difference', 'other_operating_cash_difference',
]);
export const UBER_DEALS = Object.freeze(['getir', 'careem', 'blacklane']);
export const UBER_DEAL_FIELDS = Object.freeze([
  'operating_ev_added', 'cash_acquired', 'debt_value_added', 'nci_value_added', 'other_claim_value_added',
]);
export const UBER_CURRENT_CLAIMS = Object.freeze(UBER_CLAIMS.filter(k => k !== 'debt_total_value'));
export const UBER_ROLLFORWARD_NONNEG = Object.freeze([
  'eur_usd_at_issue', 'eur_usd_at_current_mark', 'euro_note_other_offering_expenses_eurm',
  'euro_note_current_price_fraction', 'euro_note_proceeds_retained_eurm',
  'actual_cash_interest_paid', 'other_debt_cash_proceeds', 'other_debt_value_added',
  'existing_debt_principal_cash_repaid', 'existing_debt_value_retired', 'buyback_cash',
  'careem_cash_paid', 'blacklane_cash_paid', 'getir_grocery_minority_investment_value',
  'legacy_claim_cash_settled', 'assumed_current_common_shares',
  'assumed_current_existing_award_incremental_shares', 'current_operating_cash_reserve',
  ...UBER_DEALS.flatMap(d => UBER_DEAL_FIELDS.map(k => `${d}_${k}`)),
]);
export const UBER_ROLLFORWARD_SIGNED = Object.freeze([
  'interim_economic_fcff', 'preexisting_debt_mark_change', 'investment_value_change_ex_careem_getir',
  'other_nonoperating_cash_flow', 'other_cash_fx_translation', 'realized_euro_proceeds_fx_adjustment',
  ...UBER_CASH_RECON,
]);
export const UBER_NOTE_FACTS = Object.freeze({
  principal_eurm: 4500, gross_proceeds_eurm: 4489.3075,
  original_issue_discount_eurm: 10.6925, underwriting_discounts_eurm: 24.875,
  issuer_proceeds_before_other_expenses_eurm: 4489.3075 - 24.875,
});
const JUNE = '2026-06-30';
const OCTOBER = '2026-10-19';
const JUNE_CASH = 5391;
const GETIR_CASH = 465;
// Python 3.12 sum() uses compensated float summation. Keep the same small-sum
// accuracy for segment totals, explicit PVs and cash/claim ledgers.
const sum = xs => {
  let total = 0, correction = 0;
  for (const value of xs) {
    const next = total + value;
    correction += Math.abs(total) >= Math.abs(value) ? (total - next) + value : (value - next) + total;
    total = next;
  }
  return correction && Number.isFinite(correction) ? total + correction : total;
};
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const fail = message => { throw new Error(`UBER: ${message}`); };
export const uberFinite = x => typeof x === 'number' && Number.isFinite(x);
export function uberNumber(value, name, lo = -Infinity, hi = Infinity) {
  if (!uberFinite(value)) fail(`${name}: finite number required`);
  if (value < lo) fail(`${name}: below ${lo}`);
  if (value > hi) fail(`${name}: above ${hi}`);
  return value;
}
export function uberFiniteTree(value, path = 'result') {
  if (typeof value === 'number') uberNumber(value, path);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) uberFiniteTree(v, `${path}.${k}`);
  }
  return value;
}
function validateRate(key, value, name = key) {
  const bounds = {
    wacc: [.01, .5], terminal_growth: [0, .08], terminal_roic: [.01, 1],
    cash_tax_rate: [.15, .5], incremental_noninsurance_nwc_revenue_ratio: [0, 1],
    insurance_reserve_to_mobility_bookings: [.01, .5], collateral_to_insurance_reserve: [.8, 1.5],
  };
  if (key in bounds) uberNumber(value, name, ...bounds[key]);
  else uberNumber(value, name, key.endsWith('growth') ? -.8 : 0, key.endsWith('revenue_ratio') ? 1.5 : .8);
}
export function validateUberCase(c, name = 'scenario') {
  if (!isObject(c)) fail(`${name}: scenario object required`);
  for (const key of [...UBER_ANNUAL_SCALAR_FIELDS, 'terminal_growth', 'terminal_roic']) {
    validateRate(key, c[key], `${name}.${key}`);
  }
  if (c.wacc <= c.terminal_growth) fail('WACC must exceed g');
  if (c.terminal_roic <= c.terminal_growth) fail('Terminal ROIC must exceed growth');
  for (const field of UBER_ANNUAL_ARRAY_FIELDS) {
    const values = c[field];
    if (!Array.isArray(values) || values.length !== 10) fail(`${field}: ten annual inputs required`);
    for (let i = 0; i < 10; i++) validateRate(field, values[i], `${name}.${field}.${i}`);
  }
  return c;
}
export function validateUberInputs(inputs) {
  if (!isObject(inputs) || inputs.valuation_anchor !== JUNE || inputs.forecast_periods !== 10) {
    fail('This engine requires frozen June anchor and ten full annual buckets');
  }
  if (!isObject(inputs.anchors) || !isObject(inputs.cases)) fail('Anchors and cases are required');
  for (const [key, value] of Object.entries(inputs.anchors)) uberNumber(value, `anchor.${key}`, 0);
  for (const key of [
    ...UBER_SEGMENTS.map(s => `${s}_bookings`), 'revenue', 'insurance_reserves',
    'restricted_pool_proxy', 'unrestricted_cash_and_short_investments',
  ]) uberNumber(inputs.anchors[key], `anchor.${key}`, 0);
  if (inputs.anchors.unrestricted_cash_and_short_investments !== JUNE_CASH) {
    fail('June unrestricted liquidity is a frozen reported anchor, not an editable scenario input');
  }
  for (const [name, c] of Object.entries(inputs.cases)) validateUberCase(c, name);
  return inputs;
}
function checkedOverride(override, fields, label) {
  if (!isObject(override)) fail(`${label}: input object required`);
  for (const key of Object.keys(override)) {
    if (!fields.includes(key)) fail(`${label}: unsupported field ${key}`);
    validateRate(key, override[key], `${label}.${key}`);
  }
}
/** Ten partial annual input rows. Omitted fields inherit the selected scenario.
 * WACC is an annual rate; varying rates use cumulative discount factors.
 * terminalOverride changes capitalization inputs, never the June-to-October accrual rate.
 */
export function resolveUberAnnualInputs(c, annualOverride = null, terminalOverride = null) {
  validateUberCase(c);
  if (annualOverride !== null && (!Array.isArray(annualOverride) || annualOverride.length !== 10)) {
    fail('annualOverride: ten annual input rows required');
  }
  const fields = [...UBER_ANNUAL_ARRAY_FIELDS, ...UBER_ANNUAL_SCALAR_FIELDS];
  const annual = Array.from({ length: 10 }, (_, i) => {
    const row = Object.fromEntries(fields.map(k => [k, UBER_ANNUAL_ARRAY_FIELDS.includes(k) ? c[k][i] : c[k]]));
    if (annualOverride !== null) {
      checkedOverride(annualOverride[i], fields, `annualOverride.${i}`);
      Object.assign(row, annualOverride[i]);
    }
    return row;
  });
  const terminal = Object.fromEntries(UBER_TERMINAL_FIELDS.map(k => [k,
    k === 'terminal_growth' || k === 'terminal_roic' || k === 'wacc' ? c[k] : annual[9][k],
  ]));
  if (terminalOverride !== null) {
    checkedOverride(terminalOverride, UBER_TERMINAL_FIELDS, 'terminalOverride');
    Object.assign(terminal, terminalOverride);
  }
  if (terminal.wacc <= terminal.terminal_growth) fail('Terminal WACC must exceed g');
  if (terminal.terminal_roic <= terminal.terminal_growth) fail('Terminal ROIC must exceed growth');
  return { annual, terminal };
}
export function allocateUberJune(result, policy = null) {
  const p = policy ?? { valuation_anchor: JUNE };
  if (!isObject(p) || p.valuation_anchor !== JUNE) fail('June allocation requires June policy');
  const missing = UBER_JUNE_REQUIRED.filter(k => p[k] == null);
  if (missing.length) return {
    status: 'incomplete_policy', missing, conditional_june_allocation_per_share: null,
    current_target_price: null, current_verified_equity_ready: false,
  };
  for (const k of UBER_JUNE_REQUIRED) uberNumber(p[k], k, k === 'common_shares' ? 1 : 0);
  if (p.cash_operating_reserve > JUNE_CASH) fail('Operating reserve cannot exceed available June cash; model separate funding if greater');
  if (!Number.isSafeInteger(p.common_shares)) fail('Whole safely representable share count required');
  const claims = Object.fromEntries(UBER_CLAIMS.map(k => [k, p[k]]));
  const totalClaims = sum(Object.values(claims));
  const equity = result.operating_enterprise_value + JUNE_CASH - p.cash_operating_reserve + p.investment_asset_value - totalClaims;
  const units = p.common_shares + p.existing_earned_award_incremental_shares;
  const ok = equity > 0 && result.terminal.fcff > 0;
  return uberFiniteTree({
    status: ok ? 'conditional_illustrative_allocation' : 'suppressed_nonpositive_economics',
    valuation_anchor: JUNE, policy_name: p.policy_name ?? null, assumption_basis: p.assumption_basis ?? null,
    operating_enterprise_value: result.operating_enterprise_value,
    unrestricted_liquidity: JUNE_CASH, operating_cash_reserved: p.cash_operating_reserve,
    investment_asset_value: p.investment_asset_value,
    included_careem_investment_value: p.included_careem_investment_value ?? null,
    claim_deductions: claims, total_claim_deductions: totalClaims,
    conditional_common_equity_value: equity, assumed_share_denominator: units,
    share_precision_note: 'June observed shares rounded to thousand; outstanding awards/claims are chosen assumptions, not diluted EPS weighted-average shares',
    conditional_june_allocation_per_share: ok ? equity * 1e6 / units : null,
    terminal_pv_fraction_of_ev: result.terminal_pv_fraction_of_ev,
    current_target_price: null, current_verified_equity_ready: false,
  });
}
export function evaluateUber(inputs, scenario, policy = null, annualOverride = null, terminalOverride = null) {
  validateUberInputs(inputs);
  const c = typeof scenario === 'string' ? inputs.cases[scenario] : scenario;
  if (!c) fail(`Unknown scenario ${scenario}`);
  const resolved = resolveUberAnnualInputs(c, annualOverride, terminalOverride);
  const a = inputs.anchors;
  let prev = Object.fromEntries(UBER_SEGMENTS.map(s => [s, a[`${s}_bookings`]]));
  let prevRev = a.revenue, prevRes = a.insurance_reserves, prevCol = a.restricted_pool_proxy;
  let cumulativeDiscount = 1;
  // Use the source power convention for a constant annual rate, including the frozen replay.
  const constantAnnualWacc = resolved.annual.every(r => r.wacc === resolved.annual[0].wacc);
  const rows = resolved.annual.map((p, i) => {
    const bookings = Object.fromEntries(UBER_SEGMENTS.map(s => [s, prev[s] * (1 + p[`${s}_growth`])]));
    const revenues = Object.fromEntries(UBER_SEGMENTS.map(s => [s, bookings[s] * p[`${s}_revenue_ratio`]]));
    const gb = sum(Object.values(bookings)), rev = sum(Object.values(revenues));
    const ebit = gb * p.ebit_bookings_margin, tax = Math.max(ebit, 0) * p.cash_tax_rate, nopat = ebit - tax;
    const da = rev * p.da_revenue_ratio, capex = rev * p.gross_reinvestment_revenue_ratio;
    const nwc = (rev - prevRev) * p.incremental_noninsurance_nwc_revenue_ratio;
    const res = bookings.mobility * p.insurance_reserve_to_mobility_bookings;
    const col = res * p.collateral_to_insurance_reserve, dr = res - prevRes, dc = col - prevCol;
    const netReinvestment = capex - da + nwc + dc - dr, fcff = nopat - netReinvestment;
    cumulativeDiscount *= 1 + p.wacc;
    const discount = constantAnnualWacc ? (1 + p.wacc) ** (i + 1) : cumulativeDiscount;
    const row = {
      year_index: i + 1, period_start: `${2026 + i}-07-01`, period_end: `${2027 + i}-06-30`,
      ...Object.fromEntries(UBER_SEGMENTS.map(s => [`${s}_bookings`, bookings[s]])),
      ...Object.fromEntries(UBER_SEGMENTS.map(s => [`${s}_revenue`, revenues[s]])),
      gross_bookings: gb, revenue: rev, gaap_ebit_after_sbc: ebit, cash_operating_tax: tax, nopat,
      operating_da_addback: da, gross_operating_asset_reinvestment: capex,
      delta_noninsurance_nwc: nwc, insurance_reserve_end: res, required_restricted_pool_end: col,
      delta_insurance_reserve: dr, delta_restricted_pool: dc, net_reinvestment: netReinvestment,
      fcff, discount_exponent_years: i + 1, discount_factor: 1 / discount, pv_fcff: fcff / discount,
      ebit_revenue_margin: ebit / rev, ebit_bookings_margin: ebit / gb, wacc: p.wacc,
    };
    prev = bookings; prevRev = rev; prevRes = res; prevCol = col;
    return row;
  });
  const last = rows[9], t = resolved.terminal, g = t.terminal_growth;
  const rev = last.revenue * (1 + g), gb = last.gross_bookings * (1 + g);
  const ebit = gb * t.ebit_bookings_margin, tax = Math.max(ebit, 0) * t.cash_tax_rate, nopat = ebit - tax;
  const da = rev * t.da_revenue_ratio, capex = rev * t.gross_reinvestment_revenue_ratio;
  const nwc = (rev - last.revenue) * t.incremental_noninsurance_nwc_revenue_ratio;
  const dr = last.insurance_reserve_end * g, dc = last.required_restricted_pool_end * g;
  const ordinary = capex - da + nwc + dc - dr, floor = nopat * g / t.terminal_roic;
  const net = Math.max(ordinary, floor), topup = net - ordinary, fcff = nopat - net;
  const terminalDiscount = constantAnnualWacc ? (1 + resolved.annual[0].wacc) ** 10 : cumulativeDiscount;
  const tv = fcff / (t.wacc - g), pv = tv / terminalDiscount;
  const explicit = sum(rows.map(r => r.pv_fcff)), ev = explicit + pv;
  const result = {
    valuation_anchor: inputs.valuation_anchor, information_cutoff: inputs.information_cutoff,
    unit: 'USD million', annual_forecast: rows,
    terminal: {
      period_start: '2036-07-01', period_end: '2037-06-30', revenue: rev, gross_bookings: gb,
      gaap_ebit_after_sbc: ebit, cash_operating_tax: tax, nopat, operating_da_addback: da,
      gross_operating_asset_reinvestment: capex, delta_noninsurance_nwc: nwc,
      delta_insurance_reserve: dr, delta_restricted_pool: dc, ordinary_net_reinvestment: ordinary,
      roic_growth_reinvestment_floor: floor, additional_reinvestment_topup: topup,
      net_reinvestment: net, fcff, terminal_value_at_2036_06_30: tv, pv_terminal_value: pv,
      wacc: t.wacc, terminal_roic: t.terminal_roic,
    },
    explicit_pv_fcff: explicit, operating_enterprise_value: ev,
    terminal_pv_fraction_of_ev: ev ? pv / ev : null, terminal_g: g,
    wacc: c.wacc, annual_wacc: resolved.annual.map(r => r.wacc), terminal_wacc: t.wacc,
    resolved_annual_inputs: resolved.annual, resolved_terminal_inputs: resolved.terminal,
    current_target_price: null, current_verified_equity_ready: false, cash_funding_certification: false,
    cash_funding_note: 'FCFF is not cash available after contractual debt repayment, investment/acquisition commitments or claim settlements. Equity allocation is a valuation, not financing adequacy certification.',
  };
  uberFiniteTree(result);
  result.allocation = allocateUberJune(result, policy);
  return result;
}
const ROLLFORWARD_WARNINGS = Object.freeze([
  'Euro principal 4500; sourced gross proceeds4489.3075 and underwriting discounts24.875; issuer proceeds4464.4325 before other expenses. Neither known discount can be waived.',
  'Retained EUR cash and debt are both translated at current FX; any converted/spent proceeds require explicit disposition and realized FX reconciliation. Debt price fraction must include all current claim value, including any accrued interest.',
  'Economic FCFF rolls EV; actual cash is reconciled separately. Nonoperating cash receipts do not reduce operating EV. Match equity issuance proceeds/SBC reversal with the share and award rollforward.',
  'Getir cash465 covers food control plus minority grocery stake; value these separately, and do not assume consideration equals operating EV.',
  'Careem removal uses the value actually included in June policy, not automatically reported book147.',
  'Current inherited debt marks and every lease/NCI/other claim are chosen or unchanged assumptions, never silently refreshed facts. Per-deal NCI and other acquired claims must exclude amounts already entered in inherited claims.',
  'Existing June2bn term loan matures December2026; repayment/refinancing and future liquidity need separate assessment. It remains within June debt, not another claim.',
  'No Delivery Hero or ezCater consolidation/payment is inferred from pending offers. Commitments are not automatically drawn.',
  'Cash availability test is aggregate, not daily liquidity, local cash fungibility or future funding certification.',
]);
/** Source facts are fixed by the reviewed package, not editable rollforward choices. */
export function validateUberEvents(events) {
  if (events == null) return;
  if (!isObject(events) || events.information_cutoff !== OCTOBER || events.snapshot_date !== JUNE || !Array.isArray(events.events)) {
    fail('Frozen June-to-October capital-event package required');
  }
  const notes = events.events.find(e => e.event_date === '2026-09-15');
  const getir = events.events.find(e => e.event_date === '2026-07-01');
  if (!notes || !getir || getir.cash_outflow_usdm_approx !== GETIR_CASH) fail('Frozen Getir cash consideration must remain 465');
  for (const [key, value] of Object.entries(UBER_NOTE_FACTS)) {
    if (notes[key] !== value) fail(`Frozen euro-note fact changed: ${key}`);
  }
}
export function evaluateUberRollforward(juneOutput, junePolicy, rollforwardPolicy, events = null, inputs = null) {
  if (inputs !== null) validateUberInputs(inputs);
  validateUberEvents(events);
  const p = rollforwardPolicy ?? { as_of: OCTOBER };
  if (!isObject(p) || p.as_of !== OCTOBER) fail('Frozen bridge ends October19; use a new version for a later cutoff');
  const required = [...UBER_ROLLFORWARD_NONNEG, ...UBER_ROLLFORWARD_SIGNED];
  const missing = required.filter(k => p[k] == null);
  const current = p.current_inherited_nondebt_claims;
  if (!isObject(current)) missing.push('current_inherited_nondebt_claims');
  else {
    const extras = Object.keys(current).filter(k => !UBER_CURRENT_CLAIMS.includes(k));
    if (extras.length) fail(`Unrecognized inherited claim keys: ${extras.sort().join(',')}`);
    missing.push(...UBER_CURRENT_CLAIMS.filter(k => current[k] == null).map(k => `current_inherited_nondebt_claims.${k}`));
  }
  if (missing.length) return {
    status: 'incomplete_rollforward', as_of: OCTOBER, missing,
    conditional_october_allocation_per_share: null, verified_current_target: null,
    current_target_price: null, current_verified_equity_ready: false, cash_funding_certification: false,
  };
  for (const k of UBER_ROLLFORWARD_NONNEG) uberNumber(p[k], k, 0);
  for (const k of UBER_ROLLFORWARD_SIGNED) uberNumber(p[k], k);
  for (const k of UBER_CURRENT_CLAIMS) uberNumber(current[k], `current_inherited_nondebt_claims.${k}`, 0);
  if (!isObject(juneOutput) || juneOutput.valuation_anchor !== JUNE) fail('Frozen June operating output required');
  uberNumber(juneOutput.operating_enterprise_value, 'June operating EV');
  uberNumber(juneOutput.wacc, 'June WACC', .01, .5);
  const a = junePolicy == null ? juneOutput.allocation : allocateUberJune(juneOutput, junePolicy);
  if (!isObject(a) || a.conditional_june_allocation_per_share == null) fail('Complete June allocation policy first');
  const careemRemoved = a.included_careem_investment_value;
  uberNumber(careemRemoved, 'June policy included Careem value', 0, a.investment_asset_value);
  if (p.assumed_current_common_shares <= 0 || !Number.isSafeInteger(p.assumed_current_common_shares)) fail('Current common shares must be a positive safely representable integer');
  if (!Number.isSafeInteger(p.assumed_current_existing_award_incremental_shares)) fail('Existing award units must be a safely representable integer');
  if (!(p.euro_note_current_price_fraction > 0 && p.euro_note_current_price_fraction <= 2)) fail('Debt value fraction of principal must be positive');
  if (!(p.eur_usd_at_issue > .2 && p.eur_usd_at_issue < 5 && p.eur_usd_at_current_mark > .2 && p.eur_usd_at_current_mark < 5)) fail('Explicit plausible FX required');
  const nf = UBER_NOTE_FACTS;
  if (p.euro_note_other_offering_expenses_eurm >= nf.issuer_proceeds_before_other_expenses_eurm) fail('Other expenses cannot consume issuer proceeds after known underwriting discounts');
  const netEur = nf.issuer_proceeds_before_other_expenses_eurm - p.euro_note_other_offering_expenses_eurm;
  if (p.euro_note_proceeds_retained_eurm > netEur) fail('Retained euro note cash cannot exceed net proceeds; other EUR cash belongs in other FX reconciliation');
  const duration = (Date.UTC(2026, 9, 19) - Date.UTC(2026, 5, 30)) / 86400000 / 365.25;
  const acquiredEv = sum(UBER_DEALS.map(d => p[`${d}_operating_ev_added`]));
  const rolledEv = juneOutput.operating_enterprise_value * (1 + juneOutput.wacc) ** duration
    - p.interim_economic_fcff * (1 + juneOutput.wacc) ** (duration / 2) + acquiredEv;
  const cashReconciliation = Object.fromEntries(UBER_CASH_RECON.map(k => [k, p[k]]));
  const actualOperatingCash = p.interim_economic_fcff + sum(Object.values(cashReconciliation));
  const proceedsIssueUsd = netEur * p.eur_usd_at_issue;
  const noteCashFx = p.euro_note_proceeds_retained_eurm * (p.eur_usd_at_current_mark - p.eur_usd_at_issue);
  const newDebtValue = nf.principal_eurm * p.eur_usd_at_current_mark * p.euro_note_current_price_fraction;
  const dealCashPaid = GETIR_CASH + p.careem_cash_paid + p.blacklane_cash_paid;
  const dealCashAcquired = sum(UBER_DEALS.map(d => p[`${d}_cash_acquired`]));
  const cashComponents = {
    june_unrestricted_liquidity: JUNE_CASH,
    actual_operating_cash_after_reinvestment_before_interest: actualOperatingCash,
    actual_cash_interest_paid: -p.actual_cash_interest_paid,
    new_notes_net_proceeds_at_issue_fx: proceedsIssueUsd,
    retained_new_note_cash_fx_translation: noteCashFx,
    realized_euro_proceeds_fx_adjustment: p.realized_euro_proceeds_fx_adjustment,
    other_cash_fx_translation: p.other_cash_fx_translation, other_debt_cash_proceeds: p.other_debt_cash_proceeds,
    existing_debt_cash_repayments: -p.existing_debt_principal_cash_repaid,
    buybacks: -p.buyback_cash, closed_deal_consideration: -dealCashPaid,
    closed_deal_cash_acquired: dealCashAcquired, legacy_claim_cash_settled: -p.legacy_claim_cash_settled,
    other_nonoperating_cash_flow: p.other_nonoperating_cash_flow,
  };
  const cash = sum(Object.values(cashComponents));
  const legacyInvestment = a.investment_asset_value - careemRemoved + p.investment_value_change_ex_careem_getir;
  const legacyDebt = a.claim_deductions.debt_total_value + p.preexisting_debt_mark_change - p.existing_debt_value_retired;
  if (legacyInvestment < 0 || legacyDebt < 0) fail('Residual legacy investment/debt cannot be negative before adding new assets/debt');
  const invest = legacyInvestment + p.getir_grocery_minority_investment_value;
  const debt = legacyDebt + newDebtValue + p.other_debt_value_added + sum(UBER_DEALS.map(d => p[`${d}_debt_value_added`]));
  const other = sum(UBER_CURRENT_CLAIMS.map(k => current[k])) + sum(UBER_DEALS.map(d => p[`${d}_nci_value_added`] + p[`${d}_other_claim_value_added`]));
  if (invest < 0 || debt < 0) fail('Negative investment or debt value needs a separate model/classification');
  if (cash >= 0 && p.euro_note_proceeds_retained_eurm * p.eur_usd_at_current_mark > cash + 1e-7) fail('Assumed retained EUR note cash exceeds total ending cash: reconcile currency disposition/outflows');
  const equity = rolledEv + cash - p.current_operating_cash_reserve + invest - debt - other;
  const denom = p.assumed_current_common_shares + p.assumed_current_existing_award_incremental_shares;
  const funded = cash >= p.current_operating_cash_reserve;
  const deals = Object.fromEntries(UBER_DEALS.map(d => [d, {
    cash_consideration: d === 'getir' ? GETIR_CASH : p[`${d}_cash_paid`],
    ...Object.fromEntries(UBER_DEAL_FIELDS.map(k => [k, p[`${d}_${k}`]])),
    minority_investment_added: d === 'getir' ? p.getir_grocery_minority_investment_value : 0,
    prior_investment_removed: d === 'careem' ? careemRemoved : 0, assumption_basis: p[`${d}_basis`] ?? null,
  }]));
  return uberFiniteTree({
    status: funded && equity > 0 ? 'conditional_rollforward' : 'suppressed_cash_or_equity_shortfall',
    as_of: OCTOBER, information_cutoff: OCTOBER, duration_years: duration,
    assumption_basis: p.assumption_basis ?? null, resolved_assumptions: structuredClone(p),
    rolled_operating_ev: rolledEv, interim_economic_fcff: p.interim_economic_fcff,
    economic_to_actual_operating_cash_reconciliation: cashReconciliation,
    actual_operating_cash_after_reinvestment_before_interest: actualOperatingCash,
    new_euro_notes_principal_eurm: nf.principal_eurm,
    new_euro_notes_gross_proceeds_eurm: nf.gross_proceeds_eurm,
    new_euro_notes_known_original_issue_discount_eurm: nf.original_issue_discount_eurm,
    new_euro_notes_known_underwriting_discounts_eurm: nf.underwriting_discounts_eurm,
    new_euro_notes_issuer_proceeds_before_other_expenses_eurm: nf.issuer_proceeds_before_other_expenses_eurm,
    new_euro_notes_net_proceeds_eurm_assumed: netEur,
    new_euro_notes_cash_proceeds_usdm_at_issue: proceedsIssueUsd,
    new_euro_notes_retained_cash_fx_adjustment_usdm: noteCashFx,
    new_euro_notes_debt_value_usdm: newDebtValue, cash_rollforward_components: cashComponents,
    ending_unrestricted_liquidity_assumed: cash, named_closed_deals: deals,
    residual_legacy_investment_value: legacyInvestment, investment_value_assumed: invest,
    residual_legacy_debt_value: legacyDebt, debt_value_assumed: debt,
    current_inherited_nondebt_claims: { ...current },
    inherited_nondebt_claim_change: Object.fromEntries(UBER_CURRENT_CLAIMS.map(k => [k, current[k] - a.claim_deductions[k]])),
    nondebt_claim_value_assumed: other, conditional_common_equity_value: equity,
    assumed_common_plus_existing_award_shares: denom,
    conditional_october_allocation_per_share: funded && equity > 0 ? equity * 1e6 / denom : null,
    verified_current_target: null, current_target_price: null, current_verified_equity_ready: false,
    cash_funding_certification: false, warnings: [...ROLLFORWARD_WARNINGS],
  });
}
