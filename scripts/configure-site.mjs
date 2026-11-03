/* Build ordinary static HTML pages from the existing HTML sections and shared partials. */
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFile(path.join(root, name), 'utf8');
const context = { window: {} };
vm.runInNewContext(await read('js/site.config.js'), context);
const config = context.window.SITE_CONFIG;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pages = JSON.parse(await read('pages.json'));
const [head, header, footer, scripts, sliderScripts, schemaSource] = await Promise.all([
  read('partials/head.html'), read('partials/header.html'), read('partials/footer.html'),
  read('partials/scripts.html'), read('partials/slider-scripts.html'), read('partials/business-schema.json'),
]);
const originalSchema = JSON.parse(schemaSource);
let siteURL;
if (config.SITE_URL) {
  const url = new URL(config.SITE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be a confirmed HTTPS base URL.');
  siteURL = url.href.endsWith('/') ? url.href : url.href + '/';
}
const destinations = Object.fromEntries(pages.map(page => [page.key, page.key === 'pocetna' ? './' : page.file]));
const linkTo = hash => {
  if (hash === 'pocetna') return './';
  if (hash === 'zakazivanje') return 'kontakt.html#zakazivanje';
  if (hash.startsWith('usluga-')) return 'usluge.html#' + hash;
  return destinations[hash];
};
function links(html) {
  return html.replace(/href="\/?#([^"]+)"/g, (full, hash) => linkTo(hash) ? `href="${linkTo(hash)}"` : full)
    .replace(/href="kontakt.html#zakazivanje" data-service="([^"]+)"/g, (_, key) => `href="kontakt.html?usluga=${encodeURIComponent(key)}#zakazivanje" data-service="${key}"`);
}
function brand(html) {
  return html.replace(/(<(?:strong|span)[^>]*data-brand>)[^<]*(<\/(?:strong|span)>)/g, (_, open, close) => open + escape(config.brand) + close)
    .replace(/aria-label="[^"]* — početna"/g, `aria-label="${escape(config.brand)} — početna"`);
}
function contacts(html) {
  const channels = {
    phone: { key: 'PHONE_NUMBER', url: value => 'tel:' + value.replace(/[^\d+]/g, '') },
    whatsapp: { key: 'WHATSAPP_NUMBER', url: value => 'https://wa.me/' + value.replace(/\D/g, '') },
    viber: { key: 'VIBER_NUMBER', url: value => 'viber://chat?number=' + encodeURIComponent(value.replace(/[^\d+]/g, '')) },
  };
  const valid = value => typeof value === 'string' && /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 6 && value.replace(/\D/g, '').length <= 15;
  html = html.replace(/<button\b([^>]*\bdata-contact="(phone|whatsapp|viber)"[^>]*)>([\s\S]*?)<\/button>/g, (full, attributes, name, label) => {
    const channel = channels[name], value = config[channel.key];
    if (!valid(value)) return full;
    const attrs = attributes.replace(/\s+(?:type|title|aria-describedby)="[^"]*"/g, '').replace(/\s+disabled\b/g, '');
    const text = label.replace(/<small[^>]*data-phone-hint[^>]*>[\s\S]*?<\/small>/g, '');
    return `<a${attrs} href="${escape(channel.url(value))}">${text}</a>`;
  });
  for (const channel of Object.values(channels)) {
    const value = config[channel.key];
    if (!valid(value)) continue;
    const pattern = new RegExp(`(<(span|dd)[^>]*data-contact-value="${channel.key}"[^>]*>)[\\s\\S]*?(<\\/\\2>)`, 'g');
    html = html.replace(pattern, (_, open, tag, close) => open + `<a href="${escape(channel.url(value))}">${escape(value)}</a>` + close);
  }
  if (valid(config.PHONE_NUMBER)) html = html.replace(/<p\b[^>]*class="contact-pending"[^>]*>[\s\S]*?<\/p>/g, '');
  return html;
}
function template(html, values) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}
const legal = [
  { key: 'politika-privatnosti', file: 'politika-privatnosti.html', label: 'Politika privatnosti', title: 'Politika privatnosti | Čišćenje u Beogradu', description: 'Koje podatke Čišćenje u Beogradu dobija kad nas kontaktirate, šta forma na sajtu ne čuva i kako možete da tražite uvid ili brisanje.', intro: 'Kako postupamo sa podacima kad nas pozovete ili nam pišete, i šta forma na sajtu ne čuva.' },
  { key: 'uslovi-koriscenja', file: 'uslovi-koriscenja.html', label: 'Uslovi korišćenja', title: 'Uslovi korišćenja | Čišćenje u Beogradu', description: 'Kako se dogovara čišćenje stanova u Beogradu: šta sajt ne rezerviše, kako važi cena i šta treba na dan dolaska.', intro: 'Kako se dogovara čišćenje, šta cena znači i zašto klik na sajtu nije rezervacija.' },
];
function shot(src, width, height, alt) {
  return `<figure class="page-banner-photo"><span class="page-banner-frame"><img src="${src}" width="${width}" height="${height}" alt="${escape(alt)}"></span></figure>`;
}
function crumbs(label, options = {}) {
  const title = label === 'FAQ' ? 'Česta pitanja' : (options.h1 || label);
  const trail = options.parent
    ? `<li><a href="./">Početna</a></li><li><a href="${escape(options.parent.href)}">${escape(options.parent.label)}</a></li><li aria-current="page">${escape(label)}</li>`
    : `<li><a href="./">Početna</a></li><li aria-current="page">${escape(label)}</li>`;
  return `<nav aria-label="Putanja stranice"><ol class="breadcrumbs">${trail}</ol></nav><h1 id="page-title">${escape(title)}</h1>`;
}
function pageBanner(page, config) {
  const phone = escape(config.PHONE_NUMBER || '');
  const tel = String(config.PHONE_NUMBER || '').replace(/[^\d+]/g, '');
  if (page.landing) {
    const serviceHeroes = {
      'ciscenje-zgrada': {
        img: 'images/poslovni/zgrade.webp',
        cache: '2',
        crumb: 'Čišćenje zgrada',
        kicker: 'Za upravnike i stanare',
        title: 'Čišćenje zgrada u Beogradu',
        lead: 'Ulaz, hodnik i stepenište su prva stvar koju stanari i gosti vide. Držimo zajedničke prostorije urednim — u terminu koji dogovorimo sa zgradom.',
        service: 'zgrade',
        price: 'Od 1.500 RSD / sat',
      },
      'ciscenje-poslovnog-prostora': {
        img: 'images/poslovni/poslovni.webp',
        cache: '1',
        crumb: 'Čišćenje poslovnog prostora',
        kicker: 'Za firme i kancelarije',
        title: 'Čišćenje poslovnog prostora u Beogradu',
        lead: 'Radni dan ide lakše u prostoru koji nije zagušen prašinom i tragovima kafice. Kancelarije, open space i zajedničke sobe — obim i termin dogovaramo pre dolaska.',
        service: 'poslovni',
        price: 'Od 1.500 RSD / sat',
      },
      'ordinacije-i-kancelarije': {
        img: 'images/poslovni/ordinacije.webp',
        cache: '1',
        crumb: 'Ordinacije i kancelarije',
        kicker: 'Za ordinacije i prijemne',
        title: 'Čišćenje ordinacija i kancelarija',
        lead: 'Pacijent i klijent prvo vide prijemnu. Čistimo pažljivo — površine koje se diraju, podovi i radne sobe — u terminu pre ili posle radnog vremena.',
        service: 'ordinacije',
        price: 'Od 1.500 RSD / sat',
      },
      'ciscenje-podruma': {
        img: 'images/poslovni/podrum.webp',
        cache: '1',
        crumb: 'Čišćenje podruma',
        kicker: 'Za stanove, kuće i zgrade',
        title: 'Čišćenje podruma u Beogradu',
        lead: 'Podrum ne mora da ostane skladište prašine. Čistimo podove i dostupne površine da prostor opet bude upotrebljiv.',
        service: 'podrum',
        price: 'Od 1.500 RSD / sat',
      },
      'odnosenje-suta': {
        img: 'images/poslovni/sut.webp',
        cache: '1',
        crumb: 'Odnošenje šuta',
        kicker: 'Posle renoviranja i radova',
        title: 'Odnošenje šuta u Beogradu',
        lead: 'Šut i građevinski otpad sklanjamo sa adrese — utovar i odvoz po dogovoru o količini i pristupu.',
        service: 'sut',
        price: 'Cena po dogovoru',
      },
    };
    if (serviceHeroes[page.key]) {
      const hero = serviceHeroes[page.key];
      const img = page.image || hero.img;
      const width = page.imageWidth || 1280;
      const height = page.imageHeight || 720;
      const price = hero.price || 'Od 1.500 RSD / sat';
      return `<section class="service-hero" aria-labelledby="page-title">
  <div class="service-hero-media" aria-hidden="true"><img src="${escape(img)}?v=${hero.cache}" width="${width}" height="${height}" alt="" decoding="async" fetchpriority="high"></div>
  <div class="service-hero-shade" aria-hidden="true"></div>
  <div class="container-fluid service-hero-inner">
    <nav aria-label="Putanja stranice"><ol class="breadcrumbs"><li><a href="./">Početna</a></li><li><a href="usluge.html">Usluge</a></li><li aria-current="page">${escape(hero.crumb)}</li></ol></nav>
    <p class="service-hero-kicker">${escape(hero.kicker)}</p>
    <h1 id="page-title">${escape(hero.title)}</h1>
    <p class="service-hero-lead">${escape(hero.lead)}</p>
    <p class="service-hero-price">${escape(price)}</p>
    <div class="cta-actions"><a class="site-button button-md radius-sm" href="kontakt.html?usluga=${escape(hero.service)}#zakazivanje">Zatraži procenu <i class="fa fa-arrow-right" aria-hidden="true"></i></a><a class="call-button call-button-light" data-contact="phone" href="tel:${tel}">Pozovi</a></div>
  </div>
</section>`;
    }
    const head = crumbs(page.label, {
      h1: page.h1 || page.label,
      parent: { href: 'usluge.html', label: 'Usluge' },
    });
    const img = page.image || 'images/banners/usluge.webp';
    const width = page.imageWidth || 1280;
    const height = page.imageHeight || 720;
    const alt = page.imageAlt || page.label;
    const price = page.priceNote ? `<p>${escape(page.priceNote)}</p>` : '';
    const sizeNote = '<p class="service-price-note">Cena zavisi od veličine stana i sati rada.</p>';
    return `<section class="page-banner banner-split" aria-labelledby="page-title"><div class="container-fluid page-banner-grid"><div class="page-banner-copy">${head}<p>${escape(page.intro || '')}</p>${price}${sizeNote}<p><a href="kontakt.html#zakazivanje">Zakažite termin</a> · <a href="cenovnik.html">Cenovnik</a> · <a href="tel:${tel}">${phone}</a></p></div>${shot(img, width, height, alt)}</div></section>`;
  }
  const head = crumbs(page.label);
  const banners = {
    usluge: `<section class="page-banner banner-split" aria-labelledby="page-title"><div class="container-fluid page-banner-grid"><div class="page-banner-copy">${head}<p>Sve usluge iz cenovnika na jednom mestu: od tihog redovnog održavanja do renoviranja, useljenja, dodataka i poslovnog prostora.</p><p>Ne treba vam spisak svih prostorija ni stručan naziv. Opišite stan i šta vam je najvažnije. Pre dolaska kažemo šta ulazi u obim i koja je cena.</p><ul class="banner-points"><li><strong>Svakodnevni ritam</strong><span>Redovno čišćenje drži podove, prašinu i prostorije koje koristite, bez da čeka slobodan vikend.</span></li><li><strong>Ceo dom odjednom</strong><span>Generalno čišćenje ide dublje: kuhinja, kupatilo i mesta koja se u žurbi preskoče.</span></li><li><strong>Kad se život pomeri</strong><span>Renoviranje, useljenje ili iseljenje, dodatne usluge i čišćenje poslovnog prostora.</span></li></ul></div>${shot('images/banners/usluge.webp', 1152, 864, 'Svetla kuhinja sa zelenim elementima, sudoperom i činijom limuna')}</div></section>`,
    cenovnik: `<section class="page-banner banner-flip" aria-labelledby="page-title"><div class="container-fluid page-banner-grid">${shot('images/banners/cenovnik.webp', 1152, 864, 'Šolja, ključ i zatvorena sveska na hrastovom stolu')}<div class="page-banner-copy">${head}<p>Početne cene su ovde, a iznos za vaš stan kažemo pre nego što čišćenje počne. Nema naknadnog iznenađenja na vratima.</p><div class="banner-facts"><div><strong>1.800 RSD</strong><span>redovno čišćenje po satu</span></div><div><strong>2.300 RSD</strong><span>generalno čišćenje po satu</span></div><div><strong>od 2.800 RSD</strong><span>posle renoviranja po satu</span></div></div><p>Konačna cena zavisi od kvadrature, stanja prostora i dodataka kao što su kuhinjski aparati ili prozori. Ako je obim veći nego što je dogovoreno, radimo dalje samo uz novi dogovor.</p></div></div></section>`,
    'kako-funkcionise': `<section class="page-banner banner-band" aria-labelledby="page-title"><div class="container-fluid page-banner-grid"><div class="page-banner-copy">${head}<p>Od poruke do čistog stana idu tri koraka. Vi kažete kakav je prostor, mi potvrdimo vreme i cenu, pa dolazimo i radimo tačno taj obim. Vi ne morate da provedete dan u rukavicama.</p><ol class="banner-steps"><li><b>Stavka 1</b><span>Opišete uslugu, približnu kvadraturu i šta vam je najvažnije.</span></li><li><b>Stavka 2</b><span>Javimo se sa terminom i cenom. Ljubimac i osetljive površine ulaze u taj razgovor.</span></li><li><b>Stavka 3</b><span>Dolazimo u potvrđeno vreme. Treba nam pristup stanu i kratko uputstvo šta ne dirati.</span></li></ol></div>${shot('images/banners/kako.webp', 1280, 720, 'Hodnik stana sa otvorenim vratima, kaputom i cipelama pored konzole')}</div></section>`,
    'o-nama': `<section class="page-banner banner-story" aria-labelledby="page-title"><div class="container-fluid page-banner-grid"><div class="page-banner-copy">${head}<p>Čišćenje u Beogradu čisti stanove i kuće u Beogradu da uredan dom ne čeka slobodnu subotu. Dolazimo na adresu koju navedete, u termin koji prvo potvrdimo.</p><p>Nismo šalter na koji donosite stan. Razgovor počinje od toga kako prostor izgleda, koje prostorije traže više pažnje i šta ne sme da se dira. Tek tada biramo obim, a ne unapred sastavljen paket.</p><p>Pažnja ide na vaš dom: podove koje gazite, kuhinju u kojoj se kuva i kupatilo koje se vidi svako jutro. Cena i vreme stoje na stolu pre dolaska.</p><p class="banner-sign">Čišćenje u Beogradu · čišćenje stanova u Beogradu</p></div>${shot('images/banners/o-nama.webp', 864, 1152, 'Nameštena spavaća soba sa maslinastom dekom, lampom i prozorom')}</div></section>`,
    faq: `<section class="page-banner banner-split" aria-labelledby="page-title"><div class="container-fluid page-banner-grid"><div class="page-banner-copy">${head}<p>Kratki odgovori pre nego što zakažete: šta ulazi u čišćenje, koliko traje, da li morate da budete kod kuće i kako nastaje cena.</p><div class="banner-questions"><p>Da li moram da budem kod kuće celog dana?</p><p>Kako znate cenu pre dolaska?</p><p>Šta da kažem za ljubimce, sredstva i stvari koje ne dirate?</p></div><p>Ako vaše pitanje nije među ovima, pozovite. Kraći je razgovor nego nagađanje tek kad se vrata otvore.</p></div>${shot('images/banners/faq.webp', 1152, 864, 'Dve šolje, telefon i zatvorena sveska na kuhinjskom pultu')}</div></section>`,
    kontakt: `<section class="page-banner banner-flip banner-reach" aria-labelledby="page-title"><div class="container-fluid page-banner-grid">${shot('images/banners/kontakt.webp', 1152, 864, 'Telefon, ključevi i vaza na drvenoj konzoli uz tamnoplavi zid')}<div class="page-banner-copy">${head}<p>Javite nam kakav je stan i šta želite da bude očišćeno. Uzvratimo predlogom termina i cenom, pre dolaska.</p><ul class="banner-points"><li><strong>Šta da kažete</strong><span>Vrsta usluge, približna kvadratura, deo Beograda i jedna rečenica o prioritetu.</span></li><li><strong>Gde nas dobijate</strong><span>Telefon, WhatsApp i Viber: <a href="tel:${tel}">${phone}</a>. Zona rada je Beograd.</span></li><li><strong>Šta nije rezervacija</strong><span>Željeni datum je predlog. Termin važi kad ga potvrdimo, a forma sama po sebi ne šalje upit.</span></li></ul></div></div></section>`,
    'politika-privatnosti': `<section class="page-banner banner-split banner-calm" aria-labelledby="page-title"><div class="container-fluid page-banner-grid"><div class="page-banner-copy">${head}<p>Kad nas pozovete ili pišete, čujemo ono što treba za dogovor: ime, telefon, kakav je stan i šta treba očistiti. To koristimo za termin, cenu i samo čišćenje.</p><p>Sajt ne stavlja kolačiće i ne pravi profil posete. Forma na stranici Kontakt ne šalje unete podatke i ne čuva ih. Upit koji treba da stigne do nas ide telefonom, WhatsApp-om ili Viberom.</p><p>Možete da tražite uvid ili brisanje podataka koje imamo iz razgovora. Ispod je ceo tekst, uključujući kome da se obratite ako obrada nije u redu.</p></div>${shot('images/banners/privatnost.webp', 1152, 864, 'Fotelja, zatvorena knjiga i šolja pored prozora sa zavesom')}</div></section>`,
    'uslovi-koriscenja': `<section class="page-banner banner-flip" aria-labelledby="page-title"><div class="container-fluid page-banner-grid">${shot('images/banners/uslovi.webp', 1152, 864, 'Dva priveska sa ključevima na kamenoj tacni pored vrata stana')}<div class="page-banner-copy">${head}<p>Pregled sajta nije ugovor. Rezervacija nastaje tek kad potvrdimo obim, cenu i vreme dolaska. Klik na Pošalji ne zakazuje čišćenje i ne naplaćuje ništa.</p><p>Cenovnik pokazuje početne cene. Iznos za vaš stan kažemo pre rada, a plaćanje se dogovara uz tu cenu. Na sajtu nema kartica ni online uplate.</p><ul class="banner-points"><li><strong>Dan dolaska</strong><span>Treba nam ulazak u potvrđeno vreme i kratko uputstvo šta ne dirati.</span></li><li><strong>Otkazivanje</strong><span>Termin pomerite ili otkažite porukom ili pozivom, što ranije.</span></li><li><strong>Fotografije</strong><span>Slike na sajtu su ilustracije prostora, ne snimak konkretnog završenog posla.</span></li></ul></div></div></section>`,
  };
  return banners[page.key] || banners.usluge;
}
const childrenByParent = Object.create(null);
for (const item of pages) {
  if (!item.parent) continue;
  (childrenByParent[item.parent] ??= []).push(item);
}
function navLinkAttrs(current, ancestor) {
  if (current) return ' class="active" aria-current="page"';
  if (ancestor) return ' class="active"';
  return '';
}
function buildNavigation(page) {
  return pages.filter(item => item.nav !== false).map(item => {
    const current = item.key === page.key;
    const ancestor = page.parent === item.key;
    const kids = (childrenByParent[item.key] || []).filter(child => !child.hidden);
    if (!kids.length) {
      return `<li><a href="${destinations[item.key]}"${navLinkAttrs(current, ancestor)}>${escape(item.label)}</a></li>`;
    }
    const submenu = [
      `<li><a href="${destinations[item.key]}" class="nav-all-services"${current ? ' aria-current="page"' : ''}>Sve usluge</a></li>`,
      ...kids.map(child => {
        const childCurrent = child.key === page.key;
        return `<li><a href="${child.file}"${childCurrent ? ' class="active" aria-current="page"' : ''}>${escape(child.label)}</a></li>`;
      }),
    ].join('\n      ');
    return `<li class="nav-dropdown${current || ancestor ? ' is-current' : ''}">
  <div class="nav-dropdown-trigger">
    <a href="${destinations[item.key]}"${navLinkAttrs(current, ancestor)}>${escape(item.label)}</a>
    <button type="button" class="nav-dropdown-toggle" aria-expanded="false" aria-controls="nav-submenu-${item.key}" aria-label="Prikaži spisak: ${escape(item.label)}"><span class="nav-dropdown-caret" aria-hidden="true"></span></button>
  </div>
  <ul class="sub-menu" id="nav-submenu-${item.key}">
      ${submenu}
  </ul>
</li>`;
  }).join('\n');
}
for (const page of [...pages, ...legal]) {
  const home = page.key === 'pocetna';
  const content = await read(`content/${page.key}.html`);
  const canonical = siteURL ? new URL(home ? './' : page.file, siteURL).href : null;
  const navigation = buildNavigation(page);
  const schema = structuredClone(originalSchema);
  schema.name = config.brand;
  if (config.PHONE_NUMBER) schema.telephone = config.PHONE_NUMBER;
  if (config.EMAIL_ADDRESS) schema.email = config.EMAIL_ADDRESS;
  if (siteURL) schema.url = siteURL;
  const noindex = page.noindex || page.hidden;
  const schemaTag = noindex ? '' : `<script type="application/ld+json" id="business-schema">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
  const seo = (noindex ? '<meta name="robots" content="noindex,follow">\n' : '') + (canonical ? `<link rel="canonical" href="${escape(canonical)}">\n<meta property="og:url" content="${escape(canonical)}">\n<meta property="og:image" content="${escape(new URL('images/og-share.jpg', siteURL).href)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${escape(new URL('images/og-share.jpg', siteURL).href)}">` : '<!-- TODO SITE_URL: canonical / og:url / sitemap await the confirmed production domain. -->');
  const sliderHead = home ? '<link rel="preload" as="image" href="images/hero-comparison/stan-prljav-1100.webp" media="(max-width: 991px)" fetchpriority="high"><link rel="preload" as="image" href="images/hero-comparison/stan-prljav.webp" media="(min-width: 992px)" fetchpriority="high">' : '';
  const banner = home ? '' : pageBanner(page, config);
  let html = template(head, { title: escape(page.title), description: escape(page.description), schema: schemaTag, seo, sliderHead });
  html += `<body id="bg" class="home-page ${home ? '' : 'inner-page'}" data-page="${page.key}">\n<a class="skip-link" href="#main">Preskoči na sadržaj</a>\n<div class="page-wraper page-wraper-full font-roboto btn-lsnone">\n`;
  html += template(header, { navigation }) + '\n<main id="main" class="page-content bg-white" tabindex="-1">\n' + banner + '\n' + content + '\n</main>\n' + footer;
  const pageScripts = home
    ? scripts.replace(/<script defer src="js\/custom\.js(?:\?v=\d+)?">/, `${sliderScripts}\n<script defer src="js/custom.js?v=13">`)
    : scripts;
  html += pageScripts + '\n</body>\n</html>\n';
  // Keep configuration ahead of site.js; all scripts are defer and execute in document order.
  html = contacts(brand(links(html)));
  await writeFile(path.join(root, page.file), html);
  if (home) await writeFile(path.join(root, 'index.html'), html);
}
if (siteURL) {
  const urls = [...pages, ...legal].filter(page => !page.hidden && !page.noindex).map(page => `<url><loc>${escape(new URL(page.key === 'pocetna' ? './' : page.file, siteURL).href)}</loc></url>`).join('\n');
  await writeFile(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /.template-backup/\nDisallow: /docs/\nDisallow: /scripts/\nDisallow: /content/\nDisallow: /partials/\nSitemap: ${new URL('sitemap.xml', siteURL).href}\n`);
} else await writeFile(path.join(root, 'robots.txt'), '# Lokalna priprema: produkcioni domen nije podešen.\nUser-agent: *\nDisallow: /\n');
