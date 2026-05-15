/* ── Wowhead tooltips refresh ───────────────────────────────────────── */
function refreshWowhead() {
  if (window.$WowheadPower)              window.$WowheadPower.refreshLinks();
  else if (window.WH && window.WH.Tooltips) window.WH.Tooltips.refreshLinks();
}
window.addEventListener('load', () => setTimeout(refreshWowhead, 500));

/* ── 3D Model Viewer ────────────────────────────────────────────────── */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function load3DModel(viewerId, portraitId, charData) {
  const viewerEl = document.getElementById(viewerId);
  const toggle   = document.getElementById('toggle3d-' + portraitId.replace('pf-', ''));
  if (!viewerEl || !charData) return;
  if (!charData.race || !charData.gender) return;

  const customOpts  = charData.customizationOptions  || [];
  const modelItems  = charData.characterModelItems   || [];

  try {
    window.CONTENT_PATH = '/wow-assets/modelviewer/live/';
    window.WH = window.WH || { debug: () => {} };

    if (!window.jQuery) await loadScript('https://code.jquery.com/jquery-3.6.4.min.js');
    if (!window.ZamModelViewer) await loadScript('/wow-assets/modelviewer/live/viewer/viewer.min.js');

    const RACES   = {1:'human',2:'orc',3:'dwarf',4:'nightelf',5:'scourge',6:'tauren',7:'gnome',8:'troll',10:'bloodelf',11:'draenei'};
    const GENDERS = ['male','female'];

    const inst = new ZamModelViewer({
      type:        ZamModelViewer.WOW,
      contentPath: '/wow-assets/modelviewer/live/',
      container:   $(viewerEl),
      hd:          true,
      aspect:      viewerEl.offsetWidth / (viewerEl.offsetHeight || viewerEl.offsetWidth),
      charCustomization: {
        race:       charData.race,
        gender:     charData.gender,
        options:    customOpts,
        sheathMain: -1,
        sheathOff:  -1,
      },
      cls:   charData.class,
      items: modelItems.filter(i => i[1] !== -1),
      models: {
        type: ZamModelViewer.Wow.Types.CHARACTER,
        id:   `${RACES[charData.race]}${GENDERS[charData.gender]}`,
      },
      mount: { type: ZamModelViewer.Wow.Types.NPC, id: 0 },
    });

    // Attend le chargement (max 10s)
    await new Promise(resolve => {
      const t = setInterval(() => { if (inst.method('isLoaded')) { clearInterval(t); resolve(); } }, 200);
      setTimeout(() => { clearInterval(t); resolve(); }, 10000);
    });

    viewerEl.style.display = 'block';
    if (toggle) toggle.style.display = 'inline-flex';

  } catch(e) {
    console.warn('3D model viewer:', e.message);
    viewerEl.remove();
    if (toggle) toggle.remove();
  }
}

window.toggle3DViewer = function(safeId) {
  const pf  = document.getElementById('pf-'       + safeId);
  const v3  = document.getElementById('viewer3d-' + safeId);
  const btn = document.getElementById('toggle3d-' + safeId);
  if (!pf || !v3) return;
  const show3d = pf.style.display !== 'none';
  pf.style.display  = show3d ? 'none' : '';
  v3.style.display  = show3d ? 'block' : 'none';
  if (btn) btn.textContent = show3d ? '🖼️ Portrait' : '🔮 3D';
};

// ── Gestion des onglets (Talents / BiS / Rotation)
function initTabs() {
  const navBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  navBtns.forEach(btn => {

    btn.addEventListener('click', () => {

      const target = btn.dataset.tab;

      // reset boutons
      navBtns.forEach(b => b.classList.remove('active'));

      // reset panels
      panels.forEach(p => p.classList.remove('active'));

      // active bouton
      btn.classList.add('active');

      // active panel
      const panel = document.getElementById(target);

      if (panel) {
        panel.classList.add('active');
      }

      // met à jour le hash URL
      history.replaceState(null, '', '#' + target);

      // refresh wowhead tooltips (panneaux cachés au chargement)
      setTimeout(refreshWowhead, 80);
    });

  });

  // ouverture depuis URL
  const hash = location.hash.replace('#', '');

  if (hash) {
    const hashBtn = document.querySelector(
      `.tab-btn[data-tab="${hash}"]`
    );

    if (hashBtn) {
      hashBtn.click();
    }
  }
}

