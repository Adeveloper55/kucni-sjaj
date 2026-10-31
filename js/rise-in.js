/* Blagi uspon teksta, slika i kartica. Kontakt i wipe pre/posle ostaju netaknuti. */
(() => {
  'use strict';
  const body = document.body;
  if (!body || body.dataset.page === 'kontakt') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof IntersectionObserver !== 'function') return;
  const main = document.getElementById('main');
  if (!main) return;

  const selector = [
    'h1', 'h2', 'h3', 'p', 'li', 'img', 'figcaption',
    '.service-photo', '.dlab-content', '.step-card', '.services-style-3',
    '.moment-card', '.pricingtable-wrapper', '.faq-style2 .panel',
    '.cta-actions', '.trust-list'
  ].join(', ');

  function leaveAlone(node) {
    if (node.closest('.hero-copy, .hero-visual, .comparison-scene, .comparison-clean')) return true;
    if (node.matches('img, .comparison-before, .comparison-sweep, .wipe-hand') && node.closest('.service-compare')) return true;
    if (node.closest('[hidden]')) return true;
    return false;
  }

  try {
    const found = [...main.querySelectorAll(selector)].filter(node => !leaveAlone(node));
    const items = found.filter(node => !found.some(other => other !== node && other.contains(node)));
    if (!items.length) return;

    const viewBottom = window.innerHeight * 0.92;
    items.forEach(node => {
      node.classList.add('rise-item');
      if (node.matches('h1, h2, h3')) node.classList.add('from-top');
      else if (node.classList.contains('service-photo')) node.classList.add('rise-fade');
      const box = node.getBoundingClientRect();
      if (box.bottom > 0 && box.top < viewBottom) node.classList.add('is-in');
    });
    document.documentElement.classList.add('rise-ready');

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.sort((a, b) => {
        if (a.target === b.target) return 0;
        return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      visible.forEach((entry, index) => {
        entry.target.style.setProperty('--rise-delay', `${Math.min(index, 4) * 60}ms`);
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(node => observer.observe(node));

    window.setTimeout(() => {
      items.forEach(node => {
        if (node.classList.contains('is-in')) return;
        const box = node.getBoundingClientRect();
        if (box.bottom > 0 && box.top < window.innerHeight) {
          node.classList.add('is-in');
          observer.unobserve(node);
        }
      });
    }, 1600);
  } catch (error) {
    document.documentElement.classList.remove('rise-ready');
    main.querySelectorAll('.rise-item').forEach(node => {
      node.classList.remove('rise-item', 'rise-fade', 'is-in');
      node.style.removeProperty('--rise-delay');
    });
  }
})();
