'use strict';

const Particles = (function () {

  let canvas, ctx, list = [], raf, W, H;

  /* ── Détection du thème ─────────────────────────────────────── */
  function detectMode() {
    const cls  = document.body.dataset.class || '';
    const path = location.pathname.toLowerCase();

    if (path.includes('icc') || path.includes('naxx') || path.includes('ulduar') ||
        path.includes('toc') || path.includes('strategies') || path.includes('carte'))
      return 'snow';
    if (cls === 'mage')       return 'arcane';
    if (cls === 'warlock')    return 'fel';
    if (cls === 'paladin')    return 'holy';
    if (cls === 'deathknight')return 'frost';
    if (cls === 'hunter')     return 'nature';
    return 'magic';
  }

  /* ── Configs par mode ───────────────────────────────────────── */
  const CONFIGS = {
    snow: {
      count: 70,
      colors: ['rgba(200,230,255,{a})', 'rgba(255,255,255,{a})', 'rgba(180,210,255,{a})'],
      size:   [1, 4],
      speed:  [0.3, 1.2],
      drift:  [-0.4, 0.4],
      dir:    'down',
      glow:   false,
    },
    arcane: {
      count: 45,
      colors: ['rgba(105,204,240,{a})', 'rgba(180,240,255,{a})', 'rgba(60,150,220,{a})', 'rgba(255,255,255,{a})'],
      size:   [1, 3],
      speed:  [0.2, 0.8],
      drift:  [-0.3, 0.3],
      dir:    'up',
      glow:   true,
    },
    fel: {
      count: 40,
      colors: ['rgba(50,220,80,{a})', 'rgba(148,0,200,{a})', 'rgba(0,255,100,{a})', 'rgba(200,50,255,{a})'],
      size:   [1, 3.5],
      speed:  [0.2, 0.7],
      drift:  [-0.4, 0.4],
      dir:    'up',
      glow:   true,
    },
    holy: {
      count: 35,
      colors: ['rgba(245,200,80,{a})', 'rgba(255,240,150,{a})', 'rgba(255,220,100,{a})'],
      size:   [1, 3],
      speed:  [0.15, 0.6],
      drift:  [-0.2, 0.2],
      dir:    'up',
      glow:   true,
    },
    frost: {
      count: 55,
      colors: ['rgba(130,200,255,{a})', 'rgba(200,230,255,{a})', 'rgba(80,160,220,{a})'],
      size:   [1, 3.5],
      speed:  [0.2, 0.9],
      drift:  [-0.5, 0.5],
      dir:    'down',
      glow:   true,
    },
    nature: {
      count: 40,
      colors: ['rgba(100,220,80,{a})', 'rgba(180,255,100,{a})', 'rgba(60,180,60,{a})'],
      size:   [1, 3],
      speed:  [0.15, 0.6],
      drift:  [-0.3, 0.3],
      dir:    'up',
      glow:   false,
    },
    magic: {
      count: 30,
      colors: ['rgba(160,120,220,{a})', 'rgba(200,180,255,{a})', 'rgba(100,180,240,{a})'],
      size:   [1, 2.5],
      speed:  [0.1, 0.5],
      drift:  [-0.2, 0.2],
      dir:    'up',
      glow:   false,
    },
  };

  /* ── Helpers ────────────────────────────────────────────────── */
  const rand  = (a, b) => a + Math.random() * (b - a);
  const pick  = arr    => arr[Math.floor(Math.random() * arr.length)];
  const color = (tpl, a) => tpl.replace('{a}', a.toFixed(2));

  /* ── Création de particule ──────────────────────────────────── */
  function makeParticle(cfg, forceY) {
    const down = cfg.dir === 'down';
    return {
      x:     rand(0, W),
      y:     forceY !== undefined ? forceY : (down ? rand(-20, H) : rand(0, H + 20)),
      r:     rand(...cfg.size),
      vx:    rand(...cfg.drift),
      vy:    rand(...cfg.speed) * (down ? 1 : -1),
      alpha: rand(0.3, 0.9),
      da:    rand(-0.003, 0.003),
      color: pick(cfg.colors),
      wave:  rand(0, Math.PI * 2),
    };
  }

  /* ── Animation ──────────────────────────────────────────────── */
  function animate(cfg) {
    const down = cfg.dir === 'down';

    function tick() {
      if (document.hidden) { raf = requestAnimationFrame(tick); return; }

      ctx.clearRect(0, 0, W, H);

      for (const p of list) {
        /* mouvement */
        p.wave += 0.02;
        p.x += p.vx + Math.sin(p.wave) * 0.3;
        p.y += p.vy;
        p.alpha = Math.max(0.1, Math.min(0.9, p.alpha + p.da));

        /* reset si hors écran */
        if (down) {
          if (p.y > H + 10) { p.y = -10; p.x = rand(0, W); }
        } else {
          if (p.y < -10) { p.y = H + 10; p.x = rand(0, W); }
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        /* dessin */
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.7;

        if (cfg.glow) {
          ctx.shadowColor  = color(p.color, 1);
          ctx.shadowBlur   = p.r * 3;
        }

        ctx.fillStyle = color(p.color, p.alpha);
        ctx.beginPath();

        /* flocon de neige = carré diamant, sinon cercle */
        if (cfg === CONFIGS.snow && p.r > 2) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.wave);
          ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
          ctx.restore();
        } else {
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    }

    tick();
  }

  /* ── Resize ─────────────────────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── Init publique ──────────────────────────────────────────── */
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '0',
      opacity: '0.65',
    });
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resize();

    const mode = detectMode();
    const cfg  = CONFIGS[mode] || CONFIGS.magic;

    for (let i = 0; i < cfg.count; i++) {
      list.push(makeParticle(cfg));
    }

    animate(cfg);
    window.addEventListener('resize', resize);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Particles.init);
