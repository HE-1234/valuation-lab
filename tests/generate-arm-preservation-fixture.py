#!/usr/bin/env python3
"""Freeze reviewed insertion-only ARM production changes against immutable exactV72.

This is deliberately separate from test execution. Run only after reviewing the
ARM additions; it refuses source deletions/replacements and never regenerates
old-company output goldens.
"""
from pathlib import Path
import difflib
import hashlib
import io
import json
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '508c24877a26987b905fee55ad45ac764b83c184'
GOLDEN_SHA256 = 'aa75ddae44dcc2c10c37ae73f81fc0637123bdb0b386e86fea9cfac795f01b49'
sha = lambda data: hashlib.sha256(data).hexdigest()
git = lambda *args: subprocess.check_output(['git', '-C', str(ROOT), *args])
tracked = git('ls-tree', '-r', '--name-only', BASELINE).decode().splitlines()
assert len(tracked) == 1140
archive = tarfile.open(fileobj=io.BytesIO(git('archive', BASELINE, 'dist')))
before = {entry.name: archive.extractfile(entry).read() for entry in archive if entry.isfile()}
assert len(before) == 603
output_goldens = ROOT / 'tests/fixtures/arm-v72-output-goldens.json'
assert sha(output_goldens.read_bytes()) == GOLDEN_SHA256, 'Immutable exactV72 output goldens changed'
fixture = {
    'baselineCommit': BASELINE,
    'baselineTrackedCount': len(tracked),
    'outputGoldensSHA256': GOLDEN_SHA256,
    'baselineProduction': {path: sha(data) for path, data in sorted(before.items())},
    'files': {},
    'additions': {},
}
for path, original in sorted(before.items()):
    current = (ROOT / path).read_bytes()
    if current == original:
        continue
    old, new = original.decode('utf-8'), current.decode('utf-8')
    insertions = []
    for kind, i, end_i, j, end_j in difflib.SequenceMatcher(None, old, new, autojunk=True).get_opcodes():
        assert kind in ('equal', 'insert'), f'{path}: non-insertion change {kind} at {i}:{end_i}'
        if kind == 'insert':
            # JavaScript slices UTF-16 code units, which may differ from Python
            # character positions when pre-existing text contains astral symbols.
            offset = len(new[:j].encode('utf-16-le')) // 2
            insertions.append({'offset': offset, 'text': new[j:end_j]})
    restored = new
    # Reverse in Python code points solely to independently verify reconstruction.
    for kind, i, end_i, j, end_j in reversed(difflib.SequenceMatcher(None, old, new, autojunk=True).get_opcodes()):
        if kind == 'insert':
            restored = restored[:j] + restored[end_j:]
    assert restored.encode('utf-8') == original, f'{path}: insertion reversal failed'
    fixture['files'][path] = {'beforeSHA256': sha(original), 'afterSHA256': sha(current), 'insertions': insertions}
for file in sorted((ROOT / 'dist').rglob('*')):
    if file.is_file():
        path = file.relative_to(ROOT).as_posix()
        if path not in before:
            assert path.startswith('dist/arm-') or path.startswith('dist/data/incremental-ARM-2026-10-19-v2/'), f'Unrelated production addition: {path}'
            assert '/raw/' not in path and '/transcripts/' not in path, f'Raw source addition: {path}'
            fixture['additions'][path] = sha(file.read_bytes())
target = ROOT / 'tests/fixtures/arm-integration-v73.json'
target.write_text(json.dumps(fixture, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'baselineProduction': len(before), 'modifiedFiles': len(fixture['files']), 'insertions': sum(len(f['insertions']) for f in fixture['files'].values()), 'additions': len(fixture['additions']), 'fixtureSHA256': sha(target.read_bytes())}))
