const Layout = (function () {

  function inject(html) {
    // insertAdjacentHTML sur le script courant — remplace document.write()
    // Fonctionne pendant le parsing initial ET après, sans risquer d'effacer la page
    const s = document.currentScript || document.scripts[document.scripts.length - 1];
    s.insertAdjacentHTML('afterend', html);
  }

  function header(cfg) {
    const b   = cfg.baseUrl   || '';
    const nav = cfg.activeNav || '';
    const sw = nav === 'swaggeurs'    ? ' class="active"' : '';
    const sc = nav === 'carte'        ? ' class="active"' : '';
    const st = nav === 'strategies'   ? ' class="active"' : '';
    const sp = nav === 'progression'  ? ' class="active"' : '';
    const sh = nav === 'hall-of-shame'? ' class="active"' : '';
    const ss = nav === 'stats'        ? ' class="active"' : '';
    const sk = nav === 'kill-tracker' ? ' class="active"' : '';
    const sr = nav === 'rng'          ? ' class="active"' : '';

    // Favicon + fonts non-bloquantes
    const fav = document.createElement('link');
    fav.rel  = 'icon';
    fav.href = b + 'assets/img/icons8-world-of-warcraft-48.png';
    document.head.appendChild(fav);

    const fl = document.createElement('link');
    fl.rel  = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&display=swap';
    document.head.appendChild(fl);

    inject(
      '<div class="page-map-bg"></div><div class="ambient-overlay" aria-hidden="true"></div>' +
      '\n<header class="site-header">' +
      '\n  <div class="header-inner">' +
      '\n    <a href="' + b + 'index.html" class="header-brand">' +
      '\n      <div class="header-logo"><img src="' + b + 'assets/img/icons8-world-of-warcraft-48.png" alt="LOGO" class="site-logo"></div>' +
      '\n      <h1 class="site-title"><img src="' + b + 'assets/img/LanDuSwag.png" alt="LAN Du Swag" class="site-name"></h1>' +
      '\n    </a>' +
      '\n    <nav class="main-nav">' +
      '\n      <a href="' + b + 'swaggeurs.html"' + sw + '>Swaggeurs</a>' +
      '\n      <a href="' + b + 'carte.html"' + sc + '>Carte des Raids</a>' +
      '\n      <a href="' + b + 'strategies/index.html"' + st + '>Stratégies</a>' +
      '\n      <a href="' + b + 'progression.html"' + sp + '>Progression</a>' +
      '\n      <a href="' + b + 'hall-of-shame.html"' + sh + '>Hall of Shame</a>' +
      '\n      <a href="' + b + 'stats.html"' + ss + '>Stats</a>' +
      '\n      <a href="' + b + 'kill-tracker.html"' + sk + '>💀 Kill Tracker</a>' +
      '\n      <a href="' + b + 'rng.html"' + sr + '>🎲 RNG</a>' +
      '\n    </nav>' +
      '\n    <a href="https://discord.gg/n96wrGtenG" target="_blank" rel="noopener" class="nav-discord" id="nav-discord-btn">' +
      '\n      <svg viewBox="0 0 71 55" fill="none" class="nav-discord-logo"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.9a40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.4 0A40.4 40.4 0 0 0 25.5.9 58.4 58.4 0 0 0 10.8 4.9C1.6 18.6-.9 31.9.3 45A59 59 0 0 0 18.3 54a44.6 44.6 0 0 0 3.8-6.2 38.3 38.3 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.4 38.4 0 0 1-6 2.9A44.7 44.7 0 0 0 52.7 54a58.8 58.8 0 0 0 18-9C72 29.6 68.7 16.4 60.1 4.9ZM23.7 37a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Zm23.6 0a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Z" fill="currentColor"/></svg>' +
      '\n      <div class="nav-discord-info">' +
      '\n        <span class="nav-discord-label">La Taverne</span>' +
      '\n        <span class="nav-discord-status" id="nav-discord-status">Rejoindre →</span>' +
      '\n      </div>' +
      '\n      <span class="nav-discord-count" id="nav-discord-count"></span>' +
      '\n    </a>' +
      '\n  </div>' +
      '\n</header>'
    );
  }

  function footer(cfg) {
    const b = cfg.baseUrl || '';

    // Scripts injectés via createElement — plus robuste que document.write
    const frag = document.createDocumentFragment();

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = '<p>LAN Du Swag · Juillet 2026 · <em>Vive les gobelins et les gnomes!</em></p>';
    frag.appendChild(footer);

    [
      b + 'js/main.js',
      b + 'js/discord-widget.js',
      b + 'js/particles.js',
      b + 'js/rotation-visual.js',
      b + 'js/boss-maps.js',
      b + 'js/live-data.js',
      b + 'js/side-deco.js',
    ].forEach(function(src) {
      const s = document.createElement('script');
      s.src = src; s.defer = true;
      frag.appendChild(s);
    });

    // whTooltips doit être défini avant power.js
    const wh = document.createElement('script');
    wh.textContent = "const whTooltips = {colorLinks: true, iconizeLinks: true, iconSize: 'large', hide: {sellprice: true, ddmoreinfo: true}};";
    frag.appendChild(wh);

    const pw = document.createElement('script');
    pw.src = 'https://wow.zamimg.com/widgets/power.js'; pw.defer = true;
    frag.appendChild(pw);

    document.body.appendChild(frag);
  }

  return { header, footer };

})();
