const Layout = (function () {

  function header(cfg) {
    const b   = cfg.baseUrl   || '';
    const nav = cfg.activeNav || '';
    const sw = nav === 'swaggeurs'   ? ' class="active"' : '';
    const sc = nav === 'carte'       ? ' class="active"' : '';
    const st = nav === 'strategies'  ? ' class="active"' : '';
    const sp = nav === 'progression' ? ' class="active"' : '';
    const sh = nav === 'hall-of-shame' ? ' class="active"' : '';

    document.write(
      '\n  <header class="site-header">' +
      '\n    <div class="header-inner">' +
      '\n      <a href="' + b + 'accueil.html" class="header-brand">' +
      '\n        <div class="header-logo"><img src="' + b + 'assets/img/icons8-world-of-warcraft-48.png" alt="LOGO" class="site-logo"></div>' +
      '\n        <h1 class="site-title">' +
      '\n          <img src="' + b + 'assets/img/LanDuSwag.png" alt="LAN Du Swag" class="site-name">' +
      '\n        </h1>' +
      '\n      </a>' +
      '\n      <nav class="main-nav">' +
      '\n        <a href="' + b + 'swaggeurs.html"' + sw + '>Swaggeurs</a>' +
      '\n        <a href="' + b + 'carte.html"' + sc + '>Carte des Raids</a>' +
      '\n        <a href="' + b + 'strategies/index.html"' + st + '>Stratégies</a>' +
      '\n        <a href="' + b + 'progression.html"' + sp + '>Progression</a>' +
      '\n        <a href="' + b + 'hall-of-shame.html"' + sh + '>Hall of Shame</a>' +
      '\n      </nav>' +
      '\n    </div>' +
      '\n  </header>\n'
    );
  }

  function footer(cfg) {
    const b = cfg.baseUrl || '';

    document.write(
      '\n  <footer class="site-footer">' +
      '\n    <p>LAN Du Swag · Juillet 2026 · <em>Vive les gobelins et les gnomes!</em></p>' +
      '\n  </footer>' +
      '\n\n  <script src="' + b + 'js/main.js"><\/script>' +
      '\n  <script>const whTooltips = {colorLinks: true, iconizeLinks: true, iconSize: \'large\', hide: {sellprice: true, ddmoreinfo: true}};<\/script>' +
      '\n  <script src="https://wow.zamimg.com/widgets/power.js"><\/script>\n'
    );
  }

  return { header, footer };

})();
