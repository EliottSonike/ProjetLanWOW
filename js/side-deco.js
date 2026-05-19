'use strict';

(function () {

  const RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚾ','ᛁ','ᛇ','ᛊ','ᛏ','ᛒ','ᛖ','ᛚ','ᛟ'];

  const QUOTES = [
    { text: 'Frostmourne hungers.',         author: '— Arthas Menethil' },
    { text: 'You are not prepared!',        author: '— Illidan Stormrage' },
    { text: 'Death comes for you.',         author: '— Le Roi-Liche' },
    { text: 'Suffer, mortals.',             author: '— Sindragosa' },
    { text: 'Lok\'tar Ogar!',              author: '— Cri de guerre Horde' },
    { text: 'For the Alliance!',            author: '— Varian Wrynn' },
    { text: 'Power is everything.',         author: '— Illidan Stormrage' },
    { text: 'We are all his soldiers.',     author: '— Yogg-Saron' },
    { text: 'This world will be reborn.',  author: '— Le Roi-Liche' },
    { text: 'Your soul is mine.',           author: '— Arthas Menethil' },
  ];

  const LEFT_ICONS = [
    { file: 'classes-warlock-affliction.webp', name: 'Alban' },
    { file: 'classes-paladin-protection.webp', name: 'Maël' },
  ];

  const RIGHT_ICONS = [
    { file: 'classes-mage-fire.webp',              name: 'Eliott' },
    { file: 'classes-hunter-marksmanship.webp',   name: 'Fabien' },
    { file: 'classes-paladin-holy.webp',           name: 'Tristan' },
  ];

  function getBase() {
    const ss = document.querySelector('link[href*="style.css"]');
    if (!ss) return '';
    return ss.getAttribute('href').replace('css/style.css', '');
  }

  function pickRune() {
    return RUNES[Math.floor(Math.random() * RUNES.length)];
  }

  function createColumn(side, icons, quoteIdx) {
    const base  = getBase();
    const quote = QUOTES[quoteIdx % QUOTES.length];
    const el    = document.createElement('div');
    el.className = `sd sd--${side}`;
    el.setAttribute('aria-hidden', 'true');

    // Gem haut
    const gemTop = document.createElement('div');
    gemTop.className = 'sd-gem sd-gem--top';
    el.appendChild(gemTop);

    // Gem bas
    const gemBot = document.createElement('div');
    gemBot.className = 'sd-gem sd-gem--bottom';
    el.appendChild(gemBot);

    // Runes (4 positions fixes le long de la colonne)
    [12, 32, 58, 78].forEach((pct, i) => {
      const r = document.createElement('span');
      r.className = 'sd-rune';
      r.textContent = pickRune();
      r.style.cssText = `top:${pct}%;--delay:${(i * 0.9).toFixed(1)}s;--dur:${(3.2 + i * 0.6).toFixed(1)}s`;
      el.appendChild(r);
    });

    // Icônes de classe
    const step = 55 / Math.max(icons.length, 1);
    icons.forEach((icon, i) => {
      const img = document.createElement('img');
      img.className = 'sd-icon';
      img.src = `${base}assets/img/${icon.file}`;
      img.alt = icon.name;
      img.title = icon.name;
      img.style.cssText = `top:${22 + i * step}%;--delay:${(i * 1.3).toFixed(1)}s;--dur:${(3.8 + i * 0.55).toFixed(1)}s`;
      el.appendChild(img);
    });

    // Citation verticale
    const q = document.createElement('div');
    q.className = 'sd-quote';
    q.innerHTML =
      `<span class="sd-qt">${quote.text}</span>` +
      `<span class="sd-qa">${quote.author}</span>`;
    el.appendChild(q);

    return el;
  }

  function inject() {
    if (window.innerWidth < 1480) return;
    if (document.querySelector('.sd')) return; // déjà injecté

    // Choisir la quote selon le jour (change chaque jour)
    const dayIdx = new Date().getDay();

    document.body.appendChild(createColumn('left',  LEFT_ICONS,  dayIdx));
    document.body.appendChild(createColumn('right', RIGHT_ICONS, dayIdx + 3));
  }

  function handleResize() {
    const cols = document.querySelectorAll('.sd');
    if (window.innerWidth < 1480) {
      cols.forEach(c => c.style.display = 'none');
    } else {
      if (cols.length === 0) { inject(); return; }
      cols.forEach(c => c.style.display = '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 180);
  });

})();
