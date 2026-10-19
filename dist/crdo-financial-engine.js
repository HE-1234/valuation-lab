// Faithful CRDO v3 zero-borrowing FCFF engine, USD millions and million shares.
// Numerical and domain contract: replay_dcf.py + validation.py (v3).
// Financial inputs are explicit; this module stores only the immutable type schema.
import {fnNormalCDF} from './fn-option-allocation.js';
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(message); };
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
const INPUT_SCHEMA = deepFreeze({
  "version": "string",
  "units": "string",
  "valuation_type": "string",
  "source_cutoff": "string",
  "base_fy2026_revenue": "number",
  "q1fy2027_actual_revenue": "number",
  "ttm_revenue": "number",
  "ttm_gaap_ebit": "number",
  "ttm_sbc": "number",
  "cash_and_investments": "number",
  "technology_license_debt": "number",
  "cash_contingent_consideration": "number",
  "ordinary_shares": "number",
  "rsus": "number",
  "psus": "number",
  "special_ceo_psus": "number",
  "options": "number",
  "option_strike": "number",
  "option_term": "number",
  "option_volatility": "number",
  "exchangeable_subsidiary_restricted_shares": "number",
  "earnout_max_shares": "number",
  "earnout_accounting_equity_fair_value": "number",
  "acquisition_reference_stock_price": "number",
  "interest_bearing_debt": "number",
  "lease_policy": "string",
  "sbc_policy": "string",
  "rd_policy": "string",
  "reinvestment_policy": "string",
  "october_bridge": {
    "operating_cash_after_ordinary_working_capital": "number",
    "capital_expenditures": "number",
    "capacity_deposits_paid": "number",
    "rsu_withholding_cash": "number",
    "net_rsu_shares_issued": "number",
    "rsu_settlement_price": "number",
    "rsu_settlement_price_status": "string",
    "restricted_share_vesting_probability": "number",
    "description": "string"
  },
  "macro": {
    "rf_report": "number",
    "erp_report": "number",
    "rf_current": "number",
    "erp_current": "number",
    "macro_report_source": "string",
    "macro_current_source": "string",
    "beta_start": "number",
    "beta_terminal": "number",
    "debt_weight": "number",
    "choice": "string"
  },
  "scenarios": {
    "bear": {
      "revenue": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "pre_new_grant_operating_margin": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "new_grant_sbc_margin": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "sales_to_capital": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "tax_rate": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "rsu_vesting_probability": "number",
      "psu_vesting_probability": "number",
      "earnout_probability": "number",
      "terminal_growth": "number",
      "terminal_roic": "number",
      "capacity_deposit_outflow": "number",
      "capacity_deposit_recovery": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ]
    },
    "base": {
      "revenue": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "pre_new_grant_operating_margin": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "new_grant_sbc_margin": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "sales_to_capital": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "tax_rate": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "rsu_vesting_probability": "number",
      "psu_vesting_probability": "number",
      "earnout_probability": "number",
      "terminal_growth": "number",
      "terminal_roic": "number",
      "capacity_deposit_outflow": "number",
      "capacity_deposit_recovery": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ]
    },
    "bull": {
      "revenue": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "pre_new_grant_operating_margin": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "new_grant_sbc_margin": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "sales_to_capital": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "tax_rate": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      "rsu_vesting_probability": "number",
      "psu_vesting_probability": "number",
      "earnout_probability": "number",
      "terminal_growth": "number",
      "terminal_roic": "number",
      "capacity_deposit_outflow": "number",
      "capacity_deposit_recovery": [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number"
      ]
    }
  },
  "research_as_of": "string",
  "dates": {
    "balance_date": "string",
    "report_information_cutoff": "string",
    "current_date": "string",
    "current_information_cutoff": "string",
    "first_forecast_end": "string",
    "day_count_denominator": "number"
  },
  "funding": {
    "minimum_cash_floor": "number",
    "reserve_existing_debt_like_claims": "boolean",
    "mode": "string",
    "scope": "string"
  }
});
const SCENARIO_OPTIONAL = Object.freeze({wacc_shift: 'number', volatility: 'number'});

