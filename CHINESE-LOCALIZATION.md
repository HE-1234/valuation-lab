# English / Traditional Chinese

The requested language control is a small corner button, separate from navigation. It is positioned at the top-right with safe-area spacing and a 44-pixel target. Appearance has reserved space beside it; the language control is separate from the navigation. It shows the target language, 中文 or EN. Fresh visits remain in English; the selected language is remembered separately from valuation drafts.

## Presentation-only contract

- Locale changes update explicit text and accessibility bindings, not the financial model.
- Inputs, user notes, source URLs, tickers, numeric values, selected companies/years, Undo history, calculation timestamps and exports retain their original identities and values.
- Existing simulations continue; changing language is not a reason to generate a new seed or restart a run.
- Complete authored messages are translated. Parameter placeholders are checked for parity. There is no arbitrary substring translation of user content.
- Original research JSON, source records and frozen cases remain canonical. Separate catalogs provide Chinese analytical prose. Original quoted evidence, machine identifiers, file names and externally hosted source documents remain identifiable in their original form.
- Standalone research HTML uses reversible presentation annotations. Removing exactly those annotations reconstructs the original source bytes and pinned hashes. A new presentation manifest is separate from the frozen evidence manifest.

## Coverage and unfinished work

The dynamic valuation, simulation, learning and historical interfaces have bilingual catalogs and state-preservation tests. Company summaries, assumption rationales and methodology pages use separate prose overlays.

The large standalone research corpus is being translated in reviewed batches. A Chinese-mode notice identifies pages with untranslated authored passages, which remain in English until their exact translation is available. The existence of the button is not a claim that the entire research corpus is complete. Per-surface coverage files under `dist/locales/` and per-page source catalogs under `scripts/research-translations/` record the current state.

## Verification

Independent checks exercise all fourteen companies across repeated locale toggles, preserving stored state, numerical outputs, input/focus identity and simulation lifecycle. Dedicated tests cover selected option identities, changed dynamic parameters, detached bindings, faulty listeners and accessibility attributes. Native-browser and mobile-layout checks are recorded separately; static source-driven renders are labeled as approximations.

## Theme sweep

Explicit theme selections reveal the new palette with a 600 ms left-to-right screen sweep when the browser supports View Transitions. Rapid changes retain only the latest intent. Reduced-motion preferences and unsupported browsers use the existing instant switch. No palette, model assumption or source data is changed by the animation.
