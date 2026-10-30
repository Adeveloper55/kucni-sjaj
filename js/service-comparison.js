/* One dirty/clean pair per service card. Hold, wipe, hold, repeat. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.service-compare')];
  if (!cards.length) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  cards.forEach((root, index) => {
    const before = Number(root.dataset.beforeDelay) || 2000;
    const revealing = Number(root.dataset.revealDuration) || 1400;
    const after = Number(root.dataset.cleanHold) || 2600;
    const timings = { before, revealing, after };
    const total = before + revealing + after;
    let rest = (index * 900) % total;
    let phase = 'before';
    if (rest >= before + revealing) { phase = 'after'; rest -= before + revealing; }
    else if (rest >= before) { phase = 'revealing'; rest -= before; }
    let elapsed = rest;
    let start = 0;
    let frame = 0;
    let ready = false;
    let hidden = document.hidden;
    let outside = true;
    let motionPaused = motion.matches;

    function paint(progress) {
      root.style.setProperty('--clean-progress', String(progress));
    }
    function render() {
      root.dataset.phase = motionPaused ? 'after' : phase;
      root.dataset.paused = String(motionPaused || hidden || outside || !ready);
    }
    function advance() {
      if (phase === 'before') phase = 'revealing';
      else if (phase === 'revealing') { phase = 'after'; paint(1); }
      else { phase = 'before'; paint(0); }
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
      if (motionPaused) paint(1);
      else if (phase === 'before') paint(0);
      else if (phase === 'after') paint(1);
      else {
        const p = Math.min(elapsed / revealing, 1);
        paint(p * p * (3 - 2 * p));
      }
      render();
      if (!motionPaused && !hidden && !outside && ready) {
        start = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    document.addEventListener('visibilitychange', () => { hidden = document.hidden; schedule(); });
    motion.addEventListener('change', event => { motionPaused = event.matches; schedule(); });
    let primed = false;
    function prime() {
      if (primed) return;
      primed = true;
      Promise.all([...root.querySelectorAll('img')].map(image => {
        if (image.complete && image.naturalWidth) return Promise.resolve();
        const done = image.decode ? image.decode().catch(() => {}) : Promise.resolve();
        return done.then(() => {
          if (image.complete) return;
          return new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        });
      })).then(() => {
        ready = true;
        schedule();
      });
    }
    new IntersectionObserver(entries => {
      outside = !entries[0].isIntersecting;
      if (!outside) prime();
      schedule();
    }, { rootMargin: '240px 0px', threshold: 0.01 }).observe(root);
    render();
  });
})();
