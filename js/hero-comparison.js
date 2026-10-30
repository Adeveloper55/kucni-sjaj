/* Two spaces, four images. Dirty 2000ms -> clean wipe 1400ms -> clean 2600ms. */
(() => {
  'use strict';
  const root = document.getElementById('hero-comparison');
  if (!root) return;
  const scenes = [...root.querySelectorAll('.comparison-scene')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timings = { before: Number(root.dataset.beforeDelay), revealing: Number(root.dataset.revealDuration), after: Number(root.dataset.cleanHold), switching: 650 };
  let index = 0, phase = 'before', elapsed = 0, start = 0, frame;
  let motionPaused = motion.matches, hidden = document.hidden, ready = false, outside = false;

  function render() {
    root.dataset.pair = scenes[index].dataset.scene;
    root.dataset.phase = phase;
    root.dataset.paused = String(motionPaused || hidden || outside);
    scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === index));
  }
  function paint(progress) {
    scenes[index].style.setProperty('--clean-progress', String(progress));
  }
  function advance() {
    if (phase === 'before') phase = 'revealing';
    else if (phase === 'revealing') { phase = 'after'; paint(1); }
    else if (phase === 'after') {
      index = (index + 1) % scenes.length;
      phase = 'switching';
      paint(0);
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
  new IntersectionObserver(entries => {
    outside = !entries[0].isIntersecting;
    schedule();
  }, { threshold: 0 }).observe(root);
  // Start the two-second hold only when all four frames can be displayed without a flash.
  Promise.all([...root.querySelectorAll('img')].map(image => image.decode())).then(() => {
    ready = true; schedule();
  }).catch(() => {
    // The original first photo remains visible; never reveal an unloaded image.
    root.dataset.phase = 'unavailable';
  });
  render();
})();
