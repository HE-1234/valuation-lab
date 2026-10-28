"""Local dev server: serves dist/ with caching disabled so phones always load
the latest files, prints reports posted by dist/diag.html, and saves
"My valuations" into dist/data/my-valuations/ (one JSON file per version)."""
import http.server, json, os, re, sys, tempfile, urllib.parse
from datetime import datetime, timezone
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'dist'
SAVED = ROOT / 'data' / 'my-valuations'
INDEX = SAVED / 'index.json'
ID = re.compile(r'^(guided|annual)-[A-Z0-9.-]{1,12}-[0-9a-z-]{1,40}-\d{14}$')
MAX_BODY = 4_000_000


def write_json(path, value):
    """Atomic write so a half-written file never replaces a good one."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix='.tmp')
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump(value, f, ensure_ascii=False, indent=1)
        f.write('\n')
    os.chmod(tmp, 0o644)  # mkstemp creates 0600; saved versions are ordinary repo files
    os.replace(tmp, path)


def read_index():
    try:
        index = json.loads(INDEX.read_text(encoding='utf-8'))
        if isinstance(index.get('valuations'), list):
            return index
    except (OSError, ValueError):
        pass
    return {'schemaVersion': 1, 'valuations': []}


def text(value, limit):
    return value.strip()[:limit] if isinstance(value, str) and value.strip() else None


def saved_valuations(body):
    """Apply one change to the saved-valuation library and return the new index."""
    index, op = read_index(), body.get('op')
    rows = index['valuations']
    find = lambda vid: next((r for r in rows if r['id'] == vid), None)
    if op == 'save':
        meta, draft = body.get('valuation') or {}, body.get('draft')
        vid = meta.get('id')
        if not isinstance(vid, str) or not ID.match(vid) or not isinstance(draft, (dict, list)):
            raise ValueError('A valid id and draft are required.')
        row = {'id': vid, 'model': vid.split('-')[0], 'ticker': meta.get('ticker'), 'name': text(meta.get('name'), 80) or 'Untitled',
               'baseId': text(meta.get('baseId'), 120), 'baseLabel': text(meta.get('baseLabel'), 120),
               'perShare': meta.get('perShare') if isinstance(meta.get('perShare'), (int, float)) else None,
               'currency': text(meta.get('currency'), 8), 'savedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
               'default': bool(meta.get('default')), 'file': f'{vid}.json'}
        if row['ticker'] != vid.split('-')[1]:
            raise ValueError('Ticker does not match the id.')
        write_json(SAVED / row['file'], {'schemaVersion': 1, **row, 'draft': draft})
        rows[:] = [r for r in rows if r['id'] != vid] + [row]
        if row['default']:
            for r in rows:
                if r is not row and r['model'] == row['model'] and r['ticker'] == row['ticker']:
                    r['default'] = False
    elif op in ('delete', 'default', 'rename'):
        row = find(body.get('id'))
        if not row:
            raise ValueError('That saved valuation no longer exists.')
        if op == 'delete':
            rows.remove(row)
            try:
                (SAVED / row['file']).unlink()
            except FileNotFoundError:
                pass
        elif op == 'default':
            on = not row['default'] if body.get('value') is None else bool(body['value'])
            for r in rows:
                if r['model'] == row['model'] and r['ticker'] == row['ticker']:
                    r['default'] = False
            row['default'] = on
        else:
            row['name'] = text(body.get('name'), 80) or row['name']
            path = SAVED / row['file']
            try:
                saved = json.loads(path.read_text(encoding='utf-8'))
                saved['name'] = row['name']
                write_json(path, saved)
            except (OSError, ValueError):
                pass
    else:
        raise ValueError('Unknown operation.')
    rows.sort(key=lambda r: (r['ticker'] or '', r['model'], r['savedAt']))
    write_json(INDEX, index)
    return index


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_json(self, status, value):
        data = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        if url.path == '/diag-report':
            report = urllib.parse.parse_qs(url.query).get('r', [''])[0]
            try: report = json.dumps(json.loads(report), indent=1, ensure_ascii=False)
            except ValueError: pass
            print(f'DIAG REPORT from {self.client_address[0]}:\n{report}', file=sys.stderr, flush=True)
            self.send_response(204)
            self.end_headers()
            return
        if url.path == '/api/my-valuations':
            return self.send_json(200, {'writable': True, **read_index()})
        super().do_GET()

    def do_POST(self):
        if urllib.parse.urlsplit(self.path).path != '/api/my-valuations':
            return self.send_json(404, {'error': 'Not found.'})
        length = int(self.headers.get('Content-Length') or 0)
        if not 0 < length <= MAX_BODY or 'application/json' not in (self.headers.get('Content-Type') or ''):
            return self.send_json(400, {'error': 'Send a JSON body under 4 MB.'})
        try:
            index = saved_valuations(json.loads(self.rfile.read(length)))
        except ValueError as error:
            return self.send_json(400, {'error': str(error)})
        print(f'Saved valuations updated from {self.client_address[0]}', file=sys.stderr, flush=True)
        self.send_json(200, {'writable': True, **index})


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = http.server.ThreadingHTTPServer(('0.0.0.0', port), partial(Handler, directory=str(ROOT)))
    print(f'Serving dist/ on 0.0.0.0:{port} (no-store)', file=sys.stderr, flush=True)
    server.serve_forever()
