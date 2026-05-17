(function () {

  var HOS;

  var PLAYERS = [
    { name: 'Alban',   cls: 'warlock', spec: 'Affliction' },
    { name: 'Eliott',  cls: 'mage',    spec: 'Feu' },
    { name: 'Fabien',  cls: 'hunter',  spec: 'Précision' },
    { name: 'Maël',    cls: 'paladin', spec: 'Protection' },
    { name: 'Tristan', cls: 'paladin', spec: 'Holy' }
  ];

  /* ── per-player death stats ── */
  function calcStats() {
    var map = {};
    PLAYERS.forEach(function (p) { map[p.name] = { deaths: 0, wipes: 0, topCause: null, causes: {} }; });
    HOS.deaths.forEach(function (d) {
      if (!map[d.player]) return;
      var s = map[d.player];
      s.deaths++;
      if (d.wipe) s.wipes++;
      s.causes[d.cause] = (s.causes[d.cause] || 0) + 1;
    });
    PLAYERS.forEach(function (p) {
      var s = map[p.name];
      var top = null, max = 0;
      Object.keys(s.causes).forEach(function (c) { if (s.causes[c] > max) { max = s.causes[c]; top = c; } });
      s.topCause = top;
    });
    return map;
  }

  function shameTitle(deaths) {
    if (deaths === 0)  return 'Intouchable 😇';
    if (deaths <= 2)   return 'Prudent';
    if (deaths <= 5)   return 'Maladroit';
    if (deaths <= 10)  return 'Catastrophe';
    return '🔥 Légende du Fail';
  }

  /* ── hero ── */
  function heroHtml() {
    var total = HOS.deaths.length;
    var wipes = HOS.deaths.filter(function (d) { return d.wipe; }).length;
    var topFeeder = null, max = 0;
    var stats = calcStats();
    PLAYERS.forEach(function (p) { if (stats[p.name].deaths > max) { max = stats[p.name].deaths; topFeeder = p; } });

    return (
      '<section class="shame-hero">' +
        '<div class="shame-hero-skull">💀</div>' +
        '<div class="shame-hero-title">Hall of Shame</div>' +
        '<div class="shame-hero-sub">Chaque mort est une leçon. Chaque fail, une légende.</div>' +
        '<div class="shame-quick-stats">' +
          '<div class="shame-stat"><span class="shame-stat-val">' + total + '</span><span class="shame-stat-lbl">morts</span></div>' +
          '<div class="shame-stat"><span class="shame-stat-val">' + wipes + '</span><span class="shame-stat-lbl">wipes causés</span></div>' +
          '<div class="shame-stat"><span class="shame-stat-val">' + HOS.screenshots.length + '</span><span class="shame-stat-lbl">screenshots</span></div>' +
          '<div class="shame-stat"><span class="shame-stat-val ' + (topFeeder ? topFeeder.cls : '') + '">' + (topFeeder && max > 0 ? topFeeder.name : '—') + '</span><span class="shame-stat-lbl">plus grande victime</span></div>' +
        '</div>' +
      '</section>'
    );
  }

  /* ── death list ── */
  function deathListHtml() {
    if (HOS.deaths.length === 0) {
      return (
        '<div class="shame-empty">' +
          '<div class="shame-empty-icon">😇</div>' +
          '<div class="shame-empty-title">Aucun fail enregistré</div>' +
          '<div class="shame-empty-sub">La LAN n\'a pas encore commencé. Profitez-en.</div>' +
        '</div>'
      );
    }
    var sorted = HOS.deaths.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    return '<div class="death-list">' + sorted.map(function (d, i) {
      var player = PLAYERS.filter(function (p) { return p.name === d.player; })[0] || { cls: 'unknown' };
      var cause = d.causeId
        ? '<a href="https://www.wowhead.com/wotlk/spell=' + d.causeId + '" class="death-cause-link">' + d.cause + '</a>'
        : '<span>' + d.cause + '</span>';
      return (
        '<div class="death-card' + (d.wipe ? ' wipe' : '') + '">' +
          '<div class="death-index">#' + (i + 1) + '</div>' +
          '<div class="death-body">' +
            '<div class="death-header">' +
              '<span class="death-player ' + player.cls + '">' + d.player + '</span>' +
              '<span class="death-killed-by">tué par</span>' +
              '<span class="death-cause">' + cause + '</span>' +
              (d.wipe ? '<span class="death-wipe-badge">WIPE</span>' : '') +
            '</div>' +
            '<div class="death-meta">' + (d.boss ? d.boss + ' · ' : '') + (d.instance || '') + (d.date ? ' · ' + d.date : '') + '</div>' +
            (d.description ? '<div class="death-desc">"' + d.description + '"</div>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  /* ── screenshot grid ── */
  function screenshotHtml() {
    if (HOS.screenshots.length === 0) {
      return (
        '<div class="shame-empty">' +
          '<div class="shame-empty-icon">📷</div>' +
          '<div class="shame-empty-title">Aucun screenshot</div>' +
          '<div class="shame-empty-sub">Les moments épiques arrivent. Patience.</div>' +
        '</div>'
      );
    }
    var typeLabel = { kill: '⚔️ Kill', fail: '💥 Fail', moment: '✨ Moment' };
    return '<div class="shot-grid">' + HOS.screenshots.map(function (s) {
      var img = s.url
        ? '<img src="' + s.url + '" alt="' + s.title + '" class="shot-img">'
        : '<div class="shot-placeholder">📷</div>';
      return (
        '<div class="shot-card">' +
          img +
          '<div class="shot-info">' +
            '<div class="shot-header">' +
              '<span class="shot-title">' + s.title + '</span>' +
              '<span class="shot-type ' + (s.type || 'moment') + '">' + (typeLabel[s.type] || '✨ Moment') + '</span>' +
            '</div>' +
            (s.description ? '<div class="shot-desc">' + s.description + '</div>' : '') +
            '<div class="shot-meta">' + (s.player || 'Groupe') + (s.date ? ' · ' + s.date : '') + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  /* ── leaderboard ── */
  function leaderboardHtml() {
    var stats = calcStats();
    var sorted = PLAYERS.slice().sort(function (a, b) { return stats[b.name].deaths - stats[a.name].deaths; });
    var maxDeaths = stats[sorted[0].name].deaths || 1;

    return (
      '<div class="leaderboard">' +
      sorted.map(function (p, i) {
        var s = stats[p.name];
        var pct = Math.round(s.deaths / maxDeaths * 100);
        var rankCls = i === 0 && s.deaths > 0 ? ' rank-first' : '';
        return (
          '<div class="lb-row' + rankCls + '">' +
            '<span class="lb-rank">' + (i === 0 && s.deaths > 0 ? '💀' : '#' + (i + 1)) + '</span>' +
            '<span class="lb-player ' + p.cls + '">' + p.name + '</span>' +
            '<span class="lb-spec">' + p.spec + '</span>' +
            '<div class="lb-bar-wrap"><div class="lb-bar-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="lb-deaths">' + s.deaths + '</span>' +
            '<span class="lb-title">' + shameTitle(s.deaths) + '</span>' +
          '</div>'
        );
      }).join('') +
      '</div>'
    );
  }

  /* ── tab switch ── */
  window.switchShameTab = function (tab) {
    document.querySelectorAll('.shame-tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.shame-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'shame-' + tab);
    });
  };

  /* ── init ── */
  function init() {
    var container = document.getElementById('shame-page');
    if (!container || !window.HALL_OF_SHAME) return;
    HOS = window.HALL_OF_SHAME;

    var html = heroHtml();
    html +=
      '<nav class="shame-tabs">' +
        '<button class="shame-tab active" data-tab="deaths"      onclick="switchShameTab(\'deaths\')">💀 Morts débiles</button>' +
        '<button class="shame-tab"        data-tab="screenshots" onclick="switchShameTab(\'screenshots\')">📷 Screenshots</button>' +
        '<button class="shame-tab"        data-tab="leaderboard" onclick="switchShameTab(\'leaderboard\')">🏆 Classement</button>' +
      '</nav>';
    html += '<div id="shame-deaths"      class="shame-panel active">' + deathListHtml()   + '</div>';
    html += '<div id="shame-screenshots" class="shame-panel">'        + screenshotHtml()  + '</div>';
    html += '<div id="shame-leaderboard" class="shame-panel">'        + leaderboardHtml() + '</div>';

    container.innerHTML = html;
  }

  window.initHallOfShame = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
