# Test resource policy

- Prefer `npm run test:files -- <explicit test files>` for changes with a narrow scope.
- Use `npm test` only when broad changes justify the full suite or the user requests it. Do not rerun the full suite merely to commit, push, or publish unchanged, already-tested files.
- Both npm commands run one test file at a time, set a 2 GiB V8 old-space heap limit per process, and use a 120-second test timeout. Total RAM can exceed the heap limit.
- Never run overlapping test commands. Do not use bare `node --test` or silently increase concurrency, heap limits, or timeouts.
- Reuse completed results when the tested files and relevant environment are unchanged. Report failures and incomplete runs accurately; do not treat them as passes.
- For publishing, verify the deployed page and relevant interactions instead of automatically repeating every historical release check.