function number(value, path, {lo, hi, positive = false} = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${path}: finite real number required`);
  if ((positive && value <= 0) || (lo !== undefined && value < lo) || (hi !== undefined && value > hi)) fail(`${path}: outside supported domain`);
  return value;
}

function shape(value, template, path = 'inputs') {
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length !== template.length) fail(`${path}: ${template.length} entries required`);
    for (let i = 0; i < value.length; i++) shape(value[i], template[i], `${path}[${i}]`);
  } else if (isObject(template)) {
    if (!isObject(value)) fail(`${path}: object required`);
    const optional = path.startsWith('inputs.scenarios.') ? SCENARIO_OPTIONAL : {};
    const unknown = Object.keys(value).filter(key => !own(template, key) && !own(optional, key)).sort();
    const missing = Object.keys(template).filter(key => !own(value, key)).sort();
    if (unknown.length || missing.length) fail(`${path}: unknown keys ${JSON.stringify(unknown)}; missing keys ${JSON.stringify(missing)}`);
    for (const [key, child] of Object.entries(value)) shape(child, own(template, key) ? template[key] : optional[key], `${path}.${key}`);
  } else if (template === 'number') {
    number(value, path);
  } else if (typeof value !== template) {
    fail(`${path}: ${template} required`);
  }
}

const DAY_MS = 86400000;
function utcDay(year, month, day) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime() / DAY_MS;
}
function dayParts(day) {
  const date = new Date(day * DAY_MS);
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
}
function formatDay(day) {
  return dayParts(day).map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0')).join('-');
}
// datetime.date.fromisoformat accepts calendar/basic ISO dates and ISO week dates.
// Parse in UTC with a round trip, never Date.parse's invalid-day normalization.
function isoDay(value, key) {
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) || /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (match) {
    const [year, month, day] = match.slice(1).map(Number);
    const parsed = utcDay(year, month, day);
    if (year >= 1 && year <= 9999 && dayParts(parsed).every((part, i) => part === [year, month, day][i])) return parsed;
  } else {
    match = /^(\d{4})-W(\d{2})(?:-([1-7]))?$/.exec(value) || /^(\d{4})W(\d{2})([1-7])?$/.exec(value);
    if (match) {
      const year = Number(match[1]), week = Number(match[2]), weekday = Number(match[3] || 1);
      const jan4 = utcDay(year, 1, 4), nextJan4 = utcDay(year + 1, 1, 4);
      const monday = day => day - ((new Date(day * DAY_MS).getUTCDay() + 6) % 7);
      const start = monday(jan4), nextStart = monday(nextJan4);
      const parsed = start + (week - 1) * 7 + weekday - 1;
      if (year >= 1 && year <= 9999 && week >= 1 && week <= (nextStart - start) / 7 && dayParts(parsed)[0] >= 1 && dayParts(parsed)[0] <= 9999) return parsed;
    }
  }
  fail(`Invalid ISO date: ${key}`);
}

/** Throw without releasing any valuation when a v3 input is unsupported. */
export function validateCrdoInputs(inputs) {
  const m = inputs;
  shape(m, INPUT_SCHEMA);
  for (const key of ['base_fy2026_revenue', 'q1fy2027_actual_revenue', 'ttm_revenue', 'ordinary_shares', 'option_strike', 'option_term', 'option_volatility', 'acquisition_reference_stock_price']) number(m[key], key, {positive: true});
  for (const key of ['cash_and_investments', 'technology_license_debt', 'cash_contingent_consideration', 'rsus', 'psus', 'special_ceo_psus', 'options', 'exchangeable_subsidiary_restricted_shares', 'earnout_max_shares', 'earnout_accounting_equity_fair_value', 'interest_bearing_debt', 'ttm_sbc']) number(m[key], key, {lo: 0});
  if (m.special_ceo_psus > m.psus) fail('special_ceo_psus exceeds included total PSU pool');
  if (m.interest_bearing_debt !== 0 || m.macro.debt_weight !== 0) fail('unsupported_borrowing: funded debt and debt weight must be zero; debt issuance, repayment, interest and dilution are not modeled');
  const funding = m.funding;
  number(funding.minimum_cash_floor, 'funding.minimum_cash_floor', {lo: 0});
  if (funding.mode !== 'reject_if_funding_required' || funding.reserve_existing_debt_like_claims !== true) fail('Unsupported funding policy: mandatory claim reserve and reject-if-funding-required mode');
  const dates = m.dates, parsed = {};
  for (const [key, value] of Object.entries(dates)) if (key !== 'day_count_denominator') parsed[key] = isoDay(value, key);
  const denominator = number(dates.day_count_denominator, 'day_count_denominator', {positive: true});
  if (!(parsed.balance_date <= parsed.current_date && parsed.current_date < parsed.first_forecast_end)) fail('Current date outside forecast stub');
  if (parsed.report_information_cutoff < parsed.balance_date || parsed.current_information_cutoff < parsed.current_date) fail('Information cutoff precedes relevant balance/valuation date');
  const elapsed = (parsed.current_date - parsed.balance_date) / denominator;
  if (m.option_term <= elapsed) fail('Option term must remain positive; expired-option settlement is not modeled');
  const b = m.october_bridge;
  for (const key of ['operating_cash_after_ordinary_working_capital', 'capital_expenditures', 'capacity_deposits_paid', 'rsu_withholding_cash', 'net_rsu_shares_issued']) number(b[key], `october_bridge.${key}`, {lo: 0});
  number(b.rsu_settlement_price, 'rsu_settlement_price', {positive: true});
  number(b.restricted_share_vesting_probability, 'restricted_share_vesting_probability', {lo: 0, hi: 1});
  if (b.net_rsu_shares_issued + b.rsu_withholding_cash / b.rsu_settlement_price > m.rsus) fail('Gross RSU settlement exceeds reported pool');
  const macro = m.macro;
  for (const key of ['rf_report', 'rf_current', 'erp_report', 'erp_current']) number(macro[key], key, {lo: 0, hi: 1});
  for (const key of ['beta_start', 'beta_terminal']) number(macro[key], key, {lo: 0});
  for (const [name, s] of Object.entries(m.scenarios)) {
    const p = `scenarios.${name}.`;
    for (const key of ['rsu_vesting_probability', 'psu_vesting_probability', 'earnout_probability']) number(s[key], p + key, {lo: 0, hi: 1});
    for (const key of ['revenue', 'sales_to_capital']) for (const value of s[key]) number(value, p + key, {positive: true});
    if (s.revenue[0] <= m.q1fy2027_actual_revenue) fail(p + 'FY2027 revenue must exceed actual Q1');
    for (const key of ['tax_rate', 'new_grant_sbc_margin']) for (const value of s[key]) number(value, p + key, {lo: 0, hi: 1});
    for (const value of s.pre_new_grant_operating_margin) number(value, p + 'pre_new_grant_operating_margin', {lo: -1, hi: 1});
    number(s.capacity_deposit_outflow, p + 'capacity_deposit_outflow', {lo: 0});
    for (const value of s.capacity_deposit_recovery) number(value, p + 'capacity_deposit_recovery', {lo: 0});
    if (s.capacity_deposit_recovery.reduce((sum, value) => sum + value, 0) > s.capacity_deposit_outflow + 1e-9) fail(p + 'Deposit recovery exceeds modeled commitment');
    if (b.capacity_deposits_paid > s.capacity_deposit_outflow) fail(p + 'Paid deposits exceed modeled commitment');
    const growth = number(s.terminal_growth, p + 'terminal_growth', {lo: 0});
    const roic = number(s.terminal_roic, p + 'terminal_roic', {positive: true});
    if (growth > roic) fail(p + 'Terminal reinvestment rate exceeds 100%; unsupported terminal economics');
    if (own(s, 'volatility')) number(s.volatility, p + 'volatility', {positive: true});
    const shift = s.wacc_shift ?? 0;
    for (const suffix of ['report', 'current']) {
      for (const beta of [macro.beta_start, macro.beta_terminal]) number(macro[`rf_${suffix}`] + beta * macro[`erp_${suffix}`] + shift, p + 'derived_wacc', {positive: true});
      if (macro[`rf_${suffix}`] + macro.beta_terminal * macro[`erp_${suffix}`] + shift <= growth) fail(p + 'Terminal WACC must exceed growth');
    }
  }
  return true;
}

function bridge(m, current) {
  const dates = m.dates;
  const balance = isoDay(dates.balance_date, 'balance_date');
  const end = isoDay(dates.first_forecast_end, 'first_forecast_end');
  const asOf = current ? isoDay(dates.current_date, 'current_date') : balance;
  const days = end - balance, elapsed = asOf - balance;
  if (!(days > 0 && elapsed >= 0 && elapsed < days)) fail('Valuation date must lie within the remaining fiscal stub.');
  const b = m.october_bridge;
  const withheld = current ? b.rsu_withholding_cash / b.rsu_settlement_price : 0;
  const net = current ? b.net_rsu_shares_issued : 0;
  const gross = net + withheld;
  const cashDelta = current ? b.operating_cash_after_ordinary_working_capital - b.capital_expenditures - b.capacity_deposits_paid - b.rsu_withholding_cash : 0;
  return {
    balance_date: formatDay(balance), valuation_date: formatDay(asOf), stub_days: days, elapsed_days: elapsed,
    remaining_days: days - elapsed, year_fraction_denominator: dates.day_count_denominator,
    cash_increase: cashDelta, cash: m.cash_and_investments + cashDelta, net_rsu_shares_issued: net,
    withheld_rsu_shares: withheld, gross_rsus_settled: gross, ordinary_shares: m.ordinary_shares + net,
    remaining_rsus: m.rsus - gross, capacity_deposits_paid: current ? b.capacity_deposits_paid : 0,
    settlement_price: current ? b.rsu_settlement_price : null
  };
}

function callValue(stock, strike, years, rate, volatility) {
  const root = volatility * Math.sqrt(years);
  const d1 = (Math.log(stock / strike) + (rate + 0.5 * volatility * volatility) * years) / root;
  const d2 = d1 - root;
  // Python's math.erf accepts signed infinity; preserve that valid limiting case.
  const cdf = value => value === Infinity ? 1 : value === -Infinity ? 0 : fnNormalCDF(value);
  return stock * cdf(d1) - strike * Math.exp(-rate * years) * cdf(d2);
}

function finiteOutput(value, path = 'result') {
  if (Array.isArray(value)) value.forEach((child, index) => finiteOutput(child, `${path}[${index}]`));
  else if (isObject(value)) for (const [key, child] of Object.entries(value)) finiteOutput(child, `${path}.${key}`);
  else if (typeof value === 'number' && !Number.isFinite(value)) fail(`${path}: non-finite derived output; no valuation released`);
  return value;
}

/** Inputs must be supplied explicitly. Overrides affect only the named scenario. */
export function calculateCrdo(name, mode = 'current', overrides = null, inputs) {
  if (!isObject(inputs) || !isObject(inputs.scenarios) || !own(inputs.scenarios, name)) fail('Unknown scenario or missing explicit inputs');
  if (overrides !== null && !isObject(overrides)) fail('Scenario overrides must be an object');
  const m = structuredClone(inputs);
  m.scenarios[name] = {...m.scenarios[name], ...(overrides || {})};
  validateCrdoInputs(m);
  if (mode !== 'current' && mode !== 'report_snapshot') fail('Unknown mode');
  const s = m.scenarios[name], current = mode === 'current', br = bridge(m, current), macro = m.macro;
  const rf = macro[current ? 'rf_current' : 'rf_report'];
  const erp = macro[current ? 'erp_current' : 'erp_report'];
  let previous = m.base_fy2026_revenue, discount = 1, enterprise = 0;
  const rows = [], claimsCash = m.technology_license_debt + m.cash_contingent_consideration;
  let liquidity = br.cash - claimsCash;
  const floor = m.funding.minimum_cash_floor;
  const liquidityTests = [{point: 'opening_after_claim_reserve', cash: liquidity, minimum: floor}];
  let margin;
  for (let i = 0; i < s.revenue.length; i++) {
    const revenue = s.revenue[i], fiscalYear = 2027 + i;
    const beta = i < 5 ? macro.beta_start : macro.beta_start + (macro.beta_terminal - macro.beta_start) * (i - 4) / 5;
    const wacc = rf + beta * erp + (s.wacc_shift ?? 0);
    margin = s.pre_new_grant_operating_margin[i] - s.new_grant_sbc_margin[i];
    const nopat = revenue * margin * (1 - s.tax_rate[i]);
    const reinvestment = (revenue - previous) / s.sales_to_capital[i];
    const deposit = i === 0 ? s.capacity_deposit_outflow - br.capacity_deposits_paid : 0;
    const recovery = s.capacity_deposit_recovery[i];
    const fraction = i === 0 ? (revenue - m.q1fy2027_actual_revenue) / revenue : 1;
    const remainingFraction = i === 0 ? br.remaining_days / br.stub_days : 1;
    const fcff = (nopat - reinvestment) * fraction * remainingFraction - deposit + recovery;
    const duration = i === 0 ? br.remaining_days / br.year_fraction_denominator : 1;
    discount *= (1 + wacc) ** duration;
    if (i === 0) liquidityTests.push({point: 'first_stub_deposit_before_operating_receipts', cash: liquidity - deposit, minimum: floor});
    liquidity += fcff;
    liquidityTests.push({point: `FY${fiscalYear}_end`, cash: liquidity, minimum: floor});
    const pv = fcff / discount;
    enterprise += pv;
    rows.push({
      fiscal_year: fiscalYear, revenue, growth: revenue / previous - 1,
      pre_new_grant_operating_margin: s.pre_new_grant_operating_margin[i], new_grant_sbc_margin: s.new_grant_sbc_margin[i],
      operating_margin: margin, tax_rate: s.tax_rate[i], nopat, sales_to_capital: s.sales_to_capital[i],
      annual_reinvestment: reinvestment, remaining_operating_fraction: fraction * remainingFraction,
      capacity_deposit: deposit, capacity_recovery: recovery, fcff, wacc, discount_factor: discount,
      pv_fcff: pv, liquidity_after_reserved_claims: liquidity
    });
    previous = revenue;
  }
  const metadata = {
    scenario: name, mode, valuation_date: br.valuation_date,
    information_cutoff: m.dates[current ? 'current_information_cutoff' : 'report_information_cutoff'],
    bridge: br, liquidity_tests: liquidityTests, funding_scope: m.funding.scope,
    minimum_modeled_liquidity: Math.min(...liquidityTests.map(item => item.cash)), rows
  };
  const deficits = liquidityTests.filter(item => item.cash < item.minimum).map(item => ({...item, shortfall: item.minimum - item.cash}));
  if (deficits.length) return finiteOutput({
    ...metadata, status: 'unsupported_funding_gap',
    reason: 'Scenario needs financing beyond model scope. No equity or enterprise valuation is released. Revise assumptions or implement authorized financing and dilution mechanics.',
    funding_gaps: deficits, enterprise_value: null, value_per_common_share: null, common_equity_value: null
  });
  const growth = s.terminal_growth, terminalWacc = rf + macro.beta_terminal * erp + (s.wacc_shift ?? 0);
  const terminalNopat = previous * (1 + growth) * margin * (1 - s.tax_rate.at(-1));
  const terminalReinvestment = terminalNopat * growth / s.terminal_roic;
  const terminalValue = (terminalNopat - terminalReinvestment) / (terminalWacc - growth);
  const pvTerminal = terminalValue / discount;
  enterprise += pvTerminal;
  const cash = br.cash, pool = enterprise + cash - claimsCash, common = br.ordinary_shares;
  const rsu = br.remaining_rsus * s.rsu_vesting_probability;
  const psu = m.psus * s.psu_vesting_probability, earnout = m.earnout_max_shares * s.earnout_probability;
  const restricted = m.exchangeable_subsidiary_restricted_shares * m.october_bridge.restricted_share_vesting_probability;
  const term = m.option_term - br.elapsed_days / br.year_fraction_denominator;
  if (pool <= 0) return finiteOutput({...metadata, status: 'unsupported_nonpositive_equity_pool', enterprise_value: null, value_per_common_share: null, common_equity_value: null});
  let low = 0.000001, high = Math.max(pool / common, 1);
  for (let i = 0; i < 150; i++) {
    const mid = (low + high) / 2;
    const total = (common + rsu + psu + earnout + restricted) * mid + m.options * callValue(mid, m.option_strike, term, rf, s.volatility ?? m.option_volatility);
    if (total > pool) high = mid;
    else low = mid;
  }
  const value = (low + high) / 2;
  const claims = (rsu + psu + earnout + restricted) * value + m.options * callValue(value, m.option_strike, term, rf, s.volatility ?? m.option_volatility);
  if (!(Math.abs((pool - claims) / common - value) < 1e-8)) fail('Numerical domain or allocation failure; no valuation released');
  return finiteOutput({
    ...metadata, status: 'supported_conditional_at_annual_resolution', enterprise_value: enterprise, cash,
    equity_pool_before_awards: pool, existing_claims_value: claims, common_equity_value: pool - claims,
    common_shares: common, value_per_common_share: value, pv_terminal: pvTerminal,
    terminal_share_of_ev: pvTerminal / enterprise, terminal_reinvestment_rate: growth / s.terminal_roic,
    terminal_roic: s.terminal_roic, terminal_wacc: terminalWacc, terminal_growth: growth,
    expected_rsu_shares: rsu, expected_psu_shares: psu, expected_earnout_shares: earnout, remaining_option_term: term
  });
}
