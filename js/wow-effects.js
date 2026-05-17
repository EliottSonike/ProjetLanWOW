'use strict';

/* ================================================================
   WOW EFFECTS — Cursor Trail · Scrolling Combat Text · Loot Beam
================================================================ */
(function () {

  /* ── 1. CURSOR TRAIL ─────────────────────────────────────────── */
  (function cursorTrail() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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


  /* ── 3. LOOT BEAM ────────────────────────────────────────────── */
  /* Approche : décorer le .equip-slot lui-même (pas wraper le <a>)
     pour ne pas casser la structure attendue par Wowhead power.js    */
  (function lootBeam() {
    const LEGENDARY_IDS = new Set([
      '17182','19019','22589','32837','32838',
      '45038','49623','71086','77941','77942',
    ]);

    const css = document.createElement('style');
    css.textContent = `
      @keyframes lb-shimmer {
        0%,100% { opacity:.14; }
        50%      { opacity:.32; }
      }
      @keyframes lb-glow-pulse {
        0%,100% { opacity:.2; }
        50%      { opacity:.45; }
      }
      .equip-slot.has-loot-beam {
        position: relative;
        overflow: visible;
      }
      .equip-slot.has-loot-beam::before {
        content: '';
        position: absolute;
        left: 50%; top: -90px;
        transform: translateX(-50%);
        width: 14px; height: 90px;
        background: linear-gradient(to bottom, transparent 0%, var(--lbc, #a335ee) 60%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0;
        transition: opacity .22s;
        animation: lb-shimmer 2s ease-in-out infinite;
        filter: blur(4px);
        z-index: 5;
      }
      .equip-slot.has-loot-beam::after {
        content: '';
        position: absolute;
        left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        width: 56px; height: 56px;
        background: radial-gradient(circle, var(--lbc, #a335ee) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0;
        transition: opacity .22s;
        animation: lb-glow-pulse 2s ease-in-out infinite;
        filter: blur(8px);
        z-index: 4;
      }
      .equip-slot.has-loot-beam:hover::before,
      .equip-slot.has-loot-beam:hover::after { opacity: 1; }
    `;
    document.head.appendChild(css);

    function decorateSlots() {
      document.querySelectorAll('.equip-slot').forEach(slot => {
        const a = slot.querySelector('a[href*="wowhead"]');
        if (!a) return;
        const id    = (a.href.match(/item=(\d+)/) || [])[1];
        const color = LEGENDARY_IDS.has(id) ? '#ff8000' : '#a335ee';
        slot.classList.add('has-loot-beam');
        slot.style.setProperty('--lbc', color);
      });
    }

    /* Attendre que Wowhead power.js ait fini de traiter les liens
       (~800ms après DOMContentLoaded) pour ne pas interférer */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(decorateSlots, 900));
    } else {
      setTimeout(decorateSlots, 900);
    }
  })();

})();
