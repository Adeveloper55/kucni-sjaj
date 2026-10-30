"""One-time extraction of existing sections into static page content/partials."""
from pathlib import Path
import re, json

root = Path(__file__).resolve().parent.parent
source = (root / 'index-5.html').read_text(encoding='utf-8')
backup = root / '.template-backup' / 'phase1-onepage.html'
if backup.exists():
    raise SystemExit('One-page migration already performed.')
backup.write_text(source, encoding='utf-8')
for folder in ('partials', 'content'):
    (root / folder).mkdir(exist_ok=True)
head = source[:source.index('</head>')]
head = re.sub(r'<title>.*?</title>', '<title>{{title}}</title>', head)
head = re.sub(r'(<meta name="description" content=")[^"]*', r'\1{{description}}', head)
head = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\1{{title}}', head)
head = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\1{{description}}', head)
head = re.sub(r'\s*<link rel="preload"[^>]+>', '', head)
head = re.sub(r'\s*<link rel="stylesheet" href="plugins/revolution/[^>]+>', '', head)
head = re.sub(r'\s*<script type="application/ld\+json" id="business-schema">.*?</script>', '\n{{schema}}', head, flags=re.S)
head += '\n{{sliderHead}}\n{{seo}}\n</head>\n'
(root / 'partials/head.html').write_text(head, encoding='utf-8')
header = re.search(r'<header class="site-header[\s\S]*?</header>', source).group()
header = re.sub(r'<ul class="nav navbar-nav">[\s\S]*?</ul>', '<ul class="nav navbar-nav">{{navigation}}</ul>', header)
(root / 'partials/header.html').write_text(header, encoding='utf-8')
footer = source[source.index('<footer class="site-footer'):source.index('<script defer src="js/site.config.js">')]
(root / 'partials/footer.html').write_text(footer, encoding='utf-8')
scripts = source[source.index('<script defer src="js/site.config.js">'):source.index('</body>')]
slider_scripts = '\n'.join(line for line in scripts.splitlines() if 'revolution/' in line or 'js/rev.slider.js' in line)
common_scripts = '\n'.join(line for line in scripts.splitlines() if 'revolution/' not in line and 'js/rev.slider.js' not in line)
(root / 'partials/scripts.html').write_text(common_scripts, encoding='utf-8')
(root / 'partials/slider-scripts.html').write_text(slider_scripts, encoding='utf-8')

sections = re.findall(r'<section\b[\s\S]*?</section>', source)
def find(marker):
    return next(section for section in sections if marker in section.split('>')[0])
services = find('id="usluge"')
cards = re.findall(r'<div class="col-lg-4 col-md-6"><article[\s\S]*?</article></div>', services)
preview = services[:services.index('<div class="row service-grid">')] + '<div class="row service-grid">' + ''.join(cards[:3]) + '</div><div class="text-center section-more"><a href="usluge.html" class="site-button button-md radius-sm">Pogledajte sve usluge <i class="fa fa-arrow-right" aria-hidden="true"></i></a></div></div></section>'
cta = find('inquiry-cta')
home = find('hero-section') + '\n' + find('value-strip') + '\n' + preview + '\n' + cta
(root / 'content/pocetna.html').write_text(home, encoding='utf-8')
routes = [
 ('pocetna','index-5.html','Početna','Čišćenje stanova Beograd | Profesionalno čišćenje','Profesionalno čišćenje stanova i kuća u Beogradu. Redovno, generalno i detaljno čišćenje, čišćenje nakon renoviranja i pranje prozora.',''),
 ('usluge','usluge.html','Usluge','Usluge čišćenja stanova i kuća u Beogradu','Redovno i generalno čišćenje doma, čišćenje nakon renoviranja i pranje prozora. Izaberite uslugu i zatražite procenu.','Izaberite čišćenje prema potrebama vašeg doma.'),
 ('cenovnik','cenovnik.html','Cenovnik','Cenovnik čišćenja stanova | Procena cene','Saznajte od čega zavisi cena čišćenja stana ili kuće u Beogradu i zatražite individualnu procenu.','Jasan dogovor o obimu posla i ceni, pre početka čišćenja.'),
 ('kako-funkcionise','kako-funkcionise.html','Kako funkcioniše','Kako funkcioniše zakazivanje čišćenja','Od izbora usluge do dogovorenog termina: pogledajte tri koraka za zakazivanje čišćenja doma u Beogradu.','Od izbora usluge do čistog doma — u tri koraka.'),
 ('o-nama','o-nama.html','O nama','O nama | Čišćenje doma u Beogradu','Upoznajte naš pristup čišćenju stanova i kuća: fleksibilni termini, jasan dogovor i pažnja prema vašem prostoru.','Čišćenje prilagođeno vašem prostoru i obavezama.'),
 ('faq','faq.html','FAQ','Česta pitanja o čišćenju stanova i kuća','Odgovori na pitanja o obimu čišćenja, trajanju, sredstvima, terminima i načinu određivanja cene.','Odgovori koji vam pomažu da pripremite upit.'),
 ('kontakt','kontakt.html','Kontakt','Kontakt i zakazivanje čišćenja u Beogradu','Pripremite upit za čišćenje stana ili kuće u Beogradu. Navedite uslugu, površinu prostora i željeni termin.','Recite nam šta treba očistiti i koji termin vam odgovara.'),
]
markers = {'usluge':'id="usluge"','cenovnik':'id="cenovnik"','kako-funkcionise':'id="kako-funkcionise"','o-nama':'id="o-nama"','faq':'id="faq"','kontakt':'id="zakazivanje"'}
for key, marker in markers.items():
    content = find(marker)
    if key != 'kontakt': content += '\n' + cta
    (root / f'content/{key}.html').write_text(content, encoding='utf-8')
config = [dict(key=k,file=f,label=l,title=t,description=d,intro=i) for k,f,l,t,d,i in routes]
(root / 'pages.json').write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding='utf-8')
# Retain prepared but disabled components without rendering duplicate page sections.
inert = '\n'.join(re.findall(r'<template\b[\s\S]*?</template>', source))
(root / 'partials/future-components.html').write_text(inert, encoding='utf-8')
print('Extracted seven pages and shared header/footer; original one-page saved.')
