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
  const dropdowns = [...menu.querySelectorAll('.nav-dropdown')];
  let returnFocus;
  function setDropdown(item, open) {
    // is-open = our accordion; open = theme style.css mobile submenu display
    item.classList.toggle('is-open', open);
    item.classList.toggle('open', open);
    const btn = item.querySelector('.nav-dropdown-toggle');
    if (btn) btn.setAttribute('aria-expanded', String(open));
  }
  function closeDropdowns(except) {
    dropdowns.forEach(item => {
      if (item !== except) setDropdown(item, false);
    });
  }
  function dropdownParentLink(item) {
    return item.querySelector('.nav-dropdown-trigger > a') || item.querySelector(':scope > a');
  }
  function toggleDropdown(item) {
    const next = !item.classList.contains('is-open');
    closeDropdowns(item);
    setDropdown(item, next);
  }
  function setMenu(open, restoreFocus = true) {
    menu.classList.toggle('show', open);
    toggler.classList.toggle('open', open);
    document.body.classList.toggle('fixed', open);
    toggler.setAttribute('aria-expanded', String(open));
    toggler.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    document.querySelector('main').inert = open;
    document.querySelector('footer').inert = open;
    if (!open) closeDropdowns();
    if (open) { returnFocus = document.activeElement; close.focus(); }
    else if (restoreFocus && returnFocus) returnFocus.focus();
  }
  // Desktop + mobile: click-toggle sticky open. No mouseleave close.
  dropdowns.forEach(item => {
    const btn = item.querySelector('.nav-dropdown-toggle');
    const parentLink = dropdownParentLink(item);
    if (btn) {
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(item);
      });
    }
    if (parentLink) {
      parentLink.addEventListener('click', event => {
        // Toggle list; "Sve usluge" in the submenu is the overview page link.
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(item);
      });
    }
    item.querySelectorAll('.sub-menu a').forEach(link => {
      link.addEventListener('click', () => {
        setDropdown(item, false);
        if (breakpoint.matches) window.setTimeout(() => setMenu(false, false), 0);
      });
    });
  });
  toggler.addEventListener('click', () => setMenu(!menu.classList.contains('show')));
  close.addEventListener('click', () => setMenu(false));
  overlay.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const openDropdown = dropdowns.find(item => item.classList.contains('is-open'));
      if (openDropdown) {
        setDropdown(openDropdown, false);
        const btn = openDropdown.querySelector('.nav-dropdown-toggle');
        if (btn) btn.focus();
        event.preventDefault();
        return;
      }
      if (breakpoint.matches && menu.classList.contains('show')) setMenu(false);
      return;
    }
    if (!breakpoint.matches || !menu.classList.contains('show')) return;
    if (event.key === 'Tab') {
      const focusable = [...menu.querySelectorAll('button:not(:disabled), a[href]')].filter(el => {
        if (el.closest('.sub-menu') && !el.closest('.nav-dropdown.is-open')) return false;
        return true;
      });
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  // Outside click closes desktop sticky dropdown (trigger + panel are inside .nav-dropdown).
  document.addEventListener('pointerdown', event => {
    if (breakpoint.matches) return;
    if (event.target.closest('.nav-dropdown')) return;
    closeDropdowns();
  });
  breakpoint.addEventListener('change', () => {
    closeDropdowns();
    setMenu(false, false);
  });
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
