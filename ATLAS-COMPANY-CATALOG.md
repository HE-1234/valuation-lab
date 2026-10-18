# Atlas company directory

The directory is additive to the fourteen frozen/reviewed Annual cases. It does not extend the financial engine's supported issuer set, weaken claims gates, or change existing draft IDs, currencies, source packages or storage keys.

## Scope

The Atlas inventory names 132 entities. Twelve overlap existing reviewed companies; Apple and Tesla remain available independently. Current verification produces 99 additional listed securities and 20 coverage-only entities. Anysphere/Cursor merges into the SpaceX listing as a sourced subsidiary alias, so it does not create a duplicate security. Sumitomo and Wonik remain coverage-only because the Atlas shorthand does not uniquely identify the intended issuer.

The directory contains identity evidence, native ticker strings, provider-style input notation, exchange, security class, dated source links and explicit unknowns. Quote currency and reporting currency are separate fields; missing currency is null. No quote feed or provider API compatibility is implied. Primary source verification is bounded by each row's actual evidence; no live-price or valuation verification is claimed.

## Readiness boundary

Existing Annual cases use the unchanged reviewed package and gates. A verified new listing opens an identity-only Research pending screen. Financial anchors, comparable history, company-specific operating assumptions, capital claims and model/uncertainty review must be completed before valuation. No generic draft, numerical valuation, chart, assumptions editor or Monte Carlo panel is created.

Selection clears the previous draft/company references, releases the old simulation and increments its cancellation generation, destroys old evidence/motion and replaces the old workspace. Late simulation callbacks are ignored. Returning to a reviewed company restores its existing draft. New directory failure is isolated; the optional request aborts after three seconds and the original fourteen remain available.

Search matches company names, symbols and explicit aliases. Listed parent exposure is labelled in source notes. Unlisted, ambiguous or unresolved entities are separate coverage disclosures, never selectable proposed tickers. Native identifiers preserve leading zeroes.

## Build and review

Run `node scripts/build-atlas-company-catalog.mjs /path/to/atlas-research` from the repository root. The builder reads the inventory and only the primary verification files ending in `-verified.json`. It never performs network requests or writes frozen research. Missing/incomplete/unverified rows remain in coverage disclosure. Synthetic fixtures exist only in tests.

Presentation inherits the approved Annual typography, themes and document flow. English and Simplified Chinese status/controls are explicit. Source evidence and legal issuer names remain in their original language. No subsection scrolling is introduced.

Focused synthetic-DOM tests cover readiness transitions, absence of stale values, released simulation callbacks, unchanged saved cases, search/aliases, leading zeroes, invalid security metadata, fetch isolation/timeouts and bilingual controls. Synthetic-DOM tests do not establish native-browser rendering, accessibility-tree, touch or screen-reader behavior. The parent owns final publication and browser checks.

## Authored prose localization

The exact-source-keyed Simplified Chinese overlay covers all 99 listing evidence paragraphs and mapping notes, all 20 coverage reasons, every exchange/security classification label, and the authored qualifiers in coverage entity names. The original English evidence, source URLs, dates, legal names and identifiers remain unchanged in the identity artifact. Translated prose is a display overlay, not a quotation from an external source. The build rejects any missing or stale authored-prose translation instead of silently falling back to English. Source documents themselves are not translated by this directory.

The authored map is `scripts/atlas-catalog-zh-Hans.json`; the builder emits `dist/locales/company-catalog.js`. Locale changes update bound spans without rewriting the financial state or requiring shared workspace/simulation changes.
