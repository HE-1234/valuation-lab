# Uber v2 change record

Research cutoff: 19 October 2026. v1 and its review artifacts remain preserved. No canonical edits or publication.

## Source corrections

1. Corrected September 4,500 EURm from the mistaken gross-proceeds label to principal. Added public pricing, known issue discount of 10.6925, underwriting discounts of 24.875, issuer proceeds before other expenses of 4,464.4325 and issuer-estimated net proceeds of approximately 4,453. Actual net cash remains unverified.
2. Corrected Getir perimeter: food business control plus minority grocery interest for approximately 465 USDm. The optional bridge values the two separately.
3. Added the December 2026 maturity of June's 2,000 USDm term loan and August 2 expiry of any undrawn capacity. No additional debt deduction is made for the same loan.
4. Stated that the June investment illustration omits other derivative assets of 147 USDm, including 136 embedded, rather than implying the investment asset list exhausts every financial asset.

New primary evidence: September 9 pricing FWP, September 9 underwriting agreement filed September 15, and final prospectus filed September 11. URLs, dates and retained-evidence hashes are in the source ledgers. The final prospectus estimate is not promoted to an exact realized cash fact.

## Model corrections

- Economic interim FCFF used in EV runoff is separated from actual cash through an explicit signed operating reconciliation.
- Signed nonoperating cash and cash FX fields allow investment/ESPP/options receipts and currency changes without altering operating EV incorrectly.
- Retained EUR note cash is retranslated at current FX alongside debt; conversion/disposition remains an explicit assumption.
- Known issue and underwriting discounts are fixed; the expense input cannot waive or double-count them.
- Getir/Careem/Blacklane have named operating EV, cash, debt, NCI and other-claim entries. Getir grocery is an investment asset.
- Careem removal is tied to the component included in the selected June allocation; illustration 117.6, not unadjusted book147.
- Current inherited claims, current operating cash reserve and preexisting debt marks are explicit assumptions, including when unchanged.
- October ownership requires integer shares. The reported June cash anchor is explicitly frozen at5,391; changing it cannot be silently ignored.
- Reject unknown inherited-claim keys and negative residual legacy debt/investment balances before adding new financing or acquired assets.
- Added focused tests for known financing costs, retained-cash FX, nonoperating cash, deal/claim pairing, input completeness and invalid inputs.

## Unchanged economics and status

The June annual operating model, all 30 forecast rows, terminal calculations, three operating EVs and three illustrative June allocations are numerically unchanged from v1. The added Careem subcomponent is descriptive within the existing investment total and does not add value. Historical reported values remain unchanged.

Independent v1 review reproduced June arithmetic and identified optional October corrections. v2 author checks do not substitute for independent v2 review, resolve unknown claims/current cash, or authorize current-equity admission. Default equity and October policies remain unselected; the explicitly named June illustration remains available. No market price or target is used.
