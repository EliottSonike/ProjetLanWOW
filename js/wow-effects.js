'use strict';

/* ================================================================
   WOW EFFECTS — Cursor Trail · Scrolling Combat Text · Loot Beam
                 Screen Flash · Ambient Sparkles · Page Transition
================================================================ */

/* ── 0. RIDEAU DE TRANSITION WoW ────────────────────────────────
   Fonctionnement :
   - Clic lien interne : rideau glisse depuis la gauche (couvre) → navigate
   - Nouvelle page     : rideau déjà en place (sessionStorage) → glisse droite
   ─────────────────────────────────────────────────────────────── */
(function pageCurtain() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const DURATION_EXIT  = 360;  /* ms — rideau couvre l'écran avant navigation */
  const ENTER_DELAY    = 80;   /* ms — pause avant de dévoiler la nouvelle page */
  const SK             = 'wow-curtain-nav';  /* clé sessionStorage */

  /* ── Créer le rideau ── */
  const curtain = document.createElement('div');
  curtain.id = 'wow-curtain';

  /* Si on vient d'une navigation interne → couvrir dès l'insertion (avant le paint) */
  const fromNav = sessionStorage.getItem(SK);
  if (fromNav) {
    curtain.style.transform = 'translateX(0)';  /* couvre immédiatement */
    sessionStorage.removeItem(SK);
  }
  document.body.insertBefore(curtain, document.body.firstChild);

  /* Après insertion : si on vient d'une navigation → animer le retrait */
  if (fromNav) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        curtain.style.transform = '';        /* laisser CSS gérer */
        curtain.classList.add('wc-leaving'); /* animation de départ vers droite */
      }, ENTER_DELAY);
    });
  }

  /* ── Clic sur un lien interne → rideau en avant puis navigate ── */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link || link.target === '_blank') return;

    let href;
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      /* Ignorer les ancres (#) et les liens vers la même page */
      if (url.pathname === window.location.pathname
          && url.search === window.location.search) return;
      href = url.href;
    } catch { return; }

    e.preventDefault();

    /* Réinitialiser si une animation précédente tourne encore */
    curtain.classList.remove('wc-entering', 'wc-leaving');
    curtain.style.transform = 'translateX(-101%)';
    void curtain.offsetWidth;                       /* force reflow */

    sessionStorage.setItem(SK, '1');               /* signal pour la prochaine page */
    curtain.classList.add('wc-entering');
    setTimeout(() => { window.location.href = href; }, DURATION_EXIT);
  });
})();


