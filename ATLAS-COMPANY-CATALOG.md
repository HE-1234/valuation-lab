# Atlas company directory

The directory is additive to the fourteen frozen/reviewed Annual cases. It does not extend the financial engine's supported issuer set, weaken claims gates, or change existing draft IDs, currencies, source packages or storage keys.

## Scope

The active directory contains 45 additional US-exchange-listed securities. Every addition has independently verified Nasdaq/NYSE security identity and an individually opened official Robinhood page advertising buy/sell or trading, checked October 18, 2026. Original 14 reviewed cases remain unchanged. Foreign issuer nationality is not an exclusion: US ADRs and registered ordinary shares such as BABA, UMC, ASX, ARM, SAP and ASML remain eligible. ASML is registered ordinary shares, not an ADR.

The narrower directory excludes 54 foreign-exchange-only security records and 20 private or unresolved coverage names. They do not appear in the selector, search or a coverage panel. No OTC or alternative ticker is inferred. Source inventories and mixed verification records remain separate research inputs; an exclusion manifest records this scope change.

Public Robinhood support is not account-specific eligibility, live tradeability, fractional-share availability or an authorization to trade. A missing or ambiguous broker-support record holds a new company out. No prices are copied from the public pages. Quote currency and reporting currency remain separate; unknown currencies remain null.

## Readiness boundary

Existing Annual cases use the unchanged reviewed package and gates. A verified new listing opens an identity-only Research pending screen. Financial anchors, comparable history, company-specific operating assumptions, capital claims and model/uncertainty review must be completed before valuation. No generic draft, numerical valuation, chart, assumptions editor or Monte Carlo panel is created.

Selection clears the previous draft/company references, releases the old simulation and increments its cancellation generation, destroys old evidence/motion and replaces the old workspace. Late simulation callbacks are ignored. Returning to a reviewed company restores its existing draft. New directory failure is isolated; the optional request aborts after three seconds and the original fourteen remain available.

Search matches only active company names, symbols and explicit aliases. Listed parent exposure is labelled in source notes. Runtime filtering also prevents a stale broad directory from reintroducing foreign-only or unverified securities. An excluded saved selection safely returns to an original reviewed company without changing saved annual inputs.

## Build and review

Run `node scripts/build-atlas-company-catalog.mjs /path/to/atlas-research` from the repository root. The builder reads the inventory and only the primary verification files ending in `-verified.json`. It never performs network requests or writes frozen research. The build consumes the separately captured official broker evidence in `scripts/robinhood-us-public-support-2026-10-18.json`; missing/incomplete/unverified rows stay out of the app. Synthetic fixtures exist only in tests.

Presentation inherits the approved Annual typography, themes and document flow. English and Simplified Chinese status/controls are explicit. Source evidence and legal issuer names remain in their original language. No subsection scrolling is introduced.

Focused synthetic-DOM tests cover readiness transitions, absence of stale values, released simulation callbacks, unchanged saved cases, search/aliases, leading zeroes, invalid security metadata, fetch isolation/timeouts and bilingual controls. Synthetic-DOM tests do not establish native-browser rendering, accessibility-tree, touch or screen-reader behavior. The parent owns final publication and browser checks.

## Authored prose localization

The exact-source-keyed Simplified Chinese overlay covers all 45 active listing evidence paragraphs and mapping notes and every active exchange/security classification label. The original English evidence, source URLs, dates, legal names and identifiers remain unchanged for retained securities. Only the active directory translations are emitted into the app; the shared authoring map remains a separate research input. Translated prose is a display overlay, not a quotation from an external source. The build rejects any missing or stale authored-prose translation instead of silently falling back to English. Source documents themselves are not translated by this directory.

The authored map is `scripts/atlas-catalog-zh-Hans.json`; the builder emits `dist/locales/company-catalog.js`. Locale changes update bound spans without rewriting the financial state or requiring shared workspace/simulation changes.
