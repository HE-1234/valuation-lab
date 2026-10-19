import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {calculateCrdo, validateCrdoInputs} from '../dist/crdo-financial-engine.js';

const source = new URL('./fixtures/crdo-v3/', import.meta.url);
const inputs = JSON.parse(fs.readFileSync(new URL('dcf-inputs-v3.json', source), 'utf8'));
const clone = value => structuredClone(value);
const calculate = (m = inputs, scenario = 'base', mode = 'current', overrides = null) => calculateCrdo(scenario, mode, overrides, m);
function near(actual, expected, path = '') {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= Math.max(2e-10, Math.abs(expected) * 2e-13), `${path}: ${actual} != ${expected}`);
}
function sameResult(actual, expected, path = 'result') {
  if (typeof expected === 'number') return near(actual, expected, path);
  if (expected === null || typeof expected !== 'object') return assert.equal(actual, expected, path);
  assert.equal(Array.isArray(actual), Array.isArray(expected), path);
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), path);
  for (const key of Object.keys(expected)) sameResult(actual[key], expected[key], `${path}.${key}`);
}
function pythonReplay(requests) {
  const code = `import sys,json\nsys.path.insert(0,sys.argv[1])\nimport replay_dcf as d\nrequests=json.load(sys.stdin)\nprint(json.dumps([d.calc(x.get('scenario','base'),x.get('mode','current'),x.get('overrides'),x.get('inputs')) for x in requests],allow_nan=False))`;
  return JSON.parse(execFileSync('python3', ['-B', '-c', code, fileURLToPath(source)], {input: JSON.stringify(requests), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024}));
}
function *numericLeaves(value, path = []) {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) yield *numericLeaves(value[key], [...path, key]);
  } else if (typeof value === 'number') yield path;
}
function setPath(value, path, replacement) {
  for (const key of path.slice(0, -1)) value = value[key];
  value[path.at(-1)] = replacement;
}
function reject(path, replacement) {
  const m = clone(inputs); setPath(m, path, replacement);
  assert.throws(() => calculate(m), undefined, `${path.join('.')} must reject ${String(replacement)}`);
}

test('CRDO all six results independently replay Python and match every published field', () => {
  const requests = ['report_snapshot', 'current'].flatMap(mode => Object.keys(inputs.scenarios).map(scenario => ({scenario, mode})));
  const replay = pythonReplay(requests);
  const published = JSON.parse(fs.readFileSync(new URL('dcf-output-v3.json', source), 'utf8'));
  assert.equal(replay.length, 6);
  for (let i = 0; i < requests.length; i++) {
    const {scenario, mode} = requests[i];
    assert.deepEqual(replay[i], published[i], 'source output must still reproduce from Python');
    const result = calculate(inputs, scenario, mode);
    sameResult(result, replay[i]);
    assert.equal(result.status, 'supported_conditional_at_annual_resolution');
    assert.equal(result.rows.length, 10);
    near(result.common_equity_value / result.common_shares, result.value_per_common_share);
  }
});

test('CRDO bridge dates, withholding extinguishment, cash, and stub calculations are canonical', () => {
  const r = calculate(), snapshot = calculate(inputs, 'base', 'report_snapshot'), b = r.bridge;
  assert.deepEqual([b.elapsed_days, b.stub_days, b.remaining_days], [78, 273, 195]);
  assert.equal(b.year_fraction_denominator, 365.25);
  assert.equal(b.valuation_date, '2026-10-18');
  assert.equal(snapshot.valuation_date, '2026-08-01');
  assert.equal(snapshot.information_cutoff, '2026-09-02');
  assert.equal(snapshot.bridge.settlement_price, null);
  assert.equal(snapshot.bridge.elapsed_days, 0);
  assert.equal(b.cash_increase, 40);
  near(b.gross_rsus_settled, b.net_rsu_shares_issued + b.withheld_rsu_shares);
  near(b.remaining_rsus + b.gross_rsus_settled, inputs.rsus);
  near(r.rows[0].remaining_operating_fraction, (2500 - 479.003) / 2500 * 195 / 273);
  near(r.rows[0].discount_factor, (1 + r.rows[0].wacc) ** (195 / 365.25));
  near(r.remaining_option_term, inputs.option_term - 78 / 365.25);
  assert.equal(r.common_shares, inputs.ordinary_shares + 0.7);
});

