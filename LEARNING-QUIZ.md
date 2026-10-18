# Random learning questions

Learn has a separate bilingual quiz bank. Each explicit Learn navigation click, including a click while Learn is already active, draws exactly ten questions. The New 10 questions button has the same effect. The original six adjustable examples remain in their own disclosure, with their own answers and settings. The earlier worked example and executable model checks are retained.

## Review and evidence

The content consists of original English and Simplified Chinese prompts, four stable option IDs, one correct option ID, option-specific feedback, an explanation, primary-source citations with section references, and an independent verification note. Structural checks require at least 100 distinct questions and reject duplicate IDs/prompts/options, missing translations, unsupported topic labels, invalid answer keys, unsafe/unapproved source hosts and malformed numeric verification metadata.

Structural validation does not prove financial correctness. Before the browser displays the bank, `learn-bank.js` requires a completed independent audit manifest that names every approved question ID and matches the SHA-256 of the exact bank file bytes. Missing files, incomplete review, mismatched IDs or a changed bank fail closed with a retry action. The six original examples remain available.

All question answers are educational examples under the stated assumptions. Source links identify underlying methodology; hypothetical arithmetic is independently checked. The question bank does not suggest trades or change company assumptions.

## Draw and persistence policy

- A Fisher–Yates shuffle supplies a versioned permutation and cursor. The full bank is consumed before a new cycle starts.
- A ten-question set never repeats a question, including at a cycle boundary when the bank size is not divisible by ten. Already drawn boundary items are delayed in the next cycle; the immediately preceding set is also delayed where possible.
- Storage uses only `valuation-lab-learning-deck-v1:<bank version>`. No model, research, simulation or saved-valuation keys are read or changed.
- A reload resumes deck progress. Opening a fresh document directly at `#learn` draws the next ten; Back/Forward within the existing document preserves its active questions and answers.
- Creating the workspace, visiting Studio, changing language, rendering, reviewing an answer, moving between questions and opening the six examples never consume cards.
- Invalid or incompatible saved permutations reset safely. Storage read/write failures use an in-memory fallback and show an accurate warning that reloads may repeat questions. The deck is browser-local, with no cross-device or simultaneous-tab synchronization promise.
- Option order is shuffled separately for each new set. A soft weighting favors less-used answer positions without promising a particular distribution. Answer correctness and feedback always follow stable option IDs rather than their displayed letters.

## Interaction and accessibility

Only the first answer to each question counts toward the set's score. Choosing an answer reveals the chosen option's feedback, correct answer, full explanation and source links. Previous/Next retain answers. Review returns to the first question without resetting scores; only an explicit new set resets answers.

Native buttons support Tab and Enter/Space. Arrow keys and Home/End move focus within the answer group without selecting an answer. Previous/Next, Review and the New 10 button focus the question heading. If its prompt is outside the usable viewport, only the whole document moves enough to reveal it, respecting the sticky header; an already visible prompt keeps its scroll position. Answer feedback and language changes do not scroll. Persistent polite live regions report answer feedback and new sets. Language switches update text without replacing focused answer controls, questions, answers or option order. The approved six-theme tokens and natural whole-page scrolling remain in use.

## Verification

`tests/learn-random-quiz.test.mjs` covers schema/source validation, byte-bound review loading, deterministic shuffling, full-cycle and non-multiple-of-ten boundaries, reloads, corrupt storage, blocked reads/writes, bank versions, option/feedback identity, first-answer scoring, locale/focus preservation, navigation/review, stale handlers, mount cleanup, lazy loading, repeated activation during asynchronous loading, exact-once Learn navigation and separation from valuation modules. The original six-example and bilingual suites remain unchanged.

These are pure-function, source-contract and synthetic-DOM checks. They do not establish real-browser paint, native touch, screen-reader announcement timing or device-level accessibility. No Monte Carlo process, valuation engine, company data, model draft or research preset is changed by the Learn feature.
