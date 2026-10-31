/* Service cards start dirty. Wipe 1 → 2 → 6, hold clean, then start again. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.service-compare')];
  if (!cards.length) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timings = { before: 700, revealing: 1200, after: 450, rest: 2200 };
  let index = 0;
  let phase = 'before';
  let elapsed = 0;
  let start = 0;
  let frame = 0;
  let ready = false;
  let hidden = document.hidden;
  let outside = false;
  let motionPaused = motion.matches;
  let handReady = false;

  function loadScript() {
    if (window.lottie) return Promise.resolve();
    const existing = document.querySelector('script[src="js/lottie.min.js"]');
    if (existing) {
      return new Promise(resolve => {
        if (window.lottie) return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', resolve, { once: true });
      });
    }
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'js/lottie.min.js';
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', resolve, { once: true });
      document.head.appendChild(script);
    });
  }

  function mountHands() {
    cards.forEach(root => {
      let hand = root.querySelector('.wipe-hand');
      if (!hand) {
        hand = document.createElement('div');
        hand.className = 'wipe-hand';
        hand.setAttribute('aria-hidden', 'true');
        hand.innerHTML = '<div class="wipe-hand-stage"></div>';
        root.appendChild(hand);
      }
      const stage = hand.querySelector('.wipe-hand-stage');
      hand.style.setProperty('--wipe-ms', timings.revealing + 'ms');
      if (stage && window.lottie && !stage.dataset.lottie) {
        stage.dataset.lottie = '1';
        window.lottie.loadAnimation({
          container: stage,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: 'js/wipe-hand.json',
        });
      }
    });
    handReady = true;
  }

  function paintCard(root, progress) {
    root.style.setProperty('--clean-progress', String(progress));
  }

  function render() {
    cards.forEach((root, i) => {
      const hand = root.querySelector('.wipe-hand');
      let progress = 0;
      let cardPhase = 'before';
      if (motionPaused) {
        progress = 1;
        cardPhase = 'after';
      } else if (phase === 'rest') {
        progress = 1;
        cardPhase = 'after';
      } else if (i < index) {
        progress = 1;
        cardPhase = 'after';
      } else if (i > index) {
        progress = 0;
        cardPhase = 'before';
      } else {
        cardPhase = phase;
        if (phase === 'before') progress = 0;
        else if (phase === 'after') progress = 1;
        else {
          const p = Math.min(elapsed / timings.revealing, 1);
          progress = p * p * (3 - 2 * p);
        }
      }
      paintCard(root, progress);
      root.dataset.phase = cardPhase;
      root.dataset.paused = String(motionPaused || hidden || outside || !ready);
      if (hand) {
        const wiping = handReady && !motionPaused && !hidden && !outside && ready && i === index && phase === 'revealing';
        hand.classList.toggle('is-wiping', wiping);
      }
    });
  }

  function advance() {
    if (phase === 'before') phase = 'revealing';
    else if (phase === 'revealing') phase = 'after';
    else if (phase === 'after') {
      if (index < cards.length - 1) {
        index += 1;
        phase = 'before';
      } else phase = 'rest';
    } else {
      index = 0;
      phase = 'before';
    }
    elapsed = 0;
    render();
  }

  function tick(now) {
    if (motionPaused || hidden || outside || !ready) return;
    elapsed += now - start;
    start = now;
    if (elapsed >= timings[phase]) advance();
    else if (phase === 'revealing') render();
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

  function decodeImages(root) {
    return Promise.all([...root.querySelectorAll('img')].map(image => {
      if (image.complete && image.naturalWidth) return Promise.resolve();
      const wait = image.decode ? image.decode().catch(() => {}) : Promise.resolve();
      return Promise.race([
        wait.then(() => {
          if (image.complete) return;
          return new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        }),
        new Promise(resolve => setTimeout(resolve, 1200)),
      ]);
    }));
  }

  document.addEventListener('visibilitychange', () => { hidden = document.hidden; schedule(); });
  motion.addEventListener('change', event => { motionPaused = event.matches; schedule(); });

  let primed = false;
  function prime() {
    if (primed) return;
    primed = true;
    loadScript().then(mountHands);
    decodeImages(cards[0]).finally(() => {
      ready = true;
      schedule();
      cards.slice(1).forEach(decodeImages);
    });
  }

  const grid = cards[0].closest('.service-grid') || cards[0];
  new IntersectionObserver(entries => {
    outside = !entries.some(entry => entry.isIntersecting);
    schedule();
  }, { rootMargin: '220px 0px', threshold: 0 }).observe(grid);

  prime();
  render();
})();
