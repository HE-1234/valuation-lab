import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluateUber, evaluateUberRollforward, validateUberInputs, validateUberEvents,
  resolveUberAnnualInputs, UBER_ANNUAL_ARRAY_FIELDS, UBER_ANNUAL_SCALAR_FIELDS,
  UBER_CLAIMS, UBER_JUNE_REQUIRED, UBER_CURRENT_CLAIMS, UBER_CASH_RECON,
  UBER_ROLLFORWARD_NONNEG, UBER_ROLLFORWARD_SIGNED, UBER_NOTE_FACTS,
} from '../dist/uber-financial-engine.js';

const root = new URL('../dist/data/incremental-UBER-2026-10-19-v2/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const inputs = read('dcf-inputs-v2.json');
const emptyJune = read('equity-policy-template-v2.json');
const illustration = read('equity-policy-illustration-v2.json');
const emptyOctober = read('post-june-rollforward-template-v2.json');
const events = read('post-june-capital-events-v2.json');
const golden = read('dcf-output-v2.json');
const illustratedGolden = read('illustration-output-v2.json');
const clone = x => structuredClone(x);
const near = (actual, expected, label = '') => assert.ok(
  Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= Math.max(1e-8, Math.abs(expected) * 1e-12),
  `${label}: ${actual} !== ${expected}`,
);
function sourceSubset(actual, expected, path = '', exactNumbers = false) {
  if (typeof expected === 'number') {
    if (exactNumbers) assert.equal(actual, expected, path);
    else near(actual, expected, path);
  }
  else if (expected === null || typeof expected !== 'object') assert.equal(actual, expected, path);
  else for (const [key, value] of Object.entries(expected)) sourceSubset(actual[key], value, `${path}.${key}`, exactNumbers);
}
const blankAnnual = () => Array.from({ length: 10 }, () => ({}));
// Synthetic arithmetic fixtures ONLY; these zero choices are not economic estimates.
function synthetic() {
  return {
    ...clone(emptyOctober),
    ...Object.fromEntries([...UBER_ROLLFORWARD_NONNEG, ...UBER_ROLLFORWARD_SIGNED].map(k => [k, 0])),
    eur_usd_at_issue: 1.1, eur_usd_at_current_mark: 1.1, euro_note_current_price_fraction: 1,
    getir_operating_ev_added: 400, getir_grocery_minority_investment_value: 65,
    careem_operating_ev_added: illustration.included_careem_investment_value,
    assumed_current_common_shares: illustration.common_shares,
    assumed_current_existing_award_incremental_shares: illustration.existing_earned_award_incremental_shares,
    current_operating_cash_reserve: illustration.cash_operating_reserve,
    current_inherited_nondebt_claims: Object.fromEntries(UBER_CURRENT_CLAIMS.map(k => [k, illustration[k]])),
  };
}
const june = evaluateUber(inputs, 'base', illustration);
const bridge = p => evaluateUberRollforward(june, illustration, p, events, inputs);

for (const name of ['bear', 'base', 'bull']) {
  test(`UBER ${name}: every frozen annual/terminal value and June allocation replay`, () => {
    const result = evaluateUber(inputs, name, illustration);
    sourceSubset(result, illustratedGolden.cases[name], name, true);
    assert.equal(result.operating_enterprise_value, illustratedGolden.cases[name].operating_enterprise_value);
    assert.equal(result.current_target_price, null);
    assert.equal(result.allocation.current_target_price, null);
    assert.equal(result.current_verified_equity_ready, false);
    assert.equal(result.cash_funding_certification, false);
    const fallback = evaluateUber(inputs, name, emptyJune);
    const { allocation, ...sourceOperating } = golden.cases[name];
    sourceSubset(fallback, sourceOperating, name, true);
    assert.equal(fallback.allocation.status, 'incomplete_policy');
    assert.equal(fallback.allocation.conditional_june_allocation_per_share, null);
    assert.deepEqual(fallback.allocation.missing, allocation.missing.filter(k => !['assumption_basis', 'acknowledge_no_overlap_and_scope'].includes(k)));
    for (const row of result.annual_forecast) {
      near(row.fcff, row.nopat + row.operating_da_addback - row.gross_operating_asset_reinvestment
        - row.delta_noninsurance_nwc + row.delta_insurance_reserve - row.delta_restricted_pool);
      near(row.revenue, row.mobility_revenue + row.delivery_revenue + row.freight_revenue);
      near(row.pv_fcff, row.fcff * row.discount_factor);
    }
    near(result.operating_enterprise_value, result.explicit_pv_fcff + result.terminal.pv_terminal_value);
    assert.ok(result.terminal.net_reinvestment >= result.terminal.roic_growth_reinvestment_floor);
  });
}
test('UBER baseline catch-up, immutable caller inputs, no default per-share output', () => {
  const original = JSON.stringify([inputs, illustration, emptyOctober, events]);
  const result = evaluateUber(inputs, 'base');
  const first = result.annual_forecast[0];
  near(first.delta_restricted_pool - first.delta_insurance_reserve, 1493);
  assert.equal(result.allocation.conditional_june_allocation_per_share, null);
  assert.equal(evaluateUberRollforward(june, illustration, null).conditional_october_allocation_per_share, null);
  const missing = bridge(emptyOctober);
  assert.equal(missing.status, 'incomplete_rollforward');
  assert.ok(missing.missing.includes('careem_cash_paid'));
  assert.ok(missing.missing.includes('current_inherited_nondebt_claims.finance_lease_claim'));
  assert.ok(!missing.missing.some(k => /acknowledge|basis/.test(k)));
  assert.equal(JSON.stringify([inputs, illustration, emptyOctober, events]), original);
});
test('UBER June allocation has numeric completeness but no acknowledgement or rationale gate', () => {
  const p = clone(illustration);
  delete p.assumption_basis;
  p.use_reported_june_shares_rounded_to_thousand = false;
  p.acknowledge_no_overlap_and_scope = false;
  const result = evaluateUber(inputs, 'base', p);
  near(result.allocation.conditional_june_allocation_per_share, june.allocation.conditional_june_allocation_per_share);
  for (const key of UBER_JUNE_REQUIRED) {
    const partial = { ...p, [key]: null };
    const allocation = evaluateUber(inputs, 'base', partial).allocation;
    assert.equal(allocation.conditional_june_allocation_per_share, null, key);
    assert.deepEqual(allocation.missing, [key]);
  }
});
test('UBER frozen scope, arrays, numeric types and finite arithmetic reject invalid inputs', () => {
  const mutations = [
    x => x.valuation_anchor = '2026-10-19', x => x.forecast_periods = 9,
    x => x.anchors.unrestricted_cash_and_short_investments = 6391,
    x => delete x.anchors.mobility_bookings, x => x.anchors.revenue = true,
    x => x.cases.base.wacc = .025, x => x.cases.base.terminal_roic = .02,
    x => x.cases.base.cash_tax_rate = 0, x => x.cases.base.collateral_to_insurance_reserve = 0,
    x => x.cases.base.incremental_noninsurance_nwc_revenue_ratio = null,
    x => x.cases.base.mobility_growth = Array(9).fill(.1),
    x => x.cases.base.mobility_growth = Array(11).fill(.1),
    x => x.cases.base.mobility_growth = Array(10).fill(-1),
    x => x.anchors.mobility_bookings = Number.MAX_VALUE,
  ];
  for (const value of [true, NaN, Infinity, -Infinity, null, undefined, '0.1']) {
    mutations.push(x => x.cases.base.wacc = value);
    mutations.push(x => x.cases.base.mobility_growth[3] = value);
  }
  for (const mutate of mutations) {
    const x = clone(inputs); mutate(x);
    assert.throws(() => evaluateUber(x, 'base'), /UBER/);
  }
  assert.throws(() => evaluateUber(inputs, 'unknown'), /Unknown scenario/);
  for (const [key, value] of [
    ['debt_total_value', NaN], ['cash_operating_reserve', 6000], ['common_shares', 0],
    ['common_shares', 1.5], ['common_shares', Number.MAX_SAFE_INTEGER + 1],
    ['existing_earned_award_incremental_shares', -1], ['finance_lease_claim', true],
  ]) assert.throws(() => evaluateUber(inputs, 'base', { ...illustration, [key]: value }), /UBER/);
  assert.throws(() => evaluateUber(inputs, 'base', { ...illustration, valuation_anchor: '2026-10-19' }), /June policy/);
});
test('UBER allocation suppresses nonpositive terminal/common economics', () => {
  const hugeClaims = evaluateUber(inputs, 'base', { ...illustration, additional_other_claim: 1e9 });
  assert.equal(hugeClaims.allocation.status, 'suppressed_nonpositive_economics');
  assert.equal(hugeClaims.allocation.conditional_june_allocation_per_share, null);
  const depleted = evaluateUber(inputs, 'base', illustration, null, { gross_reinvestment_revenue_ratio: 1.5 });
  assert.ok(depleted.terminal.fcff < 0);
  assert.equal(depleted.allocation.conditional_june_allocation_per_share, null);
});
test('UBER annual path resolves each source rate and WACC, with no hidden ignored controls', () => {
  const annual = blankAnnual();
  const resolved = resolveUberAnnualInputs(inputs.cases.base).annual;
  for (let i = 0; i < 10; i++) {
    const row = annual[i];
    row.wacc = .07 + i * .004;
    row.mobility_growth = resolved[i].mobility_growth + .005;
    row.delivery_growth = resolved[i].delivery_growth - .003;
    row.freight_growth = .03;
    row.mobility_revenue_ratio = .24;
    row.delivery_revenue_ratio = .21;
    row.freight_revenue_ratio = 1;
    row.ebit_bookings_margin = .04 + i * .001;
    row.da_revenue_ratio = .012;
    row.gross_reinvestment_revenue_ratio = .018;
    row.cash_tax_rate = .24;
    row.incremental_noninsurance_nwc_revenue_ratio = .025;
    row.insurance_reserve_to_mobility_bookings = .13;
    row.collateral_to_insurance_reserve = 1.05;
  }
  const result = evaluateUber(inputs, 'base', illustration, annual);
  let discount = 1, mobility = inputs.anchors.mobility_bookings;
  for (let i = 0; i < 10; i++) {
    const p = annual[i], r = result.annual_forecast[i];
    discount *= 1 + p.wacc; mobility *= 1 + p.mobility_growth;
    near(r.mobility_bookings, mobility);
    near(r.mobility_revenue, mobility * p.mobility_revenue_ratio);
    near(r.gaap_ebit_after_sbc, r.gross_bookings * p.ebit_bookings_margin);
    near(r.cash_operating_tax, r.gaap_ebit_after_sbc * p.cash_tax_rate);
    near(r.operating_da_addback, r.revenue * p.da_revenue_ratio);
    near(r.gross_operating_asset_reinvestment, r.revenue * p.gross_reinvestment_revenue_ratio);
    near(r.insurance_reserve_end, mobility * p.insurance_reserve_to_mobility_bookings);
    near(r.required_restricted_pool_end, r.insurance_reserve_end * p.collateral_to_insurance_reserve);
    near(r.pv_fcff, r.fcff / discount);
    assert.deepEqual(result.resolved_annual_inputs[i], p);
  }
  near(result.terminal.pv_terminal_value, result.terminal.terminal_value_at_2036_06_30 / discount);
  assert.equal(result.wacc, inputs.cases.base.wacc, 'Interim rollforward keeps source scenario WACC');
  assert.deepEqual(result.annual_wacc, annual.map(r => r.wacc));
});
test('UBER constant rate path has identical source-case economics and complete terminal edits', () => {
  const c = clone(inputs.cases.base);
  c.wacc = .105; c.cash_tax_rate = .27; c.terminal_growth = .03; c.terminal_roic = .3;
  c.ebit_bookings_margin[9] = .06;
  const annual = blankAnnual().map((r, i) => ({ wacc: .105, cash_tax_rate: .27, ...(i === 9 ? { ebit_bookings_margin: .06 } : {}) }));
  const viaRows = evaluateUber(inputs, 'base', illustration, annual, { wacc: .105, terminal_growth: .03, terminal_roic: .3 });
  const viaCase = evaluateUber(inputs, c, illustration);
  near(viaRows.operating_enterprise_value, viaCase.operating_enterprise_value);
  for (let i = 0; i < 10; i++) sourceSubset(viaRows.annual_forecast[i], viaCase.annual_forecast[i]);
  const terminal = {
    terminal_growth: .02, terminal_roic: .35, wacc: .11, cash_tax_rate: .26,
    ebit_bookings_margin: .045, da_revenue_ratio: .014,
    gross_reinvestment_revenue_ratio: .025, incremental_noninsurance_nwc_revenue_ratio: .035,
  };
  const o = evaluateUber(inputs, 'base', illustration, null, terminal), t = o.terminal, last = o.annual_forecast[9];
  near(t.revenue, last.revenue * 1.02);
  near(t.gaap_ebit_after_sbc, t.gross_bookings * .045);
  near(t.cash_operating_tax, t.gaap_ebit_after_sbc * .26);
  near(t.operating_da_addback, t.revenue * .014);
  near(t.gross_operating_asset_reinvestment, t.revenue * .025);
  near(t.delta_noninsurance_nwc, (t.revenue - last.revenue) * .035);
  near(t.delta_insurance_reserve, last.insurance_reserve_end * .02);
  near(t.delta_restricted_pool, last.required_restricted_pool_end * .02);
  near(t.roic_growth_reinvestment_floor, t.nopat * .02 / .35);
  near(t.terminal_value_at_2036_06_30, t.fcff / (.11 - .02));
  assert.deepEqual(o.resolved_terminal_inputs, terminal);
});
test('UBER overrides require exact ten-row shape, finite supported inputs and valid terminal spread', () => {
  for (const annual of [[], [{}], Array(9).fill({}), Array(11).fill({}), Array(10).fill(null)]) {
    assert.throws(() => evaluateUber(inputs, 'base', null, annual), /UBER/);
  }
  for (const [k, value] of [
    ['mobility_growth', NaN], ['wacc', 0], ['cash_tax_rate', false], ['gross_reinvestment_revenue_ratio', -1],
    ['unknown', 1], ['revenue', 1000], ['mobility_growth', null],
  ]) {
    const rows = blankAnnual(); rows[2][k] = value;
    assert.throws(() => evaluateUber(inputs, 'base', null, rows), /UBER/);
  }
  for (const terminal of [
    { terminal_growth: .095 }, { wacc: .025 }, { terminal_roic: .025 }, { wacc: Infinity },
    { mobility_growth: .03 }, { collateral_to_insurance_reserve: 1 }, { cash_tax_rate: null },
  ]) assert.throws(() => evaluateUber(inputs, 'base', null, null, terminal), /UBER/);
});
// Frozen Python bridge output for the explicit synthetic fixture above.
const PYTHON_BRIDGE_GOLDEN = {
  "status": "conditional_rollforward",
  "as_of": "2026-10-19",
  "information_cutoff": "2026-10-19",
  "duration_years": 0.30390143737166325,
  "rolled_operating_ev": 196449.81090790397,
  "interim_economic_fcff": 0.0,
  "economic_to_actual_operating_cash_reconciliation": {
    "sbc_cash_equivalent_reversal": 0.0,
    "operating_cash_tax_difference": 0.0,
    "insurance_collateral_nwc_difference": 0.0,
    "reinvestment_timing_difference": 0.0,
    "other_operating_cash_difference": 0.0
  },
  "actual_operating_cash_after_reinvestment_before_interest": 0.0,
  "new_euro_notes_principal_eurm": 4500.0,
  "new_euro_notes_gross_proceeds_eurm": 4489.3075,
  "new_euro_notes_known_original_issue_discount_eurm": 10.6925,
  "new_euro_notes_known_underwriting_discounts_eurm": 24.875,
  "new_euro_notes_issuer_proceeds_before_other_expenses_eurm": 4464.4325,
  "new_euro_notes_net_proceeds_eurm_assumed": 4464.4325,
  "new_euro_notes_cash_proceeds_usdm_at_issue": 4910.87575,
  "new_euro_notes_retained_cash_fx_adjustment_usdm": 0.0,
  "new_euro_notes_debt_value_usdm": 4950.0,
  "cash_rollforward_components": {
    "june_unrestricted_liquidity": 5391,
    "actual_operating_cash_after_reinvestment_before_interest": 0.0,
    "actual_cash_interest_paid": -0.0,
    "new_notes_net_proceeds_at_issue_fx": 4910.87575,
    "retained_new_note_cash_fx_translation": 0.0,
    "realized_euro_proceeds_fx_adjustment": 0.0,
    "other_cash_fx_translation": 0.0,
    "other_debt_cash_proceeds": 0.0,
    "existing_debt_cash_repayments": -0.0,
    "buybacks": -0.0,
    "closed_deal_consideration": -465.0,
    "closed_deal_cash_acquired": 0.0,
    "legacy_claim_cash_settled": -0.0,
    "other_nonoperating_cash_flow": 0.0
  },
  "ending_unrestricted_liquidity_assumed": 9836.87575,
  "named_closed_deals": {
    "getir": {
      "cash_consideration": 465,
      "operating_ev_added": 400,
      "cash_acquired": 0.0,
      "debt_value_added": 0.0,
      "nci_value_added": 0.0,
      "other_claim_value_added": 0.0,
      "minority_investment_added": 65,
      "prior_investment_removed": 0
    },
    "careem": {
      "cash_consideration": 0.0,
      "operating_ev_added": 117.6,
      "cash_acquired": 0.0,
      "debt_value_added": 0.0,
      "nci_value_added": 0.0,
      "other_claim_value_added": 0.0,
      "minority_investment_added": 0,
      "prior_investment_removed": 117.6
    },
    "blacklane": {
      "cash_consideration": 0.0,
      "operating_ev_added": 0.0,
      "cash_acquired": 0.0,
      "debt_value_added": 0.0,
      "nci_value_added": 0.0,
      "other_claim_value_added": 0.0,
      "minority_investment_added": 0,
      "prior_investment_removed": 0
    }
  },
  "residual_legacy_investment_value": 11666.2,
  "investment_value_assumed": 11731.2,
  "residual_legacy_debt_value": 12900.0,
  "debt_value_assumed": 17850.0,
  "current_inherited_nondebt_claims": {
    "existing_option_value_reserve": 200,
    "finance_lease_claim": 140,
    "nonredeemable_nci_claim": 903,
    "redeemable_nci_claim": 180,
    "legacy_legal_regulatory_tax_claim": 1841,
    "income_other_tax_claim": 1042,
    "additional_mixed_and_derivative_claim": 250,
    "investment_and_vehicle_commitment_net_cost_reserve": 1250,
    "additional_other_claim": 0
  },
  "inherited_nondebt_claim_change": {
    "existing_option_value_reserve": 0,
    "finance_lease_claim": 0,
    "nonredeemable_nci_claim": 0,
    "redeemable_nci_claim": 0,
    "legacy_legal_regulatory_tax_claim": 0,
    "income_other_tax_claim": 0,
    "additional_mixed_and_derivative_claim": 0,
    "investment_and_vehicle_commitment_net_cost_reserve": 0,
    "additional_other_claim": 0
  },
  "nondebt_claim_value_assumed": 5806.0,
  "conditional_common_equity_value": 193361.886657904,
  "assumed_common_plus_existing_award_shares": 2072315000,
  "conditional_october_allocation_per_share": 93.3071886551533,
  "verified_current_target": null,
  "current_verified_equity_ready": false
};
test('UBER October bridge matches every numeric frozen-Python synthetic fixture field without UX gates', () => {
  const result = bridge(synthetic());
  sourceSubset(result, PYTHON_BRIDGE_GOLDEN);
  assert.equal(result.current_target_price, null);
  assert.equal(result.verified_current_target, null);
  assert.equal(result.current_verified_equity_ready, false);
  assert.equal(result.cash_funding_certification, false);
  assert.equal(result.assumption_basis, null);
  near(result.new_euro_notes_debt_value_usdm - result.new_euro_notes_cash_proceeds_usdm_at_issue,
    (4500 - 4464.4325) * 1.1);
  near(result.named_closed_deals.careem.prior_investment_removed, 117.6);
  near(result.named_closed_deals.getir.minority_investment_added, 65);
});
test('UBER known issue and underwriting discounts cannot be waived; retained cash and debt FX offset', () => {
  const p = synthetic(), original = bridge(p);
  const costs = bridge({ ...p, euro_note_other_offering_expenses_eurm: 30 });
  near(original.conditional_common_equity_value - costs.conditional_common_equity_value, 33);
  const estimate = bridge({ ...p, euro_note_other_offering_expenses_eurm: 11.4325 });
  near(estimate.new_euro_notes_net_proceeds_eurm_assumed, 4453);
  const retained = bridge({ ...p, euro_note_proceeds_retained_eurm: 4464.4325, eur_usd_at_current_mark: 1.2 });
  near(retained.new_euro_notes_retained_cash_fx_adjustment_usdm, 4464.4325 * .1);
  near(retained.conditional_common_equity_value - original.conditional_common_equity_value, -(4500 - 4464.4325) * .1);
  const estimatedRetained = bridge({ ...p, euro_note_other_offering_expenses_eurm: 11.4325, euro_note_proceeds_retained_eurm: 4453, eur_usd_at_current_mark: 1.2 });
  near(estimatedRetained.conditional_common_equity_value - estimate.conditional_common_equity_value, -4.7);
  assert.throws(() => bridge({ ...p, euro_note_other_offering_expenses_eurm: 4464.4325 }), /expenses cannot consume/);
  assert.throws(() => bridge({ ...p, euro_note_proceeds_retained_eurm: 4500 }), /exceed net proceeds/);
  assert.throws(() => bridge({ ...p, euro_note_proceeds_retained_eurm: 4464.4325, buyback_cash: 6000 }), /exceeds total ending cash/);
  for (const key of Object.keys(UBER_NOTE_FACTS)) {
    const e = clone(events); e.events.find(e => e.event_date === '2026-09-15')[key] += 1;
    assert.throws(() => evaluateUberRollforward(june, illustration, p, e, inputs), /Frozen euro-note fact changed/);
  }
  const e = clone(events); e.events[0].cash_outflow_usdm_approx = 466;
  assert.throws(() => validateUberEvents(e), /Getir/);
});
test('UBER economic FCFF, actual cash and nonoperating ledgers remain separate', () => {
  const p = synthetic(), original = bridge(p);
  for (const key of ['other_nonoperating_cash_flow', ...UBER_CASH_RECON]) {
    const result = bridge({ ...p, [key]: 100 });
    near(result.rolled_operating_ev, original.rolled_operating_ev, key);
    near(result.conditional_common_equity_value - original.conditional_common_equity_value, 100, key);
  }
  const economic = bridge({ ...p, interim_economic_fcff: 100 });
  near(economic.rolled_operating_ev - original.rolled_operating_ev, -100 * (1 + june.wacc) ** (original.duration_years / 2));
  near(economic.ending_unrestricted_liquidity_assumed - original.ending_unrestricted_liquidity_assumed, 100);
  const interest = bridge({ ...p, actual_cash_interest_paid: 100 });
  near(interest.conditional_common_equity_value - original.conditional_common_equity_value, -100);
  for (const key of ['other_cash_fx_translation', 'realized_euro_proceeds_fx_adjustment']) {
    const result = bridge({ ...p, [key]: -100 });
    near(result.rolled_operating_ev, original.rolled_operating_ev);
    near(result.conditional_common_equity_value - original.conditional_common_equity_value, -100);
  }
});
test('UBER paired asset sales, debt/claim retirement and acquisition classification conserve equity', () => {
  const p = synthetic(), original = bridge(p);
  const variants = [
    { ...p, other_nonoperating_cash_flow: 100, investment_value_change_ex_careem_getir: -100 },
    { ...p, careem_cash_paid: 100, careem_operating_ev_added: p.careem_operating_ev_added + 100 },
    { ...p, blacklane_cash_paid: 100, blacklane_operating_ev_added: 100 },
    { ...p, getir_operating_ev_added: p.getir_operating_ev_added - 100, getir_grocery_minority_investment_value: p.getir_grocery_minority_investment_value + 100 },
    { ...p, existing_debt_principal_cash_repaid: 100, existing_debt_value_retired: 100 },
    { ...p, other_debt_cash_proceeds: 100, other_debt_value_added: 100 },
    { ...p, legacy_claim_cash_settled: 100, current_inherited_nondebt_claims: { ...p.current_inherited_nondebt_claims, legacy_legal_regulatory_tax_claim: p.current_inherited_nondebt_claims.legacy_legal_regulatory_tax_claim - 100 } },
    { ...p, getir_cash_acquired: 100, getir_debt_value_added: 100 },
    { ...p, careem_operating_ev_added: p.careem_operating_ev_added + 100, careem_nci_value_added: 100 },
    { ...p, blacklane_operating_ev_added: 100, blacklane_other_claim_value_added: 100 },
  ];
  for (const variant of variants) near(bridge(variant).conditional_common_equity_value, original.conditional_common_equity_value);
  const differentJune = { ...illustration, included_careem_investment_value: 50 };
  const paired = evaluateUberRollforward(june, differentJune, { ...p, careem_operating_ev_added: 50 }, events, inputs);
  near(paired.conditional_common_equity_value, original.conditional_common_equity_value);
  near(paired.named_closed_deals.careem.prior_investment_removed, 50);
});
test('UBER every current economic input is mandatory; unknowns never silently zero-fill', () => {
  for (const key of [...UBER_ROLLFORWARD_NONNEG, ...UBER_ROLLFORWARD_SIGNED]) {
    const p = synthetic(); p[key] = null;
    const result = bridge(p);
    assert.equal(result.status, 'incomplete_rollforward', key);
    assert.equal(result.conditional_october_allocation_per_share, null, key);
    assert.deepEqual(result.missing, [key]);
  }
  for (const key of UBER_CURRENT_CLAIMS) {
    const p = synthetic(); p.current_inherited_nondebt_claims[key] = null;
    assert.deepEqual(bridge(p).missing, [`current_inherited_nondebt_claims.${key}`]);
  }
  const p = synthetic(); delete p.current_inherited_nondebt_claims;
  assert.ok(bridge(p).missing.includes('current_inherited_nondebt_claims'));
});
test('UBER October numeric bounds, shares, inherited keys and legacy-pool isolation', () => {
  for (const key of UBER_ROLLFORWARD_NONNEG) {
    for (const value of [-1, true, NaN, Infinity]) {
      const p = synthetic(); p[key] = value;
      assert.throws(() => bridge(p), /UBER/, `${key}=${value}`);
    }
  }
  for (const key of UBER_ROLLFORWARD_SIGNED) {
    for (const value of [true, NaN, Infinity]) {
      const p = synthetic(); p[key] = value;
      assert.throws(() => bridge(p), /UBER/, key);
    }
  }
  for (const key of UBER_CURRENT_CLAIMS) {
    for (const value of [-1, true, NaN, Infinity]) {
      const p = synthetic(); p.current_inherited_nondebt_claims[key] = value;
      assert.throws(() => bridge(p), /UBER/, key);
    }
  }
  for (const [key, value] of [
    ['assumed_current_common_shares', 0], ['assumed_current_common_shares', 2042560121.5],
    ['assumed_current_common_shares', Number.MAX_SAFE_INTEGER + 1],
    ['assumed_current_existing_award_incremental_shares', .5],
    ['euro_note_current_price_fraction', 0], ['euro_note_current_price_fraction', 2.1],
    ['eur_usd_at_issue', .2], ['eur_usd_at_current_mark', 5],
    ['existing_debt_value_retired', illustration.debt_total_value + 1],
    ['investment_value_change_ex_careem_getir', -illustration.investment_asset_value + illustration.included_careem_investment_value - 1],
  ]) assert.throws(() => bridge({ ...synthetic(), [key]: value }), /UBER/, key);
  const p = synthetic(); p.current_inherited_nondebt_claims.unrecognized_claim = 0;
  assert.throws(() => bridge(p), /Unrecognized inherited claim/);
  assert.throws(() => bridge({ ...synthetic(), as_of: '2026-10-20' }), /ends October19/);
  assert.throws(() => evaluateUberRollforward(june, emptyJune, synthetic()), /Complete June allocation/);
  assert.throws(() => evaluateUberRollforward(june, { ...illustration, included_careem_investment_value: null }, synthetic()), /Careem/);
  assert.throws(() => evaluateUberRollforward(june, { ...illustration, included_careem_investment_value: illustration.investment_asset_value + 1 }, synthetic()), /Careem/);
});
test('UBER cash/equity shortfall suppression and current-target exclusion survive complete policies', () => {
  for (const p of [
    { ...synthetic(), buyback_cash: 1e6 },
    { ...synthetic(), current_operating_cash_reserve: 1e6 },
    { ...synthetic(), preexisting_debt_mark_change: 1e6 },
  ]) {
    const result = bridge(p);
    assert.equal(result.status, 'suppressed_cash_or_equity_shortfall');
    assert.equal(result.conditional_october_allocation_per_share, null);
    assert.equal(result.verified_current_target, null);
    assert.equal(result.current_target_price, null);
    assert.equal(result.current_verified_equity_ready, false);
  }
  const p = synthetic(), before = JSON.stringify(p);
  const result = bridge(p);
  result.resolved_assumptions.current_inherited_nondebt_claims.finance_lease_claim = 1;
  result.current_inherited_nondebt_claims.finance_lease_claim = 2;
  assert.equal(JSON.stringify(p), before, 'Output edits cannot mutate the input policy');
});