test('CRDO full scalar nonfinite and type mutation coverage fails closed, including unused scenarios', () => {
  let checks = 0;
  for (const path of numericLeaves(inputs)) {
    for (const invalid of [NaN, Infinity, -Infinity, '0', true, null]) {
      reject(path, invalid); checks++;
    }
  }
  assert.ok(checks > 1400, `${checks} mutation checks`);
  const stress = clone(inputs);
  stress.scenarios.base.sales_to_capital[0] = 0.5;
  stress.funding.minimum_cash_floor = NaN;
  assert.throws(() => calculate(stress), /finite real number/);
});

test('CRDO unknown keys, missing fields, incorrect shapes and invalid modes never fall back', () => {
  const containers = [[], ['funding'], ['dates'], ['macro'], ['october_bridge'], ['scenarios'], ...Object.keys(inputs.scenarios).map(name => ['scenarios', name])];
  for (const path of containers) {
    const m = clone(inputs); let container = m;
    for (const key of path) container = container[key];
    container.new_borrowing = 1000;
    assert.throws(() => calculate(m), /unknown keys/);
    delete container.new_borrowing;
    delete container[Object.keys(container)[0]];
    assert.throws(() => calculate(m), /missing keys/);
  }
  for (const name of Object.keys(inputs.scenarios)) {
    for (const key of ['revenue', 'pre_new_grant_operating_margin', 'new_grant_sbc_margin', 'sales_to_capital', 'tax_rate', 'capacity_deposit_recovery']) {
      reject(['scenarios', name, key], inputs.scenarios[name][key].slice(1));
      reject(['scenarios', name, key], {});
    }
  }
  reject(['funding', 'reserve_existing_debt_like_claims'], 1);
  reject(['funding', 'scope'], 1);
  assert.throws(() => calculate(inputs, 'missing'), /Unknown scenario/);
  assert.throws(() => calculate(inputs, 'toString'), /Unknown scenario/);
  assert.throws(() => calculate(inputs, 'base', 'spot'), /Unknown mode/);
  assert.throws(() => calculateCrdo('base'), /explicit inputs/);
  assert.throws(() => calculate(inputs, 'base', 'current', []), /object/);
  assert.throws(() => calculate(inputs, 'base', 'current', {borrowing: 1000}), /unknown keys/);
  assert.throws(() => calculate(inputs, 'base', 'current', JSON.parse('{"__proto__":{"borrowing":1000}}')), /unknown keys/);
  const sparse = clone(inputs); delete sparse.scenarios.base.revenue[5];
  assert.throws(() => calculate(sparse), /finite real number/);
});

test('CRDO all probability, capital, margin, tax, rate and debt domains match v3', () => {
  for (const name of Object.keys(inputs.scenarios)) {
    for (const key of ['rsu_vesting_probability', 'psu_vesting_probability', 'earnout_probability']) {
      for (const value of [-0.01, 1.01]) reject(['scenarios', name, key], value);
    }
    for (const key of ['revenue', 'sales_to_capital']) for (const value of [0, -1]) reject(['scenarios', name, key, 0], value);
    for (const key of ['tax_rate', 'new_grant_sbc_margin']) for (const value of [-0.01, 1.01]) reject(['scenarios', name, key, 0], value);
    for (const value of [-1.01, 1.01]) reject(['scenarios', name, 'pre_new_grant_operating_margin', 0], value);
    reject(['scenarios', name, 'revenue', 0], inputs.q1fy2027_actual_revenue);
    reject(['scenarios', name, 'terminal_roic'], 0);
    reject(['scenarios', name, 'terminal_growth'], -0.01);
    reject(['scenarios', name, 'terminal_growth'], 0.2);
    reject(['scenarios', name, 'terminal_roic'], 0.01);
    reject(['scenarios', name, 'capacity_deposit_recovery', 1], 1000);
    reject(['scenarios', name, 'capacity_deposit_recovery', 1], -1);
    reject(['scenarios', name, 'capacity_deposit_outflow'], 54);
  }
  for (const key of ['ordinary_shares', 'rsus', 'psus', 'options', 'exchangeable_subsidiary_restricted_shares', 'earnout_max_shares', 'cash_and_investments', 'technology_license_debt', 'cash_contingent_consideration', 'ttm_sbc']) reject([key], -1);
  for (const key of ['option_strike', 'option_term', 'option_volatility', 'base_fy2026_revenue', 'q1fy2027_actual_revenue', 'ttm_revenue', 'ordinary_shares', 'acquisition_reference_stock_price']) reject([key], 0);
  reject(['special_ceo_psus'], inputs.psus + 1);
  reject(['interest_bearing_debt'], 1000);
  reject(['macro', 'debt_weight'], 0.1);
  for (const key of ['rf_report', 'rf_current', 'erp_report', 'erp_current']) for (const value of [-0.01, 1.01]) reject(['macro', key], value);
  for (const key of ['beta_start', 'beta_terminal']) reject(['macro', key], -1);
  for (const key of ['operating_cash_after_ordinary_working_capital', 'capital_expenditures', 'capacity_deposits_paid', 'rsu_withholding_cash', 'net_rsu_shares_issued']) reject(['october_bridge', key], -1);
  for (const [path, value] of [
    [['october_bridge', 'rsu_settlement_price'], 0], [['october_bridge', 'restricted_share_vesting_probability'], 1.1],
    [['october_bridge', 'net_rsu_shares_issued'], 10], [['october_bridge', 'capacity_deposits_paid'], 103],
    [['funding', 'minimum_cash_floor'], -1], [['funding', 'reserve_existing_debt_like_claims'], false], [['funding', 'mode'], 'borrow']
  ]) reject(path, value);
  for (const overrides of [{earnout_probability: -1}, {volatility: NaN}, {volatility: 0}, {wacc_shift: Infinity}, {wacc_shift: -1}]) assert.throws(() => calculate(inputs, 'base', 'current', overrides));
  const zeroWacc = clone(inputs); Object.assign(zeroWacc.macro, {rf_report: 0, rf_current: 0, erp_report: 0, erp_current: 0});
  assert.throws(() => calculate(zeroWacc), /derived_wacc/);
});