// Gestion des boss accordéon (pages stratégies)
function initBossCards() {
  document.querySelectorAll('.boss-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.boss-card');
      card.classList.toggle('open');
    });
  });
}

function fixPaperdollSlots() {
  document.querySelectorAll('.equip-slot-icon').forEach(function(slot) {
    var a = slot.querySelector('a');
    var iconSpan = slot.querySelector('.iconlarge, .iconmedium, .iconsmall');
    var ins = slot.querySelector('ins');
    var del = slot.querySelector('del');
    if (a) {
      a.style.setProperty('position', 'absolute', 'important');
      a.style.setProperty('top', '0', 'important');
      a.style.setProperty('left', '0', 'important');
      a.style.setProperty('right', '0', 'important');
      a.style.setProperty('bottom', '0', 'important');
      a.style.setProperty('display', 'block', 'important');
      a.style.setProperty('font-size', '0', 'important');
      a.style.setProperty('line-height', '0', 'important');
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
    if (iconSpan) {
      iconSpan.style.setProperty('position', 'absolute', 'important');
      iconSpan.style.setProperty('top', '0', 'important');
      iconSpan.style.setProperty('left', '0', 'important');
      iconSpan.style.setProperty('width', '100%', 'important');
      iconSpan.style.setProperty('height', '100%', 'important');
      iconSpan.style.setProperty('margin', '0', 'important');
      iconSpan.style.setProperty('border', 'none', 'important');
      iconSpan.style.setProperty('background-color', 'transparent', 'important');
    }
    if (ins) {
      ins.style.setProperty('position', 'absolute', 'important');
      ins.style.setProperty('top', '0', 'important');
      ins.style.setProperty('left', '0', 'important');
      ins.style.setProperty('width', '100%', 'important');
      ins.style.setProperty('height', '100%', 'important');
      ins.style.setProperty('background-size', '100% 100%', 'important');
    }
    if (del) {
      del.style.setProperty('position', 'absolute', 'important');
      del.style.setProperty('top', '-3px', 'important');
      del.style.setProperty('left', '-3px', 'important');
      del.style.setProperty('width', 'calc(100% + 6px)', 'important');
      del.style.setProperty('height', 'calc(100% + 6px)', 'important');
      del.style.setProperty('background-size', '100% 100%', 'important');
    }
  });
}

// ===== ARMORY =====

const ARMORY_REALM = 'WotLK5man - Season1';
const ARMORY_SLOTS = {
  0:'Tête', 1:'Cou', 2:'Épaules', 3:'Chemise', 4:'Torse',
  5:'Ceinture', 6:'Jambes', 7:'Bottes', 8:'Brassards', 9:'Gantelets',
  10:'Anneau 1', 11:'Anneau 2', 12:'Trinket 1', 13:'Trinket 2',
  14:'Cape', 15:'Main droite', 16:'Off-hand', 17:'Relique', 18:'Tabard'
};
const ARMORY_QUALITY = ['', '', 'uncommon', 'rare', 'epic', 'legendary'];

function armorySlotHTML(equipment, slotId) {
  const item = equipment.find(e => e.slot === slotId);
  const label = ARMORY_SLOTS[slotId] || '';
  if (item && item.icon) {
    const qClass = ARMORY_QUALITY[item.quality] || 'empty';
    const icon = `https://wow.zamimg.com/images/wow/icons/large/${item.icon.toLowerCase()}.jpg`;
    return `<div class="equip-slot ${qClass}">
      <div class="equip-slot-icon" style="background-image:url('${icon}');background-size:cover;background-position:center;">
        <a href="https://www.wowhead.com/wotlk/item=${item.itemEntry}" target="_blank" rel="noopener" style="position:absolute;inset:0;display:block;font-size:0;"></a>
      </div>
      <span class="equip-slot-label">${label}</span>
    </div>`;
  }
  return `<div class="equip-slot empty"><div class="equip-slot-icon"></div><span class="equip-slot-label">${label}</span></div>`;
}


function renderArmoryPanel(panel, charData, meta, fromCache) {
  const left   = [0, 1, 2, 14, 4, 3, 18, 8];
  const right  = [9, 5, 6, 7, 10, 11, 12, 13];
  const bottom = [15, 16, 17];
  const eq = charData.equipment || [];
  const portrait = panel.dataset.portrait || '';
  const specClass = panel.dataset.specclass || '';
  const safeId  = meta.name.replace(/[^a-zA-Z0-9]/g, '');

  const cacheNote = fromCache
    ? `<span class="paperdoll-char-phase" style="font-size:0.6rem;opacity:0.6;">Cache · ${timeAgo(fromCache)}</span>`
    : '';

  panel.innerHTML = `
    <div class="content-card">
      <h3>Équipement — ${meta.name}</h3>
      <div class="wow-paperdoll">
        <div class="paperdoll-main">
          <div class="paperdoll-col">${left.map(s => armorySlotHTML(eq, s)).join('')}</div>
          <div class="paperdoll-center">
            <div class="paperdoll-char">
              ${portrait ? `
              <div id="pf-${safeId}" class="portrait-frame">
                <img class="paperdoll-char-portrait" src="${portrait}" alt="${meta.name}">
              </div>
              <div id="viewer3d-${safeId}" class="viewer3d" style="display:none"></div>
              <button id="toggle3d-${safeId}" class="viewer3d-toggle" style="display:none" onclick="toggle3DViewer('${safeId}')">🔮 3D</button>
              ` : ''}
              <span class="paperdoll-char-name">${meta.name}</span>
              <span class="paperdoll-char-spec ${specClass}">${meta.race} · ${meta.cls}</span>
              <span class="paperdoll-char-phase">Niveau ${meta.level}</span>
              <span class="paperdoll-char-phase" style="margin-top:0.3rem;">${meta.online ? '🟢 En ligne' : '🔴 Hors ligne'}</span>
              ${cacheNote}
            </div>
          </div>
          <div class="paperdoll-col">${right.map(s => armorySlotHTML(eq, s)).join('')}</div>
        </div>
        <div class="paperdoll-bottom">${bottom.map(s => armorySlotHTML(eq, s)).join('')}</div>
      </div>
    </div>`;

  // Lance le chargement du modèle 3D en arrière-plan
  if (portrait) load3DModel('viewer3d-' + safeId, 'pf-' + safeId, charData);

  // Refresh Wowhead tooltips sur les items nouvellement insérés
  setTimeout(refreshWowhead, 300);
}

function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  if (diff < 1) return 'à l\'instant';
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

async function fetchArmoryData(charName, realm) {
  const armoryUrl = `https://wotlk5.com/armory/character/${encodeURIComponent(realm)}/${encodeURIComponent(charName)}`;
  let html;

  const proxies = [
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  // Essai direct d'abord
  try {
    const r = await fetch(armoryUrl);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    html = await r.text();
  } catch {
    // Essai des proxies un par un
    for (const makeProxy of proxies) {
      try {
        const r = await fetch(makeProxy(armoryUrl));
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const ct = r.headers.get('content-type') || '';
        html = ct.includes('json') ? (await r.json()).contents : await r.text();
        if (html && html.includes('charData')) break;
        html = null;
      } catch { html = null; }
    }
    if (!html) throw new Error('Tous les proxies ont échoué');
  }

  const tag = 'const charData = ';
  const idx = html.indexOf(tag);
  if (idx === -1) throw new Error('Personnage introuvable sur wotlk5.com');
  const jsonEnd = html.indexOf(';\n', idx + tag.length);
  const charData = JSON.parse(html.substring(idx + tag.length, jsonEnd));

  return {
    charData,
    meta: {
      name:   charName,
      level:  (html.match(/class="char-level">(\d+)</) || [])[1] || '80',
      race:   (html.match(/class="char-race">([^<]+)</) || [])[1] || '',
      cls:    (html.match(/class="char-class">([^<]+)</) || [])[1] || '',
      online: html.includes('Online 🟢'),
    }
  };
}

function initArmory() {
  const panel = document.querySelector('#armory[data-char]');
  if (!panel) return;

  const charName  = panel.dataset.char;
  const realm     = panel.dataset.realm || ARMORY_REALM;
  const cacheKey  = 'armory_' + charName;
  const armoryUrl = `https://wotlk5.com/armory/character/${encodeURIComponent(realm)}/${encodeURIComponent(charName)}`;

  // Pas de nom de personnage défini
  if (!charName) {
    if (panel.classList.contains('active')) {
      panel.innerHTML = `<div class="content-card" style="text-align:center;padding:2rem;">
        <p style="color:var(--gold);">Personnage pas encore créé sur wotlk5.com.</p>
        <p style="color:var(--text-muted);margin-top:0.5rem;font-size:0.85rem;">Renseignez le nom dans <code>data-char</code> une fois le perso créé.</p>
      </div>`;
    }
    return;
  }

  // Afficher le cache immédiatement s'il existe
  const raw = localStorage.getItem(cacheKey);
  if (raw) {
    try {
      const { charData, meta, timestamp } = JSON.parse(raw);
      renderArmoryPanel(panel, charData, meta, timestamp);
    } catch { localStorage.removeItem(cacheKey); }
  } else if (panel.classList.contains('active')) {
    panel.innerHTML = `<div class="content-card" style="text-align:center;padding:2rem;">
      <p style="color:var(--text-muted);">Chargement depuis wotlk5.com…</p>
    </div>`;
  }

  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes entre deux fetches

  async function doFetch() {
    const cacheAge = raw ? Date.now() - JSON.parse(raw).timestamp : Infinity;
    if (cacheAge < CACHE_TTL) return; // cache encore frais, pas de requête
    try {
      const { charData, meta } = await fetchArmoryData(charName, realm);
      localStorage.setItem(cacheKey, JSON.stringify({ charData, meta, timestamp: Date.now() }));
      renderArmoryPanel(panel, charData, meta, null);
    } catch (err) {
      if (!raw) {
        panel.innerHTML = `<div class="content-card" style="text-align:center;padding:2rem;">
          <p style="color:var(--text-muted);">Serveur wotlk5.com inaccessible.</p>
          <p><small style="color:#555;">${err.message}</small></p>
          <a href="${armoryUrl}" target="_blank" rel="noopener" class="talent-link" style="display:inline-block;margin-top:1rem;">🔗 Voir sur wotlk5.com</a>
        </div>`;
      }
    }
  }

  // Fetch uniquement quand l'utilisateur clique sur l'onglet Armory
  const btn = document.querySelector('.tab-btn[data-tab="armory"]');
  if (btn) btn.addEventListener('click', doFetch);

  // Si l'onglet est actif par défaut et le cache est vieux, fetch une fois
  if (panel.classList.contains('active')) doFetch();
}

// Charge les icônes de la bis-list via JSONP WowHead
function loadBisIcons() {
  document.querySelectorAll('img.bis-icon[data-item]').forEach(img => {
    const id = img.dataset.item;
    const cb = '_whi' + id;
    window[cb] = (data) => {
      if (data?.icon) img.src = `https://wow.zamimg.com/images/wow/icons/large/${data.icon}.jpg`;
      document.getElementById('_whs' + id)?.remove();
      delete window[cb];
    };
    const s = document.createElement('script');
    s.id = '_whs' + id;
    s.src = `https://www.wowhead.com/wotlk/item=${id}&json&jsonp=${cb}`;
    document.head.appendChild(s);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initBossCards();
  initArmory();
  loadBisIcons();
});

window.addEventListener('load', function() {
  setTimeout(fixPaperdollSlots, 500);
});
