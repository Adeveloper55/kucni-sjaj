from pathlib import Path
from urllib.request import Request, urlopen
import re

root = Path(__file__).resolve().parent.parent
url = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;800;900&display=swap'
request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urlopen(request, timeout=30) as response:
    css = response.read().decode('utf-8')
font_dir = root / 'fonts' / 'roboto'
font_dir.mkdir(parents=True, exist_ok=True)
urls = sorted(set(re.findall(r'url\((https://fonts.gstatic.com/[^)]+)\)', css)))
for i, font_url in enumerate(urls):
    ext = Path(font_url.split('?')[0]).suffix
    filename = f'roboto-{i}{ext}'
    with urlopen(font_url, timeout=30) as response:
        (font_dir / filename).write_bytes(response.read())
    css = css.replace(font_url, f'../fonts/roboto/{filename}')
(root / 'css/fonts.css').write_text('/* Roboto — local Google Fonts copy. */\n' + css, encoding='utf-8')
print(f'Localized {len(urls)} Roboto font files.')
