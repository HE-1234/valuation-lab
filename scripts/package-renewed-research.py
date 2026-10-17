#!/usr/bin/env python3
"""Build a deterministic, public-source evidence package from the frozen review.

No network access, source writes, model recalculation or external dependencies.
Only this package's output directory is written. Numerical values are copied.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

AS_OF = "2026-10-17"
FROZEN_VERSION = "cd77a567cfaf77e98567cf772b70c6bb858c0cda"
EXECUTABLE_HASH = "02c8e133893cff642369ba58d29b7e5ad091c204e08a6b37acbff28f13072bd2"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT.parent / "company-forecast-research"
DEFAULT_OUTPUT = ROOT / "dist/data/renewed-research-2026-10-17"
COMPANY_SECTIONS = {
    "facts.json": "facts", "guidance-track-record.json": "guidance",
    "management-capabilities.json": "management", "source-ledger.json": "sources",
    "proposed-assumptions.json": "judgment", "dossier.md": "dossier",
}
SKIP_KEYS = {
    "localEvidence", "localCache", "localPath", "localSourcePath", "source_cache",
    "cache_path", "retrieval_metadata", "retrievalMetadata", "localReference",
    "existingSnapshotPath", "repository", "repositoryPath", "workspacePath",
}
URL_RE = re.compile(r"https?://[^\s<>\[\]`\"']+")
FILE_RE = re.compile(r"(?<![\w:/])(?:\.{1,2}/)*(?:[\w.-]+/)*[\w.-]+\.(?:json|md|txt|html?|pdf|py|mjs)(?:#[^\s),;`]+)?")
ABS_PATH_RE = re.compile(r"(?:file://)?/(?:workspace|home|tmp|Users|mnt|private)/[^\s`\"<>),;]+")
FORBIDDEN_RE = re.compile(r"/workspace/|/home/|/tmp/|file://|\.git/|__pycache__|sk-[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def dump(value) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n"


def slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "-", value).strip("-")


def label(value: str) -> str:
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", value).replace("_", " ").replace("-", " ")


class Package:
    def __init__(self, source: Path):
        self.source = source
        self.inputs = {}
        self.targets = {}
        self.artifact_ids = {}
        self.by_basename = {}
        self.originals = {}
        self.reference_selectors = {}

    def register(self, relative: str, artifact_id: str, target: str):
        path = self.source / relative
        if not path.is_file():
            return
        data = path.read_bytes()
        self.inputs[artifact_id] = {
            "id": artifact_id, "originalName": path.name,
            "sha256": sha(data), "bundleTarget": target,
        }
        self.targets[relative] = target
        self.artifact_ids[relative] = artifact_id
        self.by_basename.setdefault(path.name, []).append(relative)
        self.originals[relative] = json.loads(data) if path.suffix == ".json" else data.decode()

    def resolve(self, reference: str, ticker: str | None = None) -> str:
        # Links resolve to bundled research, never to a research-machine path.
        reference = reference.rstrip(".")
        path, _, selector = reference.partition("#")
        path = path.replace(str(self.source) + "/", "").removeprefix("./")
        while path.startswith("../"):
            path = path[3:]
        candidate = path
        if candidate not in self.targets and ticker:
            candidate = f"companies/{ticker}/{Path(path).name}"
        if candidate not in self.targets:
            candidates = self.by_basename.get(Path(path).name, [])
            candidate = candidates[0] if len(candidates) == 1 else ""
        target = self.targets.get(candidate)
        if target:
            if selector:
                # Preserve the exact original record selector as readable provenance.
                key = sha((self.artifact_ids[candidate] + "#" + selector).encode())[:16]
                self.reference_selectors[key] = {
                    "artifactId": self.artifact_ids[candidate], "recordSelector": selector,
                    "bundleTarget": target,
                }
                base, _, fragment = target.partition("#")
                target = f"{base}?record={quote(selector, safe='')}#{fragment}"
            return target
        # A raw local filing/cache is not published. Its public source/read scope
        # remains in the corresponding ledger, with a stable link to that ledger.
        return f"evidence-{ticker}.html#sources" if ticker else "dossiers.html#source-policy"

    def text(self, value: str, ticker: str | None = None) -> str:
        # Shield verified public URLs from filename rewriting.
        urls = []
        def shield(match):
            urls.append(match.group())
            return f"\x00URL{len(urls)-1}\x00"
        value = URL_RE.sub(shield, value)
        value = ABS_PATH_RE.sub(lambda m: self.resolve(m.group(), ticker), value)
        # Shield already translated bundle links, too.
        links = []
        def shield_link(match):
            links.append(match.group())
            return f"\x00LINK{len(links)-1}\x00"
        value = re.sub(r"(?:evidence-[A-Z]+|dossiers)\.html(?:\?[^\s<>()`]+)?#[\w-]+", shield_link, value)
        value = FILE_RE.sub(lambda m: self.resolve(m.group(), ticker), value)
        for i, link in enumerate(links):
            value = value.replace(f"\x00LINK{i}\x00", link)
        for i, url in enumerate(urls):
            value = value.replace(f"\x00URL{i}\x00", url)
        # These words describe source scope; avoid exposing packaging operations.
        value = value.replace("local source/cache path where available", "source provenance where available")
        return value

    def clean(self, value, ticker: str | None = None):
        if isinstance(value, dict):
            ticker = value.get("ticker", ticker)
            result = {}
            for key, item in value.items():
                if key in SKIP_KEYS:
                    continue
                if key == "inputHashesSHA256":
                    result[key] = {self.artifact_ids.get(p, "input-" + sha(p.encode())[:16]): digest for p, digest in item.items()}
                else:
                    # Old data dictionaries can themselves use artifact filenames.
                    clean_key = self.artifact_ids.get(key, key)
                    if "/" in clean_key or clean_key.endswith((".json", ".md")):
                        clean_key = slug(Path(clean_key).stem)
                    result[clean_key] = self.clean(item, ticker)
            return result
        if isinstance(value, list):
            return [self.clean(item, ticker) for item in value]
        if isinstance(value, str):
            return self.text(value, ticker)
        return value

    def get(self, relative: str, ticker: str | None = None):
        return self.clean(self.originals[relative], ticker)


def link(href: str, text: str) -> str:
    parsed = urlsplit(href)
    if parsed.scheme not in ("", "http", "https"):
        return html.escape(text)
    attrs = ' rel="noopener noreferrer"' if parsed.scheme else ""
    return f'<a href="{html.escape(href, quote=True)}"{attrs}>{html.escape(text)}</a>'


def inline(text: str) -> str:
    # Deliberately small, safe Markdown renderer: no arbitrary HTML or scripts.
    tokens = []
    def save(rendered):
        tokens.append(rendered)
        return f"\x00TOKEN{len(tokens)-1}\x00"
    text = re.sub(r"\[([^\]]+)\]\(([^\s]+)\)", lambda m: save(link(m[2], m[1])), text)
    text = re.sub(r"(?:https?://[^\s<>`]+|(?:evidence-[A-Z]+|dossiers)\.html(?:\?[^\s<>()`]+)?#[\w-]+)",
                  lambda m: save(link(m[0].rstrip(".,;"), m[0].rstrip(".,;"))) + m[0][len(m[0].rstrip('.,;')):], text)
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    for i, rendered in enumerate(tokens):
        text = text.replace(f"\x00TOKEN{i}\x00", rendered)
    return text


def markdown(text: str, prefix: str) -> str:
    lines = text.splitlines()
    out, i = [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        heading = re.match(r"^(#{1,6})\s+(.+)", line)
        if heading:
            level = min(6, len(heading[1]) + 2)
            out.append(f'<h{level} id="{prefix}-{i}">{inline(heading[2])}</h{level}>')
            i += 1
        elif line.startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|?\s*$", lines[i+1]):
            cells = lambda s: [x.strip() for x in s.strip().strip("|").split("|")]
            headers = cells(line)
            out.append('<div class="table-scroll" tabindex="0" role="region" aria-label="Research table"><table><thead><tr>' + ''.join(f'<th scope="col">{inline(x)}</th>' for x in headers) + '</tr></thead><tbody>')
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                out.append('<tr>' + ''.join(f'<td>{inline(x)}</td>' for x in cells(lines[i])) + '</tr>')
                i += 1
            out.append('</tbody></table></div>')
        elif re.match(r"^(?:[-*]|\d+\.)\s+", line):
            ordered = bool(re.match(r"^\d+\.", line))
            tag = "ol" if ordered else "ul"
            out.append(f'<{tag}>')
            while i < len(lines) and re.match(r"^(?:[-*]|\d+\.)\s+", lines[i].strip()):
                out.append('<li>' + inline(re.sub(r"^(?:[-*]|\d+\.)\s+", "", lines[i].strip())) + '</li>')
                i += 1
            out.append(f'</{tag}>')
        elif re.match(r"^[-*_]{3,}$", line):
            out.append('<hr>')
            i += 1
        else:
            para = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r"^(?:#|\||[-*]\s|\d+\.\s)", lines[i].strip()):
                para.append(lines[i].strip())
                i += 1
            out.append('<p>' + inline(' '.join(para)) + '</p>')
    return '\n'.join(out)


def render_value(value, depth=0) -> str:
    if isinstance(value, dict):
        if not value:
            return '<span class="muted">No entries</span>'
        result = ['<dl class="record">']
        for key, item in value.items():
            result.append(f'<dt>{html.escape(label(key))}</dt><dd>')
            if isinstance(item, (dict, list)) and item:
                result.append(f'<details{" open" if depth < 1 else ""}><summary>{html.escape(label(key))} · {len(item)} {"fields" if isinstance(item, dict) else "records"}</summary>{render_value(item, depth+1)}</details>')
            else:
                result.append(render_value(item, depth+1))
            result.append('</dd>')
        result.append('</dl>')
        return ''.join(result)
    if isinstance(value, list):
        if not value:
            return '<span class="muted">No entries</span>'
        # Flat scalar records become semantic tables; nested records stay legible.
        if all(isinstance(x, dict) for x in value):
            keys = list(dict.fromkeys(k for item in value for k in item))
            if len(keys) <= 10 and all(not isinstance(v, (dict, list)) for x in value for v in x.values()):
                return '<div class="table-scroll" tabindex="0" role="region" aria-label="Evidence records"><table><thead><tr>' + ''.join(f'<th scope="col">{html.escape(label(k))}</th>' for k in keys) + '</tr></thead><tbody>' + ''.join('<tr>'+''.join(f'<td>{render_value(item.get(k), depth+1)}</td>' for k in keys)+'</tr>' for item in value) + '</tbody></table></div>'
        return '<ol class="records">' + ''.join('<li>' + render_value(item, depth+1) + '</li>' for item in value) + '</ol>'
    if value is None:
        return '<span class="muted">Not specified / unresolved (null)</span>'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return f'<span class="number">{html.escape(str(value))}</span>'
    return inline(str(value))


CSS = """
:root{color-scheme:light;--paper:#f3f6fb;--surface:#fff;--ink:#192c4e;--muted:#52617a;--accent:#2154ba;--line:#d8e1ee;--wash:#eaf0fa}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:1rem}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1140px;margin:auto;padding:2.5rem 1.25rem 5rem}a{color:var(--accent);text-underline-offset:3px;overflow-wrap:anywhere}a:hover{text-decoration-thickness:2px}a:focus-visible,summary:focus-visible,.table-scroll:focus-visible{outline:3px solid var(--accent);outline-offset:4px}h1,h2,h3,h4{line-height:1.2;letter-spacing:-.025em}h1{font-size:clamp(2.2rem,5vw,4rem);max-width:20ch}h2{font-size:2rem}h3{font-size:1.4rem;margin-top:2rem}h4{font-size:1.15rem}p,li{max-width:90ch}header{margin-bottom:2rem}.eyebrow{letter-spacing:.13em;text-transform:uppercase;font-size:.75rem;font-weight:750}.muted,.meta{color:var(--muted)}.notice{padding:1.2rem;border:1px solid var(--line);border-left:4px solid var(--accent);background:var(--wash);border-radius:8px}.company,.section-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:clamp(1.1rem,3vw,2.5rem);margin:1.5rem 0}.company>h2{margin-top:0}.company:target,.section-card:target{outline:3px solid var(--accent)}nav ul,.downloads{display:flex;flex-wrap:wrap;gap:.55rem;list-style:none;padding:0}nav a,.downloads a{display:inline-block;padding:.45rem .75rem;border:1px solid var(--line);border-radius:8px;background:var(--surface);text-decoration:none;font-weight:600}.section-nav{padding-bottom:1rem;border-bottom:1px solid var(--line)}.badge{display:inline-block;padding:.25rem .65rem;background:var(--wash);border-radius:20px;color:var(--accent);font-size:.75rem;font-weight:700}.table-scroll{overflow-x:auto;max-width:100%;margin:1rem 0;border:1px solid var(--line);border-radius:8px}table{border-collapse:collapse;min-width:100%;font-size:.88rem}th,td{padding:.7rem .85rem;text-align:left;vertical-align:top;border-bottom:1px solid var(--line);min-width:95px}th{background:var(--wash);font-weight:700}td{overflow-wrap:anywhere}tr:last-child td{border-bottom:0}.number{font-variant-numeric:tabular-nums}.record{margin:.5rem 0}.record>dt{font-size:.8rem;font-weight:750;text-transform:none;margin-top:1rem;color:var(--muted)}.record>dd{margin:.25rem 0 .75rem;overflow-wrap:anywhere}.records{padding-left:1.25rem}.records>li{max-width:none;padding:.5rem 0;border-bottom:1px solid var(--line)}details{margin:.7rem 0;padding:.75rem 1rem;border:1px solid var(--line);border-radius:8px;min-width:0}summary{font-weight:650;cursor:pointer}details details{background:var(--paper)}code{font-family:ui-monospace,monospace;font-size:.88em;overflow-wrap:anywhere}.skip{position:absolute;left:-9999px}.skip:focus{position:static;display:block;padding:1rem}.source-row td:first-child{min-width:180px}.source-row td:last-child{min-width:280px}.footer{margin-top:3rem;font-size:.85rem}.dataset-note{font-size:.9rem}@media(max-width:640px){main{padding:1.5rem .75rem 3rem}.company,.section-card{border-radius:12px}h2{font-size:1.6rem}.table-scroll{font-size:.8rem}th,td{padding:.5rem}.record details{padding:.5rem}.section-nav a{font-size:.85rem}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{body{background:white}main{max-width:none;padding:0}.company,.section-card{border:0;padding:0;break-before:page}nav,.downloads{display:none}details{break-inside:avoid}table{font-size:8pt}.table-scroll{overflow:visible}}
"""


def page(title: str, body: str) -> str:
    return f'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#192c4e"><title>{html.escape(title)} · Valuation Lab</title><style>{CSS}</style></head><body><a class="skip" href="#main">Skip to research</a><main id="main">{body}<footer class="footer">Valuation Lab · Public-source research as of 17 October 2026. Conditional educational analysis, not a price target or trading recommendation.</footer></main></body></html>\n'


def source_table(sources: list, ticker: str) -> str:
    rows = []
    for n, item in enumerate(sources):
        title = item.get('title', item.get('id', f'Source {n+1}'))
        url = item.get('url', item.get('sourceUrl', item.get('source_url', '')))
        read = item.get('readStatus', item.get('read_status', item.get('readingStatus', 'Read scope is recorded in the full entry below.')))
        dates = '<br>'.join(html.escape(f'{label(k)}: {v}') for k, v in item.items() if k.lower() in ('eventdate', 'publicationdate', 'accessedat', 'event_date', 'publication_date', 'retrieved_at'))
        rows.append(f'<tr class="source-row" id="{ticker}-source-{n+1}"><td>{link(url, str(title)) if url else html.escape(str(title))}<br><span class="meta">{html.escape(str(item.get("id", "")))}</span></td><td>{dates}</td><td>{inline(str(read))}<details><summary>Full source metadata and limitations</summary>{render_value(item)}</details></td></tr>')
    return '<div class="table-scroll" tabindex="0" role="region" aria-label="Source ledger"><table><caption>Original source records; an entry does not imply the entire source was read.</caption><thead><tr><th scope="col">Source</th><th scope="col">Dates</th><th scope="col">Read scope and record</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></div>'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    source, output = args.source.resolve(), args.output.resolve()
    case_path = source / f'executable-base-cases-{AS_OF}.json'
    if sha(case_path.read_bytes()) != EXECUTABLE_HASH:
        raise SystemExit('Executable source differs from the approved frozen input.')
    version = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if version != FROZEN_VERSION:
        raise SystemExit('Research source is not the approved frozen version.')
    raw_cases = json.loads(case_path.read_text())
    tickers = [c['ticker'] for c in raw_cases['companies']]
    if len(tickers) != 14 or len(set(tickers)) != 14:
        raise SystemExit('Expected exactly 14 distinct companies.')
    package = Package(source)
    roots = {
        f'executable-base-cases-{AS_OF}.json': ('selected-operating-cases', 'cases.json'),
        'equity-bridge-register.json': ('equity-bridge-register', 'claims.json'),
        'source-corrections.json': ('source-corrections', 'corrections.json'),
        f'source-ledger-{AS_OF}.json': ('source-ledger', 'dossiers.html#source-policy'),
        'management-capability-matrix.json': ('management-capability-matrix', 'dossiers.html#management-policy'),
        'renewed-base-case-proposals.json': ('scenario-index', 'shared-evidence.html#scenario-index'),
        'baseline-assumptions-reference.json': ('prior-assumption-comparison', 'shared-evidence.html#prior-assumption-comparison'),
        'research-protocol.md': ('research-protocol', 'shared-evidence.html#research-protocol'),
        'capital-reconciliation-audit.md': ('capital-reconciliation-review', 'shared-evidence.html#capital-reconciliation-review'),
        'research-coherence-audit.md': ('research-coherence-review', 'shared-evidence.html#research-coherence-review'),
    }
    for relative, (artifact_id, target) in roots.items():
        package.register(relative, artifact_id, target)
    for ticker in tickers:
        for path in sorted((source / 'companies' / ticker).iterdir()):
            if path.name in COMPANY_SECTIONS:
                section = COMPANY_SECTIONS[path.name]
            elif path.suffix == '.json' and path.name not in ('selected-base-executable.json', 'validation.json', 'retrieval-ledger.json', 'fetch-log.json'):
                section = slug(path.stem)
            else:
                continue
            target = f'dossiers.html#{ticker}' if section == 'dossier' else f'evidence-{ticker}.html#{section}'
            package.register(str(path.relative_to(source)), f'{ticker}:{section}', target)
    for path in sorted((source / 'methodology').glob('*.json')):
        aid = slug(path.stem)
        package.register(str(path.relative_to(source)), aid, f'shared-evidence.html#{aid}')
    group_names = {'funding-reconciliation.json', 'funding-reconciliation.md', 'goog-funding-reconciliation-notes.json', 'goog-funding-reconciliation-notes.md', 'quarterly-revenue-comparison.json', 'existing-research-extract.json', 'MU-existing-input.json', 'TSM-existing-input.json', 'NVDA-existing-input.json', 'AVGO-existing-input.json'}
    for path in sorted((source / 'groups').rglob('*')):
        if path.is_file() and path.name in group_names:
            aid = slug(f'{path.parent.name}-{path.stem}' + ('-narrative' if path.suffix == '.md' else ''))
            package.register(str(path.relative_to(source)), aid, f'shared-evidence.html#{aid}')

    cases = package.get(f'executable-base-cases-{AS_OF}.json')
    claims = package.get('equity-bridge-register.json')
    corrections = package.get('source-corrections.json')
    sources = package.get(f'source-ledger-{AS_OF}.json')
    management = package.get('management-capability-matrix.json')
    if len(sources['sources']) != 320 or len(management['rows']) != 70:
        raise SystemExit('Frozen source/management counts are not 320/70.')
    company_evidence = []
    for ticker in tickers:
        fields = {'ticker': ticker}
        names = {'facts': 'facts', 'guidance': 'guidanceTrackRecord', 'management': 'managementCapabilities', 'sources': 'sourceLedger', 'judgment': 'analystJudgment', 'dossier': 'dossierMarkdown'}
        fields['supplementalEvidence'] = {}
        for relative in package.originals:
            if relative.startswith(f'companies/{ticker}/'):
                section = package.artifact_ids[relative].split(':', 1)[1]
                value = package.get(relative, ticker)
                if section in names:
                    fields[names[section]] = value
                else:
                    fields['supplementalEvidence'][section] = value
        company_evidence.append(fields)
    shared = {}
    for relative, aid in package.artifact_ids.items():
        if package.targets[relative].startswith('shared-evidence.html'):
            shared[aid] = package.get(relative)
    evidence = {
        'schemaVersion': 1, 'researchAsOf': AS_OF,
        'policy': 'Public-source analytical research. Reported facts, management statements, and analyst judgments retain their own definitions and limitations. Reading a source entry does not mean every page, minute, or statement was reviewed.',
        'counts': {'companies': 14, 'sourceRecords': 320, 'managementCapabilityRecords': 70},
        'companies': company_evidence, 'sourceLedger': sources,
        'managementCapabilityMatrix': management, 'sharedResearch': shared,
    }
    output.mkdir(parents=True, exist_ok=True)
    files = {'cases.json': dump(cases), 'claims.json': dump(claims), 'corrections.json': dump(corrections), 'evidence.json': dump(evidence)}
    nav = '<nav aria-label="Choose a company"><ul>' + ''.join(f'<li>{link("#"+t,t)}</li>' for t in tickers) + '</ul></nav>'
    dossier = '<header><p class="eyebrow">Valuation Lab · Renewed company research</p><h1>Evidence behind the operating cases.</h1><p class="meta">Research cutoff: 17 October 2026 · 14 companies · 320 source records · 70 management capability assessments</p>' + nav + '</header>'
    dossier += '<section class="notice" id="source-policy"><strong>Keep the evidence boundaries visible.</strong><p>These are conditional operating-value scenarios. The forecast anchor is not automatically the research date. Cash, debt, leases, awards, outside assets, funding and share counts require their own reconciliation before a common-equity or per-share value can be claimed. Unresolved values remain null. TSM uses native TWD; operating values in different currencies must not be added or compared without conversion.</p><p>Source records preserve primary versus secondary status, dates, actual reading scope and coverage gaps. No complete commercial transcripts or raw filing copies are redistributed.</p></section>'
    dossier += '<p id="management-policy">Management assessments cover five separate capabilities with evidence, confidence, counterexamples and tenure attribution. They are not a composite CEO score, a causal attribution or an automatic valuation multiplier.</p><div class="downloads">' + ''.join(link(f, text) for f,text in [('cases.json','Numerical cases'),('claims.json','Equity bridge register'),('corrections.json','Verified corrections'),('evidence.json','Complete evidence data'),('shared-evidence.html','Shared methods and capital reviews'),('manifest.json','Evidence manifest'),('../../index.html','Back to Valuation Lab')]) + '</div>'
    claim_map = {c['ticker']: c for c in claims['companies']}
    case_map = {c['ticker']: c for c in cases['companies']}
    for company in company_evidence:
        ticker = company['ticker']
        dossier += f'<article class="company" id="{ticker}"><p class="eyebrow">Company dossier · {ticker}</p><h2>{ticker}</h2><nav class="section-nav" aria-label="{ticker} evidence sections"><ul>'
        for section, title in [('facts','Reported facts'),('guidance','Management outlook & track record'),('management','Management capabilities'),('judgment','Analyst judgment'),('selected-case','Selected executable case'),('claims','Equity bridge'),('sources','Sources & reading scope')]:
            dossier += '<li>' + link(f'evidence-{ticker}.html#{section}', title) + '</li>'
        dossier += '</ul></nav><p class="dataset-note">The complete original narrative follows. Its dated proposal language is preserved. The selected executable case and any later capital overlays are shown separately in the evidence pages.</p>' + markdown(company['dossierMarkdown'], ticker+'-narrative') + '<p>' + link('#main','Back to company index') + '</p></article>'

        sections = [('facts','Reported facts and source-derived calculations',company['facts'],'Source observations retain their reported units, accounting definitions, and explicit inference labels. Any management outlook or analytical estimate embedded in the original facts file remains labeled as such.'),('guidance','Management outlook and guidance track record',company['guidanceTrackRecord'],'Formal guidance, qualitative outlook, aspirations, revisions and pending outcomes remain distinct. Beat rates are not a cross-company competence ranking.'),('management','Management capabilities',company['managementCapabilities'],'Evidence-based judgments with counterexamples, uncertainty and leadership attribution; no composite credibility multiplier.'),('judgment','Analyst judgment and conditional scenarios',company['analystJudgment'],'These assumptions are analyst judgments, not reported facts, consensus estimates or management commitments. Original proposals may differ from the selected executable overlay.'),('selected-case','Selected executable operating case',case_map[ticker],'All numerical values are copied exactly from the frozen case. The full cash-flow timing, capital policy, funding sensitivities and unresolved gates remain visible.'),('claims','Equity bridge and unresolved claims',claim_map[ticker],'Carrying value, fair value, principal and contingent exposure are distinct. An unknown amount is not zero.')]
        company_html = f'<header><p class="eyebrow">Valuation Lab · {ticker} supporting evidence</p><h1>{ticker}: inspect the evidence.</h1><p>{link(f"dossiers.html#{ticker}","Read the full company dossier")} · {link("evidence.json","Complete machine-readable evidence")}</p></header><nav aria-label="Evidence sections"><ul>' + ''.join('<li>'+link('#'+s,t)+'</li>' for s,t,_,_ in sections) + '<li>'+link('#sources','Source ledger')+'</li></ul></nav>'
        for section, title, data, note in sections:
            company_html += f'<section class="section-card" id="{section}"><span class="badge">{html.escape(title)}</span><h2>{html.escape(title)}</h2><p class="notice">{html.escape(note)}</p>{render_value(data)}</section>'
        for section, value in company['supplementalEvidence'].items():
            company_html += f'<section class="section-card" id="{section}"><h2>{html.escape(label(section))}</h2><p class="meta">Supporting source-derived research or explicitly dated prior comparison.</p>{render_value(value)}</section>'
        ledger = company['sourceLedger']
        ledger_sources = ledger if isinstance(ledger, list) else ledger.get('sources', ledger.get('records', []))
        ledger_meta = {} if isinstance(ledger, list) else {k:v for k,v in ledger.items() if k not in ('sources','records')}
        company_html += f'<section class="section-card" id="sources"><h2>Sources and reading scope</h2>{render_value(ledger_meta)}{source_table(ledger_sources,ticker)}</section>'
        files[f'evidence-{ticker}.html'] = page(ticker+' evidence', company_html)
    files['dossiers.html'] = page('Renewed research dossiers', dossier)
    shared_html = '<header><p class="eyebrow">Valuation Lab · Cross-company evidence</p><h1>Methods and capital reconciliation.</h1><p>'+link('dossiers.html','Back to company dossiers')+'</p></header><nav aria-label="Shared research sections"><ul>'+''.join('<li>'+link('#'+key,label(key))+'</li>' for key in shared)+'</ul></nav>'
    for key, value in shared.items():
        shared_html += f'<section class="section-card" id="{key}"><h2>{html.escape(label(key))}</h2>' + (markdown(value, key) if isinstance(value,str) else render_value(value)) + '</section>'
    shared_html += '<section class="section-card" id="corrections"><h2>Verified source corrections</h2>'+render_value(corrections)+'</section>'
    files['shared-evidence.html'] = page('Shared research evidence', shared_html)
    manifest = {
        'schemaVersion': 1, 'researchAsOf': AS_OF,
        'frozenResearchVersion': FROZEN_VERSION,
        'originalExecutableSHA256': EXECUTABLE_HASH,
        'counts': evidence['counts'],
        'transformationPolicy': 'Copy numerical values without recalculation. Replace local provenance locations with stable bundled evidence links or artifact IDs. Omit machine-local retrieval fields. Preserve original public URLs, meaningful research, classifications, reading scope and limitations. Do not redistribute original filing or transcript copies.',
        'originalInputHashesSHA256': {package.artifact_ids.get(p, 'input-'+sha(p.encode())[:16]): digest for p,digest in raw_cases['inputHashesSHA256'].items()},
        'artifacts': sorted(package.inputs.values(), key=lambda x:x['id']),
        'recordSelectors': dict(sorted(package.reference_selectors.items())),
        'outputs': {name: {'sha256': sha(content.encode()), 'bytes': len(content.encode())} for name,content in sorted(files.items())},
    }
    files['manifest.json'] = dump(manifest)
    for name, content in files.items():
        if FORBIDDEN_RE.search(content):
            raise SystemExit(f'Unsafe local-path or secret pattern in {name}.')
        (output / name).write_text(content)
    print(dump({'outputFiles': len(files), 'companies': len(tickers), 'sourceRecords': 320, 'managementCapabilityRecords': 70, 'originalExecutableSHA256': EXECUTABLE_HASH}).strip())


if __name__ == '__main__':
    main()
