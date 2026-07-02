const Layout = (function () {
  const V = '20260702';

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
      '\n    <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '\n    <nav class="main-nav">' +
      '\n      <a href="' + b + 'swaggeurs.html"' + sw + '>Swaggeurs</a>' +
      '\n      <a href="' + b + 'carte.html"' + sc + '>Carte des Raids</a>' +
      '\n      <a href="' + b + 'strategies/index.html"' + st + '>Stratégies</a>' +
      '\n      <a href="' + b + 'progression.html"' + sp + '>Progression</a>' +
      '\n      <a href="' + b + 'hall-of-shame.html"' + sh + '>Hall of Shame</a>' +
      '\n      <a href="' + b + 'stats.html"' + ss + '>Stats</a>' +
      '\n      <a href="' + b + 'kill-tracker.html"' + sk + '>Kill Tracker</a>' +
      '\n      <a href="' + b + 'rng.html"' + sr + '>RNG</a>' +
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

    document.addEventListener('DOMContentLoaded', function() {
      var btn = document.getElementById('nav-hamburger');
      var hdr = document.querySelector('.site-header');
      if (!btn || !hdr) return;
      btn.addEventListener('click', function() {
        hdr.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', hdr.classList.contains('nav-open').toString());
      });
      document.addEventListener('click', function(e) {
        if (hdr.classList.contains('nav-open') && !hdr.contains(e.target)) {
          hdr.classList.remove('nav-open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function footer(cfg) {
    const b = cfg.baseUrl || '';
    // document.write est sûr ici : footer() est toujours appelé pendant le parsing initial
    // Les scripts <defer> écrits via document.write s'exécutent dans l'ordre garanti par le parseur
    document.write(
      '\n<footer class="site-footer">' +
      '\n  <p>LAN Du Swag \xB7 Juillet 2026 \xB7 <em>Vive les gobelins et les gnomes!</em></p>' +
      '\n</footer>' +
      '\n<script defer src="' + b + 'js/main.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/discord-widget.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/particles.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/rotation-visual.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/boss-maps.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/live-data.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/side-deco.js?v=' + V + '"><\/script>' +
      '\n<script defer src="' + b + 'js/wow-effects.js?v=' + V + '"><\/script>' +
      '\n<script>const whTooltips = {colorLinks: true, iconizeLinks: true, iconSize: \'large\', hide: {sellprice: true, ddmoreinfo: true}};<\/script>' +
      '\n<script defer src="https://wow.zamimg.com/widgets/power.js"><\/script>'
    );
  }

  // ── Toast WoW global ────────────────────────────────────────────────
  window.wowToast = function(title, msg, icon = '⚔️', duration = 5000) {
    let container = document.getElementById('wow-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wow-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'wow-toast';
    toast.style.setProperty('--duration', duration + 'ms');
    toast.innerHTML =
      '<div class="wow-toast-icon">' + icon + '</div>' +
      '<div class="wow-toast-body">' +
        '<div class="wow-toast-title">' + title + '</div>' +
        '<div class="wow-toast-msg">' + msg + '</div>' +
      '</div>' +
      '<div class="wow-toast-bar"></div>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  return { header, footer };

})();
