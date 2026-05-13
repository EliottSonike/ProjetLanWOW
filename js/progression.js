(function () {

  var PROG;

  /* ── helpers ── */
  function allBossesOf(e) {
    if (e.bosses) return e.bosses;
    var out = [];
    (e.wings || []).forEach(function (w) { out = out.concat(w.bosses); });
    return out;
  }

  function countKilled(bosses) {
    return bosses.filter(function (b) { return b.killed; }).length;
  }

  function groupByPhase(list) {
    var map = {};
    list.forEach(function (e) {
      if (!map[e.phase]) map[e.phase] = [];
      map[e.phase].push(e);
    });
    return map;
  }

  /* ── hero section ── */
  function heroHtml() {
    function calc(list) {
      var all = [];
      list.forEach(function (e) { all = all.concat(allBossesOf(e)); });
      var k = countKilled(all), t = all.length;
      return { k: k, t: t, pct: t ? Math.round(k / t * 100) : 0 };
    }
    var r = calc(PROG.raids), d = calc(PROG.dungeons);
    var gK = r.k + d.k, gT = r.t + d.t;
    var gPct = gT ? Math.round(gK / gT * 100) : 0;
    return (
      '<section class="prog-hero">' +
        '<div class="prog-hero-eyebrow">Progression · LAN Du Swag · wotlk5.com Season 1</div>' +
        '<div class="prog-hero-body">' +
          '<div class="prog-hero-pct">' + gPct + '<sup>%</sup></div>' +
          '<div class="prog-hero-bars">' +
            '<div class="prog-hero-row general">' +
              '<span class="prog-hero-lbl">🏆 Général</span>' +
              '<div class="prog-hero-track"><div class="prog-hero-fill general" style="width:' + gPct + '%"></div></div>' +
              '<span class="prog-hero-cnt">' + gK + ' / ' + gT + ' bosses</span>' +
            '</div>' +
            '<div class="prog-hero-divider"></div>' +
            '<div class="prog-hero-row">' +
              '<span class="prog-hero-lbl">⚔️ Raids</span>' +
              '<div class="prog-hero-track"><div class="prog-hero-fill" style="width:' + r.pct + '%"></div></div>' +
              '<span class="prog-hero-cnt">' + r.k + ' / ' + r.t + ' bosses</span>' +
            '</div>' +
            '<div class="prog-hero-row">' +
              '<span class="prog-hero-lbl">🗺️ Donjons</span>' +
              '<div class="prog-hero-track"><div class="prog-hero-fill dung" style="width:' + d.pct + '%"></div></div>' +
              '<span class="prog-hero-cnt">' + d.k + ' / ' + d.t + ' bosses</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  /* ── donut circle ── */
  function donutHtml(k, t) {
    var pct = t ? Math.round(k / t * 100) : 0;
    var cleared = k === t && t > 0;
    return (
      '<div class="tl-circle' + (cleared ? ' cleared' : '') + '" style="--pct:' + pct + '">' +
        '<span class="tl-circle-text">' + k + '<br>/' + t + '</span>' +
      '</div>'
    );
  }

  /* ── boss detail panel ── */
  function detailHtml(entry) {
    function bossRow(b) {
      return (
        '<div class="dl-boss' + (b.killed ? ' killed' : '') + '">' +
          '<span class="dl-status">' + (b.killed ? '✓' : '✗') + '</span>' +
          '<span class="dl-name">' + b.name + '</span>' +
          (b.hm ? '<span class="dl-hm">HM</span>' : '') +
          (b.wipes > 0 ? '<span class="dl-wipes">' + b.wipes + ' wipes</span>' : '') +
          (b.firstKill ? '<span class="dl-fk">' + b.firstKill + '</span>' : '') +
        '</div>'
      );
    }
    var bosses = allBossesOf(entry);
    var k = countKilled(bosses), t = bosses.length;
    var pct = t ? Math.round(k / t * 100) : 0;

    var html =
      '<div class="dl-header">' +
        '<strong>' + entry.name + '</strong>' +
        '<span class="dl-header-count">' + k + ' / ' + t + ' · ' + pct + '%</span>' +
        '<button class="dl-close" onclick="progCloseDetail(this)">✕</button>' +
      '</div>';

    if (entry.wings) {
      entry.wings.forEach(function (w) {
        html += '<div class="dl-wing"><div class="dl-wing-name">' + w.name + '</div>';
        w.bosses.forEach(function (b) { html += bossRow(b); });
        html += '</div>';
      });
    } else {
      (entry.bosses || []).forEach(function (b) { html += bossRow(b); });
    }
    return html;
  }

  /* ── timeline frise ── */
  function timelineHtml(list, detailId) {
    var groups = groupByPhase(list);
    var phases = Object.keys(groups).sort(function (a, b) { return +a - +b; });

    var html = '<div class="timeline-scroll"><div class="timeline">';

    phases.forEach(function (p) {
      html += '<div class="tl-phase">';
      html += '<div class="tl-phase-label">Phase ' + p + '</div>';
      html += '<div class="tl-phase-rail">';

      groups[p].forEach(function (entry) {
        var bosses = allBossesOf(entry);
        var k = countKilled(bosses), t = bosses.length;
        var cleared = k === t && t > 0;

        html +=
          '<div class="tl-instance' + (cleared ? ' cleared' : '') + '"' +
              ' data-id="' + entry.id + '"' +
              ' data-detail="' + detailId + '"' +
              ' onclick="progSelectInstance(this)">' +
            donutHtml(k, t) +
            '<div class="tl-name">' + entry.name + '</div>' +
          '</div>';
      });

      html += '</div></div>';
    });

    html += '</div></div>';
    html += '<div class="tl-detail" id="' + detailId + '"></div>';
    return html;
  }

  /* ── public callbacks ── */
  window.switchProgTab = function (tab) {
    document.querySelectorAll('.prog-tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.prog-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'prog-' + tab);
    });
  };

  window.progSelectInstance = function (el) {
    var detailEl = document.getElementById(el.dataset.detail);
    var panel = el.closest('.prog-panel');
    var list = panel.id === 'prog-raids' ? PROG.raids : PROG.dungeons;
    var entry = list.filter(function (e) { return e.id === el.dataset.id; })[0];
    if (!entry || !detailEl) return;

    panel.querySelectorAll('.tl-instance').forEach(function (n) { n.classList.remove('selected'); });
    el.classList.add('selected');

    detailEl.innerHTML = detailHtml(entry);
    detailEl.classList.add('visible');
    setTimeout(function () {
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  window.progCloseDetail = function (btn) {
    var detailEl = btn.closest('.tl-detail');
    if (!detailEl) return;
    detailEl.classList.remove('visible');
    var panel = detailEl.closest('.prog-panel');
    if (panel) panel.querySelectorAll('.tl-instance').forEach(function (n) { n.classList.remove('selected'); });
  };

  /* ── init ── */
  function init() {
    var container = document.getElementById('prog-page');
    if (!container || !window.PROGRESSION) return;
    PROG = window.PROGRESSION;

    var html = heroHtml();
    html +=
      '<nav class="prog-tabs">' +
        '<button class="prog-tab active" data-tab="raids"    onclick="switchProgTab(\'raids\')">⚔️ Raids</button>' +
        '<button class="prog-tab"        data-tab="dungeons" onclick="switchProgTab(\'dungeons\')">🗺️ Donjons</button>' +
      '</nav>';
    html += '<div id="prog-raids"    class="prog-panel active">' + timelineHtml(PROG.raids,    'detail-raids')    + '</div>';
    html += '<div id="prog-dungeons" class="prog-panel">'        + timelineHtml(PROG.dungeons, 'detail-dungeons') + '</div>';

    container.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
