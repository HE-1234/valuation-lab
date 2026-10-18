# English / Traditional Chinese

The requested language control is a small corner button, separate from navigation. It is positioned at the top-right with safe-area spacing and a 44-pixel target. Appearance has reserved space beside it; the language control is separate from the navigation. It shows the target language, 中文 or EN. Fresh visits remain in English; the selected language is remembered separately from valuation drafts.

## Presentation-only contract

- Locale changes update explicit text and accessibility bindings, not the financial model.
- Inputs, user notes, source URLs, tickers, numeric values, selected companies/years, Undo history, calculation timestamps and exports retain their original identities and values.
- Existing simulations continue; changing language is not a reason to generate a new seed or restart a run.
- Complete authored messages are translated. Parameter placeholders are checked for parity. There is no arbitrary substring translation of user content.
- Original research JSON, source records and frozen cases remain canonical. Separate catalogs provide Chinese analytical prose. Original quoted evidence, machine identifiers, file names and externally hosted source documents remain identifiable in their original form.
- Standalone research HTML uses reversible presentation annotations. Removing exactly those annotations reconstructs the original source bytes and pinned hashes. A new presentation manifest is separate from the frozen evidence manifest.

## Coverage

The dynamic valuation, simulation, learning and historical interfaces have bilingual catalogs and state-preservation tests. Company summaries, assumption rationales and methodology pages use separate prose overlays.

The standalone research corpus now covers all 26 inventoried pages and all 12,750 text segments: 11,294 Chinese translations and 1,456 reviewed preserved identifiers, formulas, names and original table evidence. Another 32 explicitly identified source-quotation nodes remain in their original language. These exceptions preserve evidence and are not translated analysis. Per-surface coverage files under `dist/locales/` and per-page source catalogs under `scripts/research-translations/` record the current state. External source documents and user-authored notes remain original. A fallback notice appears if a catalog cannot load, leaving original English research readable.

## Verification

Independent checks exercise all fourteen companies across repeated locale toggles, preserving stored state, numerical outputs, input/focus identity and simulation lifecycle. Dedicated tests cover selected option identities, changed dynamic parameters, detached bindings, faulty listeners and accessibility attributes. Native-browser and mobile-layout checks are recorded separately; static source-driven renders are labeled as approximations.

## Theme sweep

Explicit theme selections reveal the new palette with a 600 ms left-to-right screen sweep when the browser supports View Transitions. Rapid changes retain only the latest intent. Reduced-motion preferences and unsupported browsers use the existing instant switch. No palette, model assumption or source data is changed by the animation.

## Design study and application — 2026-10-18

Read W3C's [Language of Page explanation](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) (updated March 9, 2026). Its practical lesson is that a language switch must identify the document language for assistive technology, not merely replace visible words. Applied this to the existing locale lifecycle and extended the review to full margin-chart year descriptions and named theme controls. Tests check Chinese descriptions and English round trips without changing numeric paths.

Read MDN's [prefers-reduced-motion reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) (updated June 10, 2026). Large panning effects can cause discomfort; preserve an immediate palette switch when reduced motion is requested. The existing sweep retains this fallback and the approved six palettes. Native cloud-browser review captured the actual sweep; narrow-screen layout checks used static renders and do not substitute for native mobile-browser interaction testing.

These are accessible written reference lessons, not completed courses or watched videos. The changes refine the approved Annual Report design rather than replacing its layout or visual direction.

The requested [Awwwards Lusion v3 example](https://www.awwwards.com/sites/lusion-v3) could not be fetched during this review (timeout). No lesson or completion claim is attributed to inaccessible content. The accessible-source review instead identified a specific language-of-parts gap in retained English source quotations; quotation-specific language metadata was added and tested without altering the original evidence.
