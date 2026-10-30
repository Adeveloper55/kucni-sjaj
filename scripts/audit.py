"""Offline audit of public pages, anchors, metadata and local asset dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from collections import Counter
import json
import re

ROOT = Path(__file__).resolve().parent.parent
errors = []

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.inputs, self.labels, self.images = [], [], [], [], []
        self.h1 = 0
        self.main_nav = False
        self.nav_links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'nav' and a.get('aria-label') == 'Glavna navigacija': self.main_nav = True
        if tag == 'a' and self.main_nav: self.nav_links.append(a)
        if a.get('id'): self.ids.append(a['id'])
        if tag == 'h1': self.h1 += 1
        for attr in ('src', 'href'):
            if a.get(attr): self.refs.append(a[attr])
        if tag in ('input', 'select', 'textarea'): self.inputs.append(a)
        if tag == 'label': self.labels.append(a.get('for'))
        if tag == 'img': self.images.append(a)
    def handle_endtag(self, tag):
        if tag == 'nav': self.main_nav = False

pages = list(ROOT.glob('*.html'))
parsed = {}
for path in pages:
    source = path.read_text(encoding='utf-8')
    page = Page(); page.feed(source); parsed[path.name] = page
    if page.h1 != 1: errors.append(f'{path.name}: expected one H1, got {page.h1}')
    for key, count in Counter(page.ids).items():
        if count > 1: errors.append(f'{path.name}: duplicate id {key}')
    for field in page.inputs:
        if field.get('id') not in page.labels: errors.append(f'{path.name}: missing label {field.get("id")}')
    for image in page.images:
        if 'alt' not in image or not image.get('width') or not image.get('height'):
            errors.append(f'{path.name}: image requires alt and dimensions {image.get("src")}')
    for term in ('Clean360', 'CleanX', 'Pest Control', 'Lorem Ipsum', 'John Doe', 'Envato', 'DexignLab', 'ThemeForest', '123 456 7890'):
        if term.lower() in source.lower(): errors.append(f'{path.name}: demo content {term}')
    if 'href="#"' in source or 'javascript:' in source or 'file:///' in source:
        errors.append(f'{path.name}: dead or original local link')
    if 'lang="sr-Latn"' not in source: errors.append(f'{path.name}: language missing')

assets = set()
for name, page in parsed.items():
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc: continue
        target_name = unquote(url.path).lstrip('/') or name
        if url.path in ('/', './'): target_name = 'index-5.html'
        target = ROOT / target_name
        if not target.exists(): errors.append(f'{name}: missing {ref}'); continue
        if url.fragment and target_name in parsed and url.fragment not in parsed[target_name].ids:
            errors.append(f'{name}: missing anchor {ref}')
        if target.suffix in ('.css', '.js'): assets.add(target)

# Parse local CSS dependencies. Known unused legacy decorative URLs are reported separately.
legacy_optional = []
seen = set()
while assets:
    asset = assets.pop()
    if asset in seen: continue
    seen.add(asset)
    if asset.suffix != '.css': continue
    source = asset.read_text(encoding='utf-8', errors='replace')
    for ref in re.findall(r'url\(\s*[\"\']?([^\)\"\']+)', source):
        if ref.startswith(('data:', '#', 'file:')): continue
        url = urlsplit(ref)
        if url.scheme or url.netloc: errors.append(f'External CSS resource: {ref}'); continue
        target = (asset.parent / unquote(url.path)).resolve()
        if target.exists():
            if target.suffix == '.css': assets.add(target)
        elif asset.name in ('style.css', 'templete.css', 'xmenu.css', 'settings.css', 'navigation.css'):
            legacy_optional.append(str(target.relative_to(ROOT)))
        else: errors.append(f'{asset.name}: missing dependency {ref}')

homepage = (ROOT / 'index-5.html').read_text(encoding='utf-8')
routes = json.loads((ROOT / 'pages.json').read_text(encoding='utf-8'))
expected_nav = ['./' if page['key'] == 'pocetna' else page['file'] for page in routes]
for route in routes:
    page = parsed[route['file']]
    if [link['href'] for link in page.nav_links[:7]] != expected_nav:
        errors.append(f'{route["file"]}: main navigation does not link to all seven pages')
    active = [link['href'] for link in page.nav_links if link.get('aria-current') == 'page']
    expected_active = './' if route['key'] == 'pocetna' else route['file']
    if active != [expected_active]: errors.append(f'{route["file"]}: wrong current navigation item')
    source = (ROOT / route['file']).read_text(encoding='utf-8')
    if route['key'] != 'pocetna' and ('hero-section' in source or 'js/rev.slider.js' in source or 'js/hero-comparison.js' in source):
        errors.append(f'{route["file"]}: homepage slider loaded on inner page')
schema = re.search(r'id="business-schema">(.*?)</script>', homepage, re.S)
data = json.loads(schema.group(1))
assert data['@type'] == 'LocalBusiness'
assert not any(key in data for key in ('address', 'aggregateRating', 'review', 'geo', 'openingHours'))
if (ROOT / 'index.html').read_text(encoding='utf-8') != homepage: errors.append('Homepage aliases differ')
print(f'Audited {len(pages)} public pages, {len(seen)} styles/scripts, all anchors and form labels.')
print(f'Unused legacy CSS references (not requested by active DOM): {sorted(set(legacy_optional))}')
if errors:
    print('\n'.join(errors)); raise SystemExit(1)
print('PASS: no demo copy, missing active assets, duplicate IDs, unlabeled inputs or broken links.')