(function () {

  /* ── 1. CURSOR TRAIL ─────────────────────────────────────────── */
  (function cursorTrail() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const COLORS = ['#c8a96e', '#ffd700', '#fffbe0', '#f0c040', '#e8d48c', '#fff8c0'];
    const RUNES  = ['✦', '⚡', '★', '◈', '✸', '❋', '⋆', '✴', '⟡', '✵'];
    const MAX    = 24;
    let idx = 0, lx = -999, ly = -999;

    const dots = Array.from({ length: MAX }, () => {
      const d = document.createElement('span');
      d.style.cssText = 'position:fixed;pointer-events:none;z-index:9997;border-radius:50%;';
      document.body.appendChild(d);
      return d;
    });

    document.addEventListener('mousemove', e => {
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 5) return;
      lx = e.clientX; ly = e.clientY;

      const d   = dots[idx++ % MAX];
      const col = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dx  = (Math.random() - 0.5) * 14;

      if (Math.random() < 0.30) {
        /* rune symbol */
        const rune = RUNES[Math.floor(Math.random() * RUNES.length)];
        const fs   = 9 + Math.random() * 9;
        const rot  = (Math.random() - 0.5) * 160;
        d.textContent = rune;
        d.style.cssText = `
          position:fixed;pointer-events:none;z-index:9997;border-radius:0;
          font-size:${fs}px;line-height:1;
          color:${col};
          left:${e.clientX - fs * 0.5}px;top:${e.clientY - fs * 0.5}px;
          text-shadow:0 0 8px ${col},0 0 18px ${col};
          opacity:.9;
          transition:opacity .65s ease,transform .65s ease;
          transform:translate(0,0) scale(1) rotate(0deg);
          will-change:opacity,transform;
        `;
        d.getBoundingClientRect();
        d.style.opacity   = '0';
        d.style.transform = `translate(${dx}px,-${18 + Math.random() * 22}px) scale(0.1) rotate(${rot}deg)`;
      } else {
        /* dot */
        const size = 3 + Math.random() * 7;
        const dy   = -(8 + Math.random() * 12);
        d.textContent = '';
        d.style.cssText = `
          position:fixed;pointer-events:none;z-index:9997;border-radius:50%;
          width:${size}px;height:${size}px;
          left:${e.clientX - size * 0.5}px;top:${e.clientY - size * 0.5}px;
          background:radial-gradient(circle at 38% 38%,#fff 0%,${col} 45%,transparent 80%);
          box-shadow:0 0 ${size * 1.5}px ${col};
          opacity:.9;
          transition:opacity .5s ease,transform .5s ease;
          transform:translate(0,0) scale(1);
          will-change:opacity,transform;
        `;
        d.getBoundingClientRect();
        d.style.opacity   = '0';
        d.style.transform = `translate(${dx}px,${dy}px) scale(0.05)`;
      }
    });
  })();


  /* ── 2. SCROLLING COMBAT TEXT ────────────────────────────────── */
  (function sct() {
    const css = document.createElement('style');
    css.textContent = `
      @keyframes sct-up {
        0%   { opacity:1; transform:translateX(-50%) translateY(0)     scale(1.2);  }
        18%  { opacity:1; transform:translateX(-50%) translateY(-18px)  scale(1.05); }
        100% { opacity:0; transform:translateX(-50%) translateY(-72px)  scale(.7);   }
      }
      .sct-el {
        position:fixed; pointer-events:none; z-index:9998;
        font-family:'Cinzel', serif; font-weight:700; font-size:1.05rem;
        white-space:nowrap; transform:translateX(-50%);
        text-shadow: 0 0 12px currentColor, 0 2px 6px rgba(0,0,0,.95);
        animation: sct-up 1.35s ease-out forwards;
      }
    `;
    document.head.appendChild(css);

    const MSGS = {
      easy:  ['Easy!', 'GG les boys!', '+50 DKP', 'Smooth pull!', 'No sweat!'],
      med:   ['Focus!', 'Attention!', 'Dodge!', 'Mécanique!', 'Stay spread!'],
      hard:  ['Danger!', 'WIPE incoming!', 'Il rage!', 'Dispersez-vous!', 'RUN!'],
      btn:   ['POSTÉ!', 'GG!', 'Let\'s go!', 'YEET!', 'SWAG!'],
      roll:  ['Roll lancé!', 'Que le RNG décide!', 'Bonne chance!'],
      kill:  ['KILL CONFIRMED!', 'LOOT TIME!', 'BOSS DOWN!', 'GG WP!', 'RAID CLEAR!'],
    };

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function fire(x, y, text, color, crit) {
      const el = document.createElement('div');
      el.className = crit ? 'sct-crit' : 'sct-el';
      el.textContent = text;
      el.style.left  = x + 'px';
      el.style.top   = (y - 10) + 'px';
      el.style.color = color;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), crit ? 1600 : 1450);
    }

    document.addEventListener('click', e => {
      /* Boss cards */
      const header = e.target.closest('.boss-card-header');
      if (header) {
        const badge = header.querySelector('[class*="diff-"]');
        const cls   = badge ? [...badge.classList].find(c => c.startsWith('diff-')) : '';
        if (cls === 'diff-easy')       fire(e.clientX, e.clientY, pick(MSGS.easy), '#69e06e');
        else if (cls === 'diff-hard')  fire(e.clientX, e.clientY, pick(MSGS.hard), '#f44336');
        else                           fire(e.clientX, e.clientY, pick(MSGS.med),  '#ffb74d');
        return;
      }

      /* Kill tracker */
      if (e.target.matches('#kt-submit, #kt-submit *')) {
        fire(e.clientX, e.clientY - 30, pick(MSGS.kill), '#ffd700', true);
        setTimeout(() => fire(e.clientX + 60, e.clientY, pick(MSGS.btn), '#ffd700'), 200);
        return;
      }
      /* RNG / misc buttons */
      if (e.target.matches('#roll-btn, #roll-btn *')) {
        fire(e.clientX, e.clientY - 20, pick(MSGS.roll), '#c8a96e'); return;
      }
      if (e.target.matches('#ds-btn, #ds-btn *')) {
        fire(e.clientX, e.clientY - 20, pick(MSGS.btn), '#9945ff'); return;
      }
    });
  })();


  /* ── 3. LOOT BEAM ────────────────────────────────────────────── */
  function fireLootBeam(x) {
    const beam = document.createElement('div');
    beam.className = 'loot-beam';
    beam.style.left = x + 'px';
    document.body.appendChild(beam);
    setTimeout(() => beam.remove(), 2400);
  }


  /* ── 4. SCREEN EDGE FLASH ────────────────────────────────────── */
  function fireScreenFlash(color) {
    const el = document.createElement('div');
    el.className = 'screen-flash';
    el.style.setProperty('--flash-color', color || 'rgba(255,165,0,0.5)');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }


  /* ── 5. HOOK KILL SUBMIT → loot beam + flash ─────────────────── */
  document.addEventListener('click', e => {
    if (e.target.matches('#kt-submit, #kt-submit *')) {
      const x = e.clientX;
      setTimeout(() => fireLootBeam(x), 120);
      setTimeout(() => fireScreenFlash('rgba(255,215,0,0.4)'), 60);
    }
  });


  /* ── 6. SCROLL-REVEAL (Intersection Observer) ───────────────── */
  (function scrollReveal() {
    /* Seules les cartes déjà dans le DOM au chargement sont animées.
       Les cartes injectées dynamiquement (armory, live-data) restent visibles normalement. */
    const cards = document.querySelectorAll('.content-card');
    if (!cards.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        setTimeout(() => el.classList.add('is-visible'), +(el.dataset.revealDelay || 0));
        io.unobserve(el);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    cards.forEach((card, i) => {
      card.classList.add('will-animate');
      card.dataset.revealDelay = Math.min((i % 4) * 80, 240);
      io.observe(card);
    });
  })();


  /* ── 7. HERO PARALLAX ───────────────────────────────────────── */
  (function heroParallax() {
    const hero    = document.querySelector('.hero-landing');
    const content = document.querySelector('.hero-content');
    if (!hero || !content) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    let cx = window.innerWidth  / 2;
    let cy = window.innerHeight / 2;
    let tx = 0, ty = 0, mx = cx, my = cy;
    let raf;

    hero.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    hero.addEventListener('mouseleave', () => { mx = cx; my = cy; });
    window.addEventListener('resize', () => {
      cx = window.innerWidth / 2; cy = window.innerHeight / 2;
    });

    function tick() {
      /* lerp toward mouse position offset from center */
      tx += ((mx - cx) - tx) * 0.06;
      ty += ((my - cy) - ty) * 0.06;
      const dx = tx / cx, dy = ty / cy;
      /* move hero-content (no existing CSS transform — safe to set directly) */
      content.style.transform = `translate(${dx * 10}px, ${dy * 6}px)`;
      raf = requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else tick();
    });

    tick();
  })();


  /* ── 8. AMBIENT SPARKLES ─────────────────────────────────────── */
  (function ambientSparkles() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:1;opacity:1;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLS = [
      'rgba(200,169,110,',
      'rgba(255,215,0,',
      'rgba(255,248,200,',
      'rgba(232,212,140,',
      'rgba(255,200,80,',
    ];
    const COUNT = 55;

    const particles = Array.from({ length: COUNT }, () => ({
      x:       Math.random() * (window.innerWidth  || 1200),
      y:       Math.random() * (window.innerHeight || 800),
      vy:      -(0.2 + Math.random() * 0.6),
      vx:      (Math.random() - 0.5) * 0.15,
      r:       1.2 + Math.random() * 2.4,
      alpha:   0.25 + Math.random() * 0.45,
      phase:   Math.random() * Math.PI * 2,
      speed:   0.01 + Math.random() * 0.02,
      col:     COLS[Math.floor(Math.random() * COLS.length)],
    }));

    let raf;
    function animate() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.y     += p.vy;
        p.x     += p.vx;
        p.phase += p.speed;
        if (p.y < -4)  { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4)  p.x = W + 4;
        if (p.x > W + 4) p.x = -4;

        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + a.toFixed(3) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else animate();
    });

    animate();
  })();

})();
