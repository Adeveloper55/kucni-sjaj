/* Active index-5 behavior. Original retained in .template-backup. */
(() => {
  'use strict';
  const legacyPages = { usluge: 'usluge.html', cenovnik: 'cenovnik.html', 'kako-funkcionise': 'kako-funkcionise.html', 'o-nama': 'o-nama.html', faq: 'faq.html', kontakt: 'kontakt.html', zakazivanje: 'kontakt.html#zakazivanje' };
  const oldHash = location.hash.slice(1);
  if (document.body.dataset.page === 'pocetna' && legacyPages[oldHash]) {
    location.replace(legacyPages[oldHash]);
    return;
  }
  const menu = document.getElementById('xMenuNav');
  if (!menu) return;
  const toggler = document.querySelector('.xmenu-toggler');
  const close = menu.querySelector('.close-menu');
  const overlay = document.querySelector('.menu-close.fade-overlay');
  const breakpoint = window.matchMedia('(max-width: 991px)');
  const sticky = document.querySelector('.sticky-header');
  const top = document.querySelector('.scroltop');
  let returnFocus;
  function setMenu(open, restoreFocus = true) {
    menu.classList.toggle('show', open);
    toggler.classList.toggle('open', open);
    document.body.classList.toggle('fixed', open);
    toggler.setAttribute('aria-expanded', String(open));
    toggler.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    document.querySelector('main').inert = open;
    document.querySelector('footer').inert = open;
    if (open) { returnFocus = document.activeElement; close.focus(); }
    else if (restoreFocus && returnFocus) returnFocus.focus();
  }
  toggler.addEventListener('click', () => setMenu(!menu.classList.contains('show')));
  close.addEventListener('click', () => setMenu(false));
  overlay.addEventListener('click', () => setMenu(false));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    if (!breakpoint.matches) return;
    // Close after the tap, so the link is not pulled away before the browser follows it.
    window.setTimeout(() => setMenu(false, false), 0);
  }));
  document.addEventListener('keydown', event => {
    if (!breakpoint.matches || !menu.classList.contains('show')) return;
    if (event.key === 'Escape') { setMenu(false); return; }
    if (event.key === 'Tab') {
      const focusable = [...menu.querySelectorAll('button:not(:disabled), a[href]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  breakpoint.addEventListener('change', () => setMenu(false, false));
  function onScroll() {
    sticky.classList.toggle('is-fixed', window.scrollY > 75);
    top.classList.toggle('is-visible', window.scrollY > 350);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  top.addEventListener('click', () => {
    document.querySelector('#pocetna').scrollIntoView();
    document.querySelector('.brand-mark').focus({ preventScroll: true });
  });
})();
