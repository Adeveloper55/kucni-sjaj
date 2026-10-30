/* Business configuration, accessible inquiry form and metadata. No simulated delivery. */
(() => {
  'use strict';
  const config = window.SITE_CONFIG;
  if (!config) return;
  document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = config.brand; });
  document.querySelectorAll('[data-brand-link]').forEach(node => node.setAttribute('aria-label', config.brand + ' — početna'));
  document.querySelectorAll('.current-year').forEach(node => { node.textContent = new Date().getFullYear(); });
  const configuredPhone = value => typeof value === 'string' && /^\+?[\d\s().-]{6,30}$/.test(value) && value.replace(/\D/g, '').length >= 6 && value.replace(/\D/g, '').length <= 15;
  const configuredEmail = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const channels = {
    phone: { key: 'PHONE_NUMBER', valid: configuredPhone, url: value => 'tel:' + value.replace(/[^\d+]/g, '') },
    whatsapp: { key: 'WHATSAPP_NUMBER', valid: configuredPhone, url: value => 'https://wa.me/' + value.replace(/\D/g, '') },
    viber: { key: 'VIBER_NUMBER', valid: configuredPhone, url: value => 'viber://chat?number=' + encodeURIComponent(value.replace(/[^\d+]/g, '')) },
    email: { key: 'EMAIL_ADDRESS', valid: configuredEmail, url: value => 'mailto:' + value },
  };
  Object.entries(channels).forEach(([name, channel]) => {
    const value = config[channel.key];
    if (!channel.valid(value)) return;
    document.querySelectorAll(`[data-contact-value="${channel.key}"]`).forEach(node => {
      const link = document.createElement('a'); link.href = channel.url(value); link.textContent = value; node.replaceChildren(link);
    });
    document.querySelectorAll(`[data-contact="${name}"]`).forEach(button => {
      const link = document.createElement('a'); link.href = channel.url(value); link.className = button.className;
      link.innerHTML = button.innerHTML; link.dataset.contact = name;
      if (name === 'phone') link.querySelector('[data-phone-hint]')?.remove();
      button.replaceWith(link);
    });
    if (name === 'phone') document.querySelectorAll('.contact-pending').forEach(node => { node.hidden = true; });
  });
  let productionURL;
  try { if (config.SITE_URL && new URL(config.SITE_URL).protocol === 'https:') productionURL = new URL(config.SITE_URL); } catch { /* No invented canonical. */ }
  const schema = document.getElementById('business-schema');
  if (schema) {
    const data = JSON.parse(schema.textContent); data.name = config.brand;
    if (configuredPhone(config.PHONE_NUMBER)) data.telephone = config.PHONE_NUMBER;
    if (configuredEmail(config.EMAIL_ADDRESS)) data.email = config.EMAIL_ADDRESS;
    if (productionURL) data.url = productionURL.href;
    schema.textContent = JSON.stringify(data);
  }
  if (productionURL && schema && !document.querySelector('link[rel="canonical"]')) {
    const pagePath = document.body.dataset.page === 'pocetna' ? './' : location.pathname.split('/').pop();
    const pageURL = new URL(pagePath, productionURL).href;
    const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = pageURL; document.head.append(canonical);
    for (const [property, value] of [['og:url', pageURL], ['og:image', new URL('images/main-slider/slide10.webp', productionURL).href]]) {
      const meta = document.createElement('meta'); meta.setAttribute('property', property); meta.content = value; document.head.append(meta);
    }
  }
  const form = document.getElementById('booking-form');
  if (!form) return;
  const fieldset = document.getElementById('booking-fields'), submit = document.getElementById('booking-submit');
  const status = document.getElementById('booking-status'), summary = document.getElementById('form-errors');
  const draft = document.getElementById('inquiry-draft'), draftText = document.getElementById('draft-text');
  const copyStatus = document.getElementById('copy-status');
  const fields = [...fieldset.querySelectorAll('input, select, textarea')];
  form.addEventListener('focusin', event => {
    document.body.classList.toggle('form-editing', event.target.matches('input, select, textarea'));
  });
  form.addEventListener('focusout', event => {
    if (!form.contains(event.relatedTarget)) document.body.classList.remove('form-editing');
  });
  let pending = false;
  fieldset.disabled = false;
  const today = () => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  };
  document.getElementById('date').min = today();
  const requestedService = new URLSearchParams(location.search).get('usluga');
  const serviceKeys = [...form.elements.service.options].map(option => option.value);
  if (serviceKeys.includes(requestedService)) form.elements.service.value = requestedService;
  else if (requestedService === 'kuhinja') {
    form.elements.service.value = 'ostalo';
    form.elements.message.value = 'Zanima me čišćenje kuhinje i kupatila.';
  }
  let endpoint;
  try {
    if (config.BOOKING_ENDPOINT) {
      const url = new URL(config.BOOKING_ENDPOINT, location.origin);
      if (url.origin === location.origin && url.pathname.startsWith('/api/')) endpoint = url;
    }
  } catch { /* Unconfigured: preparation only. */ }
  if (endpoint) {
    submit.firstChild.textContent = 'Pošalji upit ';
    document.getElementById('booking-availability').textContent = 'Upit šaljemo na dogovor. Termin i cena potvrđuju se naknadno.';
  }
  function errorFor(field) {
    const value = field.value.trim();
    if (field.required && !value) return field.id === 'service' ? 'Izaberite tip usluge.' : field.id === 'phone' ? 'Unesite telefon za kontakt.' : 'Unesite ime i prezime.';
    if (!value && !field.validity.badInput) return '';
    if (field.id === 'full-name' && value.length < 2) return 'Ime i prezime treba da sadrži najmanje 2 znaka.';
    if (field.id === 'phone' && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 6 || value.replace(/\D/g, '').length > 15)) return 'Unesite ispravan telefon (6–15 cifara, uz opcioni +).';
    if (field.id === 'email' && !field.validity.valid) return 'Unesite ispravnu email adresu.';
    if (field.id === 'area' && !field.validity.valid) return 'Unesite površinu veću od nule, u koracima od 0,5 m².';
    if (field.id === 'rooms' && !field.validity.valid) return 'Unesite ceo broj prostorija, najmanje 1.';
    if (field.id === 'date' && (value < today() || !field.validity.valid)) return 'Izaberite današnji ili budući datum.';
    if (!field.validity.valid) return 'Proverite unetu vrednost.';
    return '';
  }
  function validate(field) {
    const error = errorFor(field); field.setAttribute('aria-invalid', String(Boolean(error)));
    document.getElementById(field.id + '-error').textContent = error; return error;
  }
  function invalidateDraft() { draft.hidden = true; status.hidden = true; copyStatus.textContent = ''; }
  fields.forEach(field => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => { invalidateDraft(); if (field.hasAttribute('aria-invalid')) validate(field); });
    field.addEventListener('change', () => { invalidateDraft(); if (field.hasAttribute('aria-invalid')) validate(field); });
  });
  function showStatus(text, state) {
    status.textContent = text; status.dataset.state = state; status.hidden = false;
    status.focus({ preventScroll: true }); status.scrollIntoView({ block: 'nearest' });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (pending) return;
    document.getElementById('date').min = today(); summary.replaceChildren();
    const errors = fields.map(field => [field, validate(field)]).filter(([, error]) => error);
    summary.hidden = errors.length === 0;
    if (errors.length) {
      invalidateDraft();
      const title = document.createElement('p'); title.textContent = 'Proverite označena polja:'; summary.append(title);
      const list = document.createElement('ul');
      errors.forEach(([field, error]) => {
        const item = document.createElement('li'), link = document.createElement('a');
        link.href = '#' + field.id; link.textContent = error; link.addEventListener('click', () => field.focus()); item.append(link); list.append(item);
      });
      summary.append(list); errors[0][0].focus(); return;
    }
    const payload = Object.fromEntries(fields.map(field => [field.name, field.value.trim()]));
    if (!endpoint) {
      const values = fields.map(field => {
        const label = document.querySelector(`label[for="${field.id}"]`).textContent.replace(' *', '');
        const value = field.tagName === 'SELECT' ? field.selectedOptions[0].textContent : field.value.trim();
        return value ? `${label}: ${value}` : null;
      }).filter(Boolean);
      draftText.value = 'Upit za čišćenje — ' + config.brand + '\n' + values.join('\n'); draft.hidden = false;
      const contactHelp = configuredPhone(config.PHONE_NUMBER) ? 'Za dogovor koristite dostupan telefon, Viber ili WhatsApp.' : 'Kontakt kanali biće dodati uskoro.';
      showStatus('Podaci su spremni. Upit nije poslat i termin nije rezervisan. Možete kopirati pripremljeni upit. ' + contactHelp, 'prepared'); return;
    }
    pending = true; fieldset.disabled = true; form.setAttribute('aria-busy', 'true');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    showStatus('Šaljemo upit…', 'pending');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: controller.signal, credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Delivery not confirmed');
      form.reset(); draft.hidden = true; fields.forEach(field => field.removeAttribute('aria-invalid'));
      showStatus('Upit je poslat. Javićemo se radi dogovora. Termin još nije potvrđen.', 'success');
    } catch {
      showStatus('Upit nije poslat. Podaci su ostali u formi. Pokušajte ponovo ili koristite dostupan kontakt kanal.', 'error');
    } finally { clearTimeout(timer); pending = false; fieldset.disabled = false; form.removeAttribute('aria-busy'); }
  });
  document.getElementById('copy-inquiry').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(draftText.value); copyStatus.textContent = 'Upit je kopiran. Nije poslat.'; }
    catch { draftText.focus(); draftText.select(); copyStatus.textContent = 'Označite i kopirajte upit ručno.'; }
  });
})();
