#!/usr/bin/env python3
"""Build Simplified Chinese presentation assets from the retained reviewed catalogs.
Requires opencc-python-reimplemented==0.1.7 (OpenCC t2s dictionaries).
Only presentation strings are converted. Source data/English evidence are never inputs.
Run after localize-research-pages.py; no browser-time conversion or dependency.
"""
from pathlib import Path
import json, subprocess
from opencc import OpenCC
ROOT = Path(__file__).resolve().parents[1]
converter = OpenCC('t2s')
def simplify(text):
    text = converter.convert(text)
    # Reviewed Mainland financial/statistical terminology, applied only to catalogs.
    for source, target in [('蒙地卡罗', '蒙特卡罗'), ('蒙特卡洛', '蒙特卡罗'), ('营业利益', '营业利润'), ('机率', '概率'), ('变数', '变量')]:
        text = text.replace(source, target)
    return text
def main():
    locales = ROOT / 'dist/locales'
    count = 0
    for source in sorted(locales.glob('*.zh-Hant.*')):
        target = source.with_name(source.name.replace('zh-Hant', 'zh-Hans'))
        target.write_text(simplify(source.read_text()))
        count += 1
    # Convert only the explicitly Chinese values, never English keys or prose.
    for name in ['shell.js', 'index.js', 'research-page-attributes.js', 'research-prose-pairs.js']:
        path = locales / name
        module = json.loads(subprocess.check_output([
            'node', '--input-type=module', '-e',
            f'import * as catalog from {json.dumps(path.as_uri())}; console.log(JSON.stringify(catalog));'
        ], text=True))
        if name == 'research-prose-pairs.js':
            module['default'] = [[en, simplify(zh)] for en, zh in module['default']]
        elif name == 'research-page-attributes.js':
            module['default'] = {en: simplify(zh) for en, zh in module['default'].items()}
        else:
            for export in ['zh', 'attributeZh']:
                if export in module:
                    module[export] = {key: simplify(value) for key, value in module[export].items()}
            if name == 'shell.js':
                module['en']['locale.chinese'] = 'Switch to Simplified Chinese'
                module['zh']['locale.chinese'] = '切换为简体中文'
        path.write_text(''.join(
            ('export default ' if key == 'default' else f'export const {key} = ')
            + json.dumps(value, ensure_ascii=False, indent=2) + ';\n'
            for key, value in module.items()
        ))
    # Full-message, key-scoped overrides for reviewed finance claims labels.
    overrides = json.loads((ROOT / 'scripts/research-translations/simplified-ui-overrides.json').read_text())
    for name, entries in overrides.items():
        path = locales / name
        text = path.read_text()
        values = json.loads(text[text.index('{'):text.rindex('}') + 1])
        for key, value in entries.items():
            if key not in values:
                raise ValueError(f'Missing reviewed UI key: {name}:{key}')
            values[key] = simplify(value)
        path.write_text('export default ' + json.dumps(values, ensure_ascii=False, indent=2) + ';\n')
    print(json.dumps({'locale': 'zh-Hans', 'generatedCatalogs': count, 'converter': 'OpenCC t2s', 'sourceDataModified': False}))
if __name__ == '__main__':
    main()
