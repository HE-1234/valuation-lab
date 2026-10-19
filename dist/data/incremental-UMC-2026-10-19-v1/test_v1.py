import json,pathlib,copy,unittest
from replay_v1 import replay,domestic_schedule
P=pathlib.Path(__file__).parent;X=json.loads((P/'dcf-inputs-v1.json').read_text());PS=json.loads((P/'analyst-policy-examples-v1.json').read_text())['policies'];D=json.loads((P/'capital-claims/funding-inputs-v1.json').read_text())
class Tests(unittest.TestCase):
 def test_saved_replay(self):
  old=json.loads((P/'dcf-output-v1.json').read_text())['examples']
  self.assertEqual(old,[replay(X,p,D) for p in PS])
 def test_current_and_selected_null(self):
  for p in PS:
   y=replay(X,p,D);self.assertIsNone(y['selected_policy']);self.assertIsNone(y['current_target'])
   for s in y['scenarios'].values():self.assertIsNone(s['current_target'])
 def test_gate(self):
  for p in PS:
   for r in replay(X,p,D)['scenarios'].values():self.assertEqual(r['conditional_usd_per_ads'] is not None,r['funding']['minimum_available_liquidity']>=0 and r['equity_value_twd_m']>0)
 def test_currency(self):
  for r in replay(X,PS[2],D)['scenarios'].values():self.assertAlmostEqual(r['conditional_usd_per_ads'],r['conditional_twd_per_ordinary']*5/31.837)
 def test_exact_shares_and_authorization(self):
  y=replay(X,PS[2],D)
  for r in y['scenarios'].values():self.assertAlmostEqual(r['ordinary_share_denominator_m'],(12576984870-30551000)/1e6+67)
 def test_no_circular_shortcut(self):
  p=copy.deepcopy(PS[2]);p['nonoperating_equity_value_assigned']=1
  with self.assertRaises(AssertionError):replay(X,p,D)
 def test_no_mixed_fx_date(self):
  x=copy.deepcopy(X);x['fx_date']='2026-10-16'
  with self.assertRaises(AssertionError):replay(x,PS[2],D)
 def test_debt_once(self):
  for p in PS:
   for r in replay(X,p,D)['scenarios'].values():
    paid=r['funding']['bank_principal_reserved']+r['funding']['novatek_redemption_reserved']+sum(v['bank_principal_payment']+v['domestic_bond_principal'] for v in r['rows']);self.assertAlmostEqual(paid,57557.436)
 def test_reserve_equity_invariance(self):
  a=replay(X,PS[0],D);b=replay(X,PS[2],D)
  for n in a['scenarios']:self.assertEqual(a['scenarios'][n]['equity_value_twd_m'],b['scenarios'][n]['equity_value_twd_m'])
 def test_claim_hits_cash_and_equity(self):
  p=copy.deepcopy(PS[2]);a=replay(X,p,D);p['supplemental_senior_cash_claim']=1000;b=replay(X,p,D)
  for n in a['scenarios']:
   self.assertAlmostEqual(a['scenarios'][n]['equity_value_twd_m']-b['scenarios'][n]['equity_value_twd_m'],1000)
   self.assertAlmostEqual(a['scenarios'][n]['funding']['initial_available_liquidity']-b['scenarios'][n]['funding']['initial_available_liquidity'],1000)
 def test_extra_operating_cash_once(self):
  p=copy.deepcopy(PS[2]);a=replay(X,p,D);p['supplemental_operating_cash_by_year'][0]=1000;b=replay(X,p,D)
  for n in a['scenarios']:
   self.assertAlmostEqual(a['scenarios'][n]['enterprise_value_twd_m']-b['scenarios'][n]['enterprise_value_twd_m'],1000/(1+X['scenarios'][n]['wacc']))
   self.assertAlmostEqual(a['scenarios'][n]['rows'][0]['ending_available_liquidity']-b['scenarios'][n]['rows'][0]['ending_available_liquidity'],1000)
 def test_lease_persists_terminal(self):
  p=copy.deepcopy(PS[2]);a=replay(X,p,D);p['lease_cash_by_year']=[v+1000 for v in p['lease_cash_by_year']];b=replay(X,p,D)
  for n in a['scenarios']:self.assertGreater(a['scenarios'][n]['terminal']['value'],b['scenarios'][n]['terminal']['value'])
 def test_deposits_not_initial_cash(self):
  a=replay(X,PS[2],D)
  for r in a['scenarios'].values():self.assertAlmostEqual(sum(v['time_deposit_cash_conversion'] for v in r['rows']),22135.867)
 def test_no_free_dilution(self):
  p=copy.deepcopy(PS[2]);a=replay(X,p,D);p['authorized_2026_award_issuance_fraction']=0;b=replay(X,p,D)
  for n in a['scenarios']:self.assertGreater(b['scenarios'][n]['conditional_twd_per_ordinary'],a['scenarios'][n]['conditional_twd_per_ordinary'])
 def test_terminal_reinvestment(self):
  for p in PS:
   for r in replay(X,p,D)['scenarios'].values():self.assertLessEqual(r['terminal']['fcff'],min(r['terminal']['roic_limited_fcff'],r['terminal']['runrate_limited_fcff']))
if __name__=='__main__':unittest.main()
