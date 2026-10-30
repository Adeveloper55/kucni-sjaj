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
  { key: 'politika-privatnosti', file: 'politika-privatnosti.html', label: 'Politika privatnosti', title: 'Politika privatnosti', description: 'Informacije o trenutnom stanju privatnosti i pripremi upita.', intro: 'Dokument u pripremi.', noindex: true },
  { key: 'uslovi-koriscenja', file: 'uslovi-koriscenja.html', label: 'Uslovi korišćenja', title: 'Uslovi korišćenja', description: 'Obaveštenje o pripremi sajta i dogovoru o čišćenju.', intro: 'Dokument u pripremi.', noindex: true },
];
for (const page of [...pages, ...legal]) {
  const home = page.key === 'pocetna';
  const content = await read(`content/${page.key}.html`);
  const canonical = siteURL ? new URL(home ? './' : page.file, siteURL).href : null;
  const navigation = pages.map(item => `<li><a href="${destinations[item.key]}"${item.key === page.key ? ' class="active" aria-current="page"' : ''}>${escape(item.label)}</a></li>`).join('\n');
  const schema = structuredClone(originalSchema);
  schema.name = config.brand;
  if (config.PHONE_NUMBER) schema.telephone = config.PHONE_NUMBER;
  if (config.EMAIL_ADDRESS) schema.email = config.EMAIL_ADDRESS;
  if (siteURL) schema.url = siteURL;
  const schemaTag = page.noindex ? '' : `<script type="application/ld+json" id="business-schema">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
  const seo = (page.noindex ? '<meta name="robots" content="noindex,follow">\n' : '') + (canonical ? `<link rel="canonical" href="${escape(canonical)}">\n<meta property="og:url" content="${escape(canonical)}">\n<meta property="og:image" content="${escape(new URL('images/main-slider/slide10.webp', siteURL).href)}">` : '<!-- TODO SITE_URL: canonical / og:url / sitemap await the confirmed production domain. -->');
  const sliderHead = home ? '<link rel="preload" as="image" href="images/hero-comparison/stan-prljav-1100.webp" media="(max-width: 991px)" fetchpriority="high"><link rel="preload" as="image" href="images/hero-comparison/stan-prljav.webp" media="(min-width: 992px)" fetchpriority="high">' : '';
  const banner = home ? '' : `<section class="page-banner" aria-labelledby="page-title"><div class="container-fluid"><nav aria-label="Putanja stranice"><ol class="breadcrumbs"><li><a href="./">Početna</a></li><li aria-current="page">${escape(page.label)}</li></ol></nav><h1 id="page-title">${escape(page.label === 'FAQ' ? 'Česta pitanja' : page.label)}</h1><p>${escape(page.intro)}</p></div></section>`;
  let html = template(head, { title: escape(page.title), description: escape(page.description), schema: schemaTag, seo, sliderHead });
  html += `<body id="bg" class="home-page ${home ? '' : 'inner-page'}" data-page="${page.key}">\n<a class="skip-link" href="#main">Preskoči na sadržaj</a>\n<div class="page-wraper page-wraper-full font-roboto btn-lsnone">\n`;
  html += template(header, { navigation }) + '\n<main id="main" class="page-content bg-white" tabindex="-1">\n' + banner + '\n' + content + '\n</main>\n' + footer;
  const pageScripts = home ? scripts.replace('<script defer src="js/custom.js">', sliderScripts + '\n<script defer src="js/custom.js">') : scripts;
  html += pageScripts + '\n</body>\n</html>\n';
  // Keep configuration ahead of site.js; all scripts are defer and execute in document order.
  html = contacts(brand(links(html)));
  await writeFile(path.join(root, page.file), html);
  if (home) await writeFile(path.join(root, 'index.html'), html);
}
if (siteURL) {
  const urls = pages.map(page => `<url><loc>${escape(new URL(page.key === 'pocetna' ? './' : page.file, siteURL).href)}</loc></url>`).join('\n');
  await writeFile(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /.template-backup/\nDisallow: /docs/\nDisallow: /scripts/\nDisallow: /content/\nDisallow: /partials/\nSitemap: ${new URL('sitemap.xml', siteURL).href}\n`);
} else await writeFile(path.join(root, 'robots.txt'), '# Lokalna priprema: produkcioni domen nije podešen.\nUser-agent: *\nDisallow: /\n');
