"""Download the reference template and its same-origin static dependencies."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
import re
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://clean360-html.vercel.app/'
HOST = urlsplit(BASE).netloc

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'href', 'poster', 'data-src', 'data-lazyload'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip():
                self.refs.append(candidate.strip().split()[0])

def local_url(ref, parent):
    parsed = urlsplit(urljoin(parent, ref.strip()))
    if parsed.netloc != HOST or parsed.scheme not in ('http', 'https'):
        return None
    if not parsed.path or parsed.path.endswith('/'):
        return None
    if Path(parsed.path).suffix.lower() not in {
        '.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.json',
    }:
        return None
    return parsed._replace(query='', fragment='').geturl()

def fetch(url):
    rel = unquote(urlsplit(url).path).lstrip('/')
    target = (ROOT / rel).resolve()
    if ROOT not in target.parents:
        raise ValueError('Invalid destination')
    if target.exists():
        data = target.read_bytes()
    else:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=35) as response:
            data = response.read()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    refs = []
    if target.suffix in ('.html', '.css', '.js'):
        source = data.decode('utf-8', errors='replace')
        if target.suffix == '.html':
            parser = References()
            parser.feed(source)
            refs.extend(parser.refs)
        refs.extend(re.findall(r'url\(\s*[\"\']?([^\)\"\']+)', source))
        refs.extend(re.findall(r'@import\s+[\"\']([^\"\']+)', source))
        if target.suffix == '.js':
            refs.extend(re.findall(r'[\"\']((?:images|css|plugins|fonts)/[^\"\'\s]+\.(?:png|jpg|gif|css|woff2?))[\"\']', source))
    return [u for ref in refs if (u := local_url(ref, url))]

def main():
    pending = {BASE + 'index-5.html'}
    seen = set()
    failed = {}
    with ThreadPoolExecutor(max_workers=12) as pool:
        while pending:
            batch = pending - seen
            if not batch:
                break
            seen.update(batch)
            pending = set()
            jobs = {pool.submit(fetch, url): url for url in batch}
            for job in as_completed(jobs):
                url = jobs[job]
                try:
                    pending.update(job.result())
                except Exception as error:
                    failed[url] = str(error)
            print(f'Processed {len(seen)} resources; next {len(pending - seen)}; unavailable {len(failed)}', flush=True)
    (ROOT / 'mirror-report.json').write_text(json.dumps({'source': BASE + 'index-5.html', 'resources': len(seen), 'unavailable': failed}, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
