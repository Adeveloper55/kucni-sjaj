/* Two spaces, four images. Dirty 2000ms -> clean wipe 1400ms -> clean 2600ms. */
(() => {
  'use strict';
  const root = document.getElementById('hero-comparison');
  if (!root) return;
  const hand = root.querySelector('.wipe-hand');
  const stage = hand && hand.querySelector('.wipe-hand-stage');
  if (hand && stage && window.lottie) {
    hand.style.setProperty('--wipe-ms', (Number(root.dataset.beforeDelay) || 2000) + 'ms');
    window.lottie.loadAnimation({
      container: stage,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'js/wipe-hand.json',
    });
  }
  const scenes = [...root.querySelectorAll('.comparison-scene')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timings = { before: Number(root.dataset.beforeDelay), revealing: Number(root.dataset.revealDuration), after: Number(root.dataset.cleanHold), switching: 650 };
  let index = 0, phase = 'before', elapsed = 0, start = 0, frame, arming = false;
  let motionPaused = motion.matches, hidden = document.hidden, ready = false, outside = false;
  const narrow = window.matchMedia('(max-width: 991px)');
  const copy = document.querySelector('.hero-copy');
  function placeHand() {
    if (!hand) return;
    if (!copy || !narrow.matches) {
      hand.style.removeProperty('top');
      return;
    }
    const area = root.getBoundingClientRect();
    const box = copy.getBoundingClientRect();
    const top = Math.max(12, box.bottom - area.top + 18);
    const limit = Math.max(12, area.height - 136 - 76);
    hand.style.top = Math.min(top, limit) + 'px';
  }
  function loadImage(image) {
    if (!image.getAttribute('src') && image.dataset.src) {
      image.src = narrow.matches && image.dataset.srcSmall ? image.dataset.srcSmall : image.dataset.src;
    }
    if (image.decode) return image.decode().catch(() => {});
    if (image.complete && image.naturalWidth) return Promise.resolve();
    return new Promise(resolve => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });
  }
  const ensureScene = sceneIndex => Promise.all([...scenes[sceneIndex].querySelectorAll('img')].map(loadImage));

  function render() {
    root.dataset.pair = scenes[index].dataset.scene;
    root.dataset.phase = phase;
    root.dataset.paused = String(motionPaused || hidden || outside);
    scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === index));
    if (hand) hand.classList.toggle('is-wiping', phase === 'before' && ready && !motionPaused && !hidden && !outside);
    placeHand();
  }
  function paint(progress) {
    scenes[index].style.setProperty('--clean-progress', String(progress));
  }
  function advance() {
    if (phase === 'before') phase = 'revealing';
    else if (phase === 'revealing') { phase = 'after'; paint(1); }
    else if (phase === 'after') {
      if (arming) return;
      const next = (index + 1) % scenes.length;
      arming = true;
      ensureScene(next).then(() => {
        arming = false;
        if (phase !== 'after') return;
        index = next;
        phase = 'switching';
        paint(0);
        elapsed = 0;
        render();
      });
      return;
    } else phase = 'before';
    elapsed = 0;
    render();
  }
  function tick(now) {
    if (motionPaused || hidden || outside || !ready) return;
    elapsed += now - start;
    start = now;
    if (elapsed >= timings[phase]) advance();
    if (phase === 'revealing') {
      const p = Math.min(elapsed / timings.revealing, 1);
      paint(p * p * (3 - 2 * p));
    }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    render();
    if (!motionPaused && !hidden && !outside && ready) {
      start = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; schedule(); });
  motion.addEventListener('change', event => { motionPaused = event.matches; schedule(); });
  window.addEventListener('resize', placeHand);
  narrow.addEventListener('change', placeHand);
  new IntersectionObserver(entries => {
    outside = !entries[0].isIntersecting;
    schedule();
  }, { threshold: 0 }).observe(root);
  // Start the two-second hold only when all four frames can be displayed without a flash.
  ensureScene(0).then(() => {
    ready = true;
    schedule();
    ensureScene((index + 1) % scenes.length);
  }).catch(() => {
    // The original first photo remains visible; never reveal an unloaded image.
    root.dataset.phase = 'unavailable';
  });
  render();
})();