test('CRDO validates exact ISO dates, cutoff ordering, option expiry and positive denominator', () => {
  for (const date of ['invalid', '2026-02-30', '2026-02-29', '2026-13-01', '2026-10-18T00:00:00Z', '2027-05-01', '2026-07-31', '0000-10-18']) reject(['dates', 'current_date'], date);
  reject(['dates', 'report_information_cutoff'], '2026-07-31');
  reject(['dates', 'current_information_cutoff'], '2026-10-17');
  reject(['option_term'], 78 / 365.25);
  for (const denominator of [0, -1]) reject(['dates', 'day_count_denominator'], denominator);
  const variants = ['2026-10-17', '20261018', '2026-W42-7', '2026W427', '2026-W42', '2026W42'];
  const requests = variants.map(date => {const m = clone(inputs); m.dates.current_date = date; return {inputs: m};});
  const oracle = pythonReplay(requests);
  requests.forEach((request, i) => sameResult(calculate(request.inputs), oracle[i]));
  const changed = clone(inputs); changed.dates.first_forecast_end = '2027-05-02';
  assert.equal(calculate(changed).bridge.stub_days, 274);
});

test('CRDO funding gaps release null EV, equity and per-share values and preserve diagnostics', () => {
  const mutations = [
    m => { m.scenarios.base.sales_to_capital[0] = 0.5; },
    m => { m.funding.minimum_cash_floor = 1000; },
    m => { m.scenarios.base.capacity_deposit_outflow = 900; }
  ];
  const requests = mutations.map(mutate => {const m = clone(inputs); mutate(m); return {inputs: m};});
  const oracle = pythonReplay(requests);
  requests.forEach((request, i) => {
    const r = calculate(request.inputs); sameResult(r, oracle[i]);
    assert.equal(r.status, 'unsupported_funding_gap');
    for (const key of ['enterprise_value', 'common_equity_value', 'value_per_common_share']) assert.equal(r[key], null);
    assert.ok(r.funding_gaps.length);
    assert.ok(r.funding_gaps.every(gap => gap.shortfall > 0));
    assert.equal(r.rows.length, 10);
  });
  assert.ok(calculate(requests[2].inputs).funding_gaps.some(gap => gap.point === 'first_stub_deposit_before_operating_receipts'));
  const negativePool = clone(inputs);
  negativePool.cash_and_investments = 10000;
  negativePool.scenarios.base.pre_new_grant_operating_margin[9] = -1;
  const r = calculate(negativePool);
  sameResult(r, pythonReplay([{inputs: negativePool}])[0]);
  assert.equal(r.status, 'unsupported_nonpositive_equity_pool');
  for (const key of ['enterprise_value', 'common_equity_value', 'value_per_common_share']) assert.equal(r[key], null);
});

