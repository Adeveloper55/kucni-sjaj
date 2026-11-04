/* Basic consent mode: no Google requests before consent; no conversions on previews. */
(() => {
  'use strict';
  const config = window.SITE_CONFIG;
  if (!config?.GOOGLE_ADS_ID || !config.PHONE_CONVERSION_LABEL) return;
  let production;
  try { production = new URL(config.SITE_URL); } catch { return; }
  if (location.protocol !== 'https:' || location.hostname !== production.hostname) return;

  const key = 'ads-measurement-consent-v1';
  let allowed = false, loaded = false;
  let saved;
  try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied',
    ad_personalization: 'denied', analytics_storage: 'denied',
  });
  function apply(granted) {
    allowed = granted;
    window.gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: 'denied', analytics_storage: 'denied',
    });
    if (!granted || loaded) return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', config.GOOGLE_ADS_ID, {
      send_page_view: false, allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.GOOGLE_ADS_ID);
    document.head.append(script);
  }
  const panel = document.createElement('section');
  panel.className = 'measurement-consent';
  panel.setAttribute('aria-label', 'Merenje oglasa');
  panel.innerHTML = '<p>Dozvoljavate li Google Ads merenje poseta iz oglasa i klikova na telefon? Poziv radi i bez pristanka. <a href="politika-privatnosti.html">Privatnost</a></p><div><button type="button" data-measurement="yes">Dozvoli merenje</button><button type="button" data-measurement="no">Bez merenja</button></div>';
  panel.addEventListener('click', event => {
    const choice = event.target.closest('[data-measurement]');
    if (!choice) return;
    const granted = choice.dataset.measurement === 'yes';
    try { localStorage.setItem(key, JSON.stringify({ granted, expires: Date.now() + 180 * 86400000 })); } catch { /* Keep the choice in memory. */ }
    apply(granted);
    panel.hidden = true;
  });
  document.body.append(panel);
  if (saved && saved.expires > Date.now() && typeof saved.granted === 'boolean') {
    panel.hidden = true;
    apply(saved.granted);
  }
  const settings = document.createElement('button');
  settings.type = 'button'; settings.className = 'measurement-settings';
  settings.textContent = 'Podešavanja merenja oglasa';
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  document.querySelector('.footer-bottom-inner')?.append(settings);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="tel:"]');
    if (!allowed || !link || event.defaultPrevented) return;
    if (link.getAttribute('href') !== 'tel:' + config.PHONE_NUMBER.replace(/[^\d+]/g, '')) return;
    window.gtag('event', 'conversion', {
      send_to: config.GOOGLE_ADS_ID + '/' + config.PHONE_CONVERSION_LABEL,
      transport_type: 'beacon',
    });
  });
})();
