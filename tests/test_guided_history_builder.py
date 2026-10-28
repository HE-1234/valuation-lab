"""Financial-data regressions: unknown amounts and fiscal-year denominators."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('guided_builder', Path(__file__).resolve().parents[1] / 'scripts/build-guided-reviewed-cases.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def fact(value, end, tag='us-gaap:TestFact'):
    return {'value': value, 'tag': tag, 'periodEnd': end, 'filed': '2026-08-01',
            'sourceUrl': 'https://www.sec.gov/Archives/example.htm', 'accession': 'example'}


def row(year, start, end, debt=20, pretax=10, tax=2):
    values = {'revenue': 100 + year - 2024, 'operatingIncome': 20,
              'bookEquity': 100, 'cashAndEquivalents': 10,
              'pretaxIncome': pretax, 'incomeTaxExpense': tax}
    return {'period': f'FY{year}', 'periodStart': start, 'periodEnd': end,
            'facts': {k: builder.history_fact(fact(v, end), k, 'USD', end, start) for k, v in values.items()},
            'metrics': {}, '_capitalSource': {'mappedDebt': fact(debt, end)}}


def build(rows):
    entry = {'annual': rows, 'baseObservation': None}
    builder.add_capital_history('TEST', entry, 'USD')
    return entry


class GuidedHistoryTest(unittest.TestCase):
    def test_missing_debt_cannot_become_zero_or_a_capital_ratio(self):
        result = build([row(2025, '2024-07-01', '2025-06-30', debt=None)])['annual'][0]
        self.assertIsNone(result['facts']['mappedDebt']['value'])
        self.assertIsNone(result['facts']['bookCapitalProxy']['value'])
        self.assertIsNone(result['metrics']['bookSalesCapitalProxy']['value'])
        self.assertTrue(result['metrics']['bookSalesCapitalProxy']['reason'])

    def test_prior_capital_uses_actual_noncalendar_fiscal_end(self):
        rows = build([row(2024, '2023-07-01', '2024-06-30'), row(2025, '2024-07-01', '2025-06-30')])['annual']
        metric = rows[-1]['metrics']['bookROICProxy']
        self.assertEqual(metric['priorPeriodEnd'], '2024-06-30')
        self.assertAlmostEqual(metric['value'], 16 / 110)
        self.assertEqual(metric['availableFrom'], '2026-08-01')

    def test_missing_fiscal_year_cannot_create_yoy_or_beginning_capital(self):
        rows = build([row(2023, '2022-07-01', '2023-06-30'), row(2025, '2024-07-01', '2025-06-30')])['annual']
        for key in ('growth', 'incrementalBookSalesCapitalProxy', 'bookROICProxy'):
            self.assertIsNone(rows[-1]['metrics'][key]['value'], key)
            self.assertTrue(rows[-1]['metrics'][key]['reason'], key)

    def test_tax_benefit_visible_but_not_used_for_roic(self):
        rows = build([row(2024, '2023-07-01', '2024-06-30'), row(2025, '2024-07-01', '2025-06-30', tax=-1)])['annual']
        self.assertEqual(rows[-1]['metrics']['effectiveTaxRate']['value'], -.1)
        self.assertFalse(rows[-1]['metrics']['effectiveTaxRate']['rangeEligible'])
        self.assertIsNone(rows[-1]['metrics']['bookROICProxy']['value'])

    def test_source_date_and_url_survive_without_verification_upgrade(self):
        evidence = fact(12, '2025-06-30')
        normalized = builder.history_fact(evidence, 'bookEquity', 'USD', '2025-06-30')
        self.assertEqual(normalized['filedAt'], evidence['filed'])
        self.assertEqual(normalized['sourceUrl'], evidence['sourceUrl'])
        self.assertFalse(normalized['originalDocumentVerified'])


if __name__ == '__main__':
    unittest.main()