test('CRDO bridge perturbations independently replay without snapshot leakage or double charging deposits', () => {
  const base = calculate();
  const variants = [
    ['operating_cash_after_ordinary_working_capital', 145], ['capital_expenditures', 25],
    ['capacity_deposits_paid', 65], ['rsu_withholding_cash', 35], ['net_rsu_shares_issued', 0.8], ['rsu_settlement_price', 100]
  ];
  const requests = variants.map(([field, value]) => {const m = clone(inputs); m.october_bridge[field] = value; return {inputs: m};});
  const oracle = pythonReplay(requests);
  requests.forEach((request, i) => {
    const r = calculate(request.inputs), field = variants[i][0];
    sameResult(r, oracle[i]);
    assert.notEqual(r.value_per_common_share, base.value_per_common_share);
    sameResult(calculate(request.inputs, 'base', 'report_snapshot'), calculate(inputs, 'base', 'report_snapshot'));
    if (field !== 'capacity_deposits_paid') near(r.enterprise_value, base.enterprise_value);
    else {
      near(r.cash, base.cash - 10);
      near(r.rows[0].capacity_deposit, base.rows[0].capacity_deposit - 10);
      near(r.cash + r.rows[0].fcff, base.cash + base.rows[0].fcff);
    }
  });
});

test('CRDO source sensitivity grid is calculated rather than cached', () => {
  const sensitivity = JSON.parse(fs.readFileSync(new URL('sensitivity-v3.json', source), 'utf8'));
  assert.equal(sensitivity.length, 55);
  for (const expected of sensitivity) {
    const m = clone(inputs); let overrides = null;
    switch (expected.kind) {
      case 'WACC/g': overrides = {wacc_shift: expected.wacc_shift, terminal_growth: expected.terminal_growth}; break;
      case 'earnout conditional factor': overrides = {earnout_probability: expected.conditional_factor}; break;
      case 'option volatility': overrides = {volatility: expected.volatility}; break;
      case 'future equity labor': overrides = {new_grant_sbc_margin: Array(10).fill(expected.new_grant_margin)}; break;
      case 'unobserved interim settlement price': m.october_bridge.rsu_settlement_price = expected.price_assumption; break;
      case 'interim cash bridge': m.october_bridge.operating_cash_after_ordinary_working_capital = expected.derived_net_cash_increase + m.october_bridge.capital_expenditures + m.october_bridge.capacity_deposits_paid + m.october_bridge.rsu_withholding_cash; break;
      case 'unreported incremental zero-strike claim equivalents': m.ordinary_shares += expected.extra_shares; break;
      case 'PSU conditional factor': overrides = {psu_vesting_probability: expected.conditional_factor}; break;
      case 'zero deposit recovery': overrides = {capacity_deposit_recovery: Array(10).fill(0)}; break;
      case 'early capital intensity': m.scenarios.base.sales_to_capital[0] = expected.first_year_sales_to_capital; break;
      default: assert.fail('Unhandled source sensitivity ' + expected.kind);
    }
    const r = calculate(m, 'base', 'current', overrides);
    assert.equal(r.status, expected.status);
    if (expected.value_per_common_share === null) assert.equal(r.value_per_common_share, null);
    else near(r.value_per_common_share, expected.value_per_common_share);
    near(r.minimum_modeled_liquidity, expected.minimum_modeled_liquidity);
  }
});

test('CRDO rejects derived numerical overflow and never mutates explicit inputs or overrides', () => {
  const before = clone(inputs), overrides = {wacc_shift: 0.005, volatility: 0.55}, beforeOverrides = clone(overrides);
  assert.equal(validateCrdoInputs(inputs), true);
  calculate(inputs, 'base', 'current', overrides);
  assert.deepEqual(inputs, before);
  assert.deepEqual(overrides, beforeOverrides);
  const m = clone(inputs); m.scenarios.base.revenue = Array(10).fill(1e308);
  assert.throws(() => calculate(m), /finite|Numerical|Normal/);
  assert.throws(() => calculate(inputs, 'base', 'current', {volatility: 1e308}), /finite|Numerical|Normal/);
});

test('CRDO preserves Python option limits for supported extreme finite volatility', () => {
  const requests = [1e-320, 1e-310, 1e-308, 1e307].map(volatility => ({overrides: {volatility}}));
  const oracle = pythonReplay(requests);
  requests.forEach((request, i) => sameResult(calculate(inputs, 'base', 'current', request.overrides), oracle[i]));
});
