'use strict';

/* ================================================================
   WOW EFFECTS — Cursor Trail · Scrolling Combat Text · Loot Beam
================================================================ */
(function () {

  /* ── 1. CURSOR TRAIL ─────────────────────────────────────────── */
  (function cursorTrail() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const COLORS = ['#c8a96e', '#ffd700', '#fffbe0', '#f0c040', '#e8d48c', '#fff8c0'];
    const MAX = 22;
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

      const d    = dots[idx++ % MAX];
      const size = 3 + Math.random() * 7;
      const col  = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dx   = (Math.random() - 0.5) * 14;
      const dy   = -(8 + Math.random() * 12);

      d.style.cssText = `
        position:fixed;pointer-events:none;z-index:9997;border-radius:50%;
        width:${size}px;height:${size}px;
        left:${e.clientX - size / 2}px;top:${e.clientY - size / 2}px;
        background:radial-gradient(circle at 38% 38%, #fff 0%, ${col} 45%, transparent 80%);
        box-shadow:0 0 ${size * 1.5}px ${col};
        opacity:.9;
        transition:opacity .5s ease, transform .5s ease;
        transform:translate(0,0) scale(1);
        will-change:opacity,transform;
      `;
      d.getBoundingClientRect(); /* force reflow */
      d.style.opacity   = '0';
      d.style.transform = `translate(${dx}px,${dy}px) scale(0.05)`;
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
    };

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function fire(x, y, text, color) {
      const el = document.createElement('div');
      el.className = 'sct-el';
      el.textContent = text;
      el.style.left  = x + 'px';
      el.style.top   = (y - 10) + 'px';
      el.style.color = color;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1450);
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

      /* Kill tracker / RNG buttons */
      if (e.target.matches('#kt-submit, #kt-submit *')) {
        fire(e.clientX, e.clientY - 20, pick(MSGS.btn), '#ffd700'); return;
      }
      if (e.target.matches('#roll-btn, #roll-btn *')) {
        fire(e.clientX, e.clientY - 20, pick(MSGS.roll), '#c8a96e'); return;
      }
      if (e.target.matches('#ds-btn, #ds-btn *')) {
        fire(e.clientX, e.clientY - 20, pick(MSGS.btn), '#9945ff'); return;
      }
    });
  })();

})();
