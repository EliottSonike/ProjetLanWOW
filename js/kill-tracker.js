'use strict';

(function () {

  const BOSSES = {
    ICC:    ['Lord Marrowgar','Lady Deathwhisper','Gunship Battle','Deathbringer Saurfang',
             'Festergut','Rotface','Professor Putricide','Blood Prince Council',
             "Blood-Queen Lana'thel",'Valithria Dreamwalker','Sindragosa','The Lich King'],
    RS:     ['Halion'],
    ToC:    ['Northrend Beasts','Lord Jaraxxus','Faction Champions','Twin Val\'kyr',"Anub'arak"],
    Ulduar: ['Flame Leviathan','Ignis','Razorscale','XT-002','Iron Council','Kologarn',
             'Auriaya','Hodir','Thorim','Freya','Mimiron','General Vezax','Yogg-Saron','Algalon'],
    Onyxia: ["Onyxia"],
    Naxx:   ["Anub'Rekhan","Grand Widow Faerlina",'Maexxna','Noth the Plaguebringer',
             'Heigan the Unclean',"Loatheb",'Instructor Razuvious','Gothik the Harvester',
             'Four Horsemen','Patchwerk','Grobbulus','Gluth','Thaddius',"Sapphiron","Kel'Thuzad"],
    OS:     ['Vesperon','Shadron','Tenebron','Sartharion'],
    EoE:    ['Malygos'],
    VoA:    ['Archavon','Emalon','Koralon','Toravon'],
  };

  const RAID_COLORS = {
    ICC: 0x3f6eaa, RS: 0xb22222, ToC: 0xa0522d,
    Ulduar: 0xd4a017, Onyxia: 0x228b22, Naxx: 0x6a0dad,
    OS: 0xff4500, EoE: 0x00bfff, VoA: 0x808080,
  };

  const PLAYERS = ['Alban','Eliott','Fabien','Maël','Tristan'];

  /* ── Éléments DOM ─────────────────────────────────────────── */
  const sel = id => document.getElementById(id);
  const raidSel    = sel('kt-raid');
  const bossSel    = sel('kt-boss');
  const hmCheck    = sel('kt-hm');
  const firstCheck = sel('kt-first');
  const wipesInput = sel('kt-wipes');
  const fileInput  = sel('kt-file');
  const dropZone   = sel('kt-drop');
  const preview    = sel('kt-preview');
  const msgInput   = sel('kt-msg');
  const submitBtn  = sel('kt-submit');
  const submitTxt  = sel('kt-submit-text');
  const feedback   = sel('kt-feedback');

  let selectedFile = null;

  /* ── Remplir les boss selon le raid ──────────────────────── */
  raidSel.addEventListener('change', () => {
    const raid = raidSel.value;
    bossSel.innerHTML = '<option value="">— Sélectionner un boss —</option>';
    (BOSSES[raid] || []).forEach(b => {
      const o = document.createElement('option');
      o.value = o.textContent = b;
      bossSel.appendChild(o);
    });
    updatePreview();
  });

  /* ── Mise à jour de l'aperçu ─────────────────────────────── */
  function updatePreview() {
    const raid  = raidSel.value;
    const boss  = bossSel.value;
    const hm    = hmCheck.checked;
    const first = firstCheck.checked;
    const wipes = parseInt(wipesInput.value) || 0;
    const msg   = msgInput.value.trim();

    const header = sel('kt-dp-header');
    const fields = sel('kt-dp-fields');
    const bar    = document.querySelector('.kt-dp-bar');
    const imgW   = sel('kt-dp-img-wrap');
    const dpMsg  = sel('kt-dp-msg');

    if (!boss) { header.textContent = 'Sélectionne un boss…'; fields.innerHTML = ''; return; }

    const color = RAID_COLORS[raid] || 0x9b59b6;
    if (bar) bar.style.background = '#' + color.toString(16).padStart(6, '0');

    header.innerHTML = `
      ${first ? '🎉 FIRST KILL — ' : '💀 Boss Kill — '}
      <strong>${boss}${hm ? ' [HM]' : ''}</strong><br>
      <small style="color:#72767d">${raid} · ${new Date().toLocaleDateString('fr-FR')}</small>`;

    fields.innerHTML = `
      <div class="kt-dp-field"><span class="kt-dp-field-name">Joueurs</span><span>${PLAYERS.join(', ')}</span></div>
      ${wipes > 0 ? `<div class="kt-dp-field"><span class="kt-dp-field-name">Wipes</span><span>${wipes}</span></div>` : ''}`;

    if (msg) { dpMsg.textContent = msg; dpMsg.style.display = 'block'; }
    else      { dpMsg.style.display = 'none'; }

    if (preview.src && preview.style.display !== 'none') {
      sel('kt-dp-img').src = preview.src;
      imgW.style.display = 'block';
    } else {
      imgW.style.display = 'none';
    }
  }

  [bossSel, hmCheck, firstCheck, wipesInput, msgInput].forEach(el =>
    el && el.addEventListener('change', updatePreview)
  );
  msgInput && msgInput.addEventListener('input', updatePreview);

  /* ── Gestion du fichier / drag & drop ────────────────────── */
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      sel('kt-drop-inner').style.display = 'none';
      updatePreview();
    };
    reader.readAsDataURL(file);
  }

  fileInput && fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

  dropZone && dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone && dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone && dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    handleFile(e.dataTransfer.files[0]);
  });

  /* ── Envoi Discord ───────────────────────────────────────── */
  submitBtn && submitBtn.addEventListener('click', async () => {
    const raid  = raidSel.value;
    const boss  = bossSel.value;
    const hm    = hmCheck.checked;
    const first = firstCheck.checked;
    const wipes = parseInt(wipesInput.value) || 0;
    const msg   = msgInput.value.trim();

    if (!raid || !boss) {
      showFeedback('❌ Sélectionne un raid et un boss.', 'error');
      return;
    }

    const webhook = (window.SECRETS || {}).discordWebhook;
    if (!webhook) {
      showFeedback('❌ Webhook non configuré dans data/secrets.js', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitTxt.textContent = 'Envoi en cours…';

    try {
      const color = RAID_COLORS[raid] || 0x9b59b6;
      const title = (first ? '🎉 FIRST KILL — ' : '💀 Boss Kill — ') + boss + (hm ? ' [HM]' : '');
      const date  = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

      const embed = {
        title,
        description: msg || null,
        color,
        fields: [
          { name: 'Raid',    value: raid, inline: true },
          { name: 'Date',    value: date, inline: true },
          { name: 'Joueurs', value: PLAYERS.join(' · '), inline: false },
          ...(wipes > 0 ? [{ name: 'Wipes', value: wipes.toString(), inline: true }] : []),
        ],
        footer: { text: 'LAN Du Swag • WotLK5man – Season1' },
        timestamp: new Date().toISOString(),
      };

      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile, 'kill.jpg');
        embed.image = { url: 'attachment://kill.jpg' };
      }

      formData.append('payload_json', JSON.stringify({ embeds: [embed] }));

      const res = await fetch(webhook, { method: 'POST', body: formData });

      if (res.ok || res.status === 204) {
        showFeedback('✅ Posté sur Discord !', 'success');
        // Reset
        raidSel.value = ''; bossSel.innerHTML = '<option value="">—</option>';
        wipesInput.value = 0; msgInput.value = '';
        hmCheck.checked = false; firstCheck.checked = true;
        selectedFile = null;
        preview.style.display = 'none';
        sel('kt-drop-inner').style.display = 'flex';
        updatePreview();
      } else {
        const err = await res.text();
        showFeedback(`❌ Erreur Discord (${res.status}) : ${err}`, 'error');
      }
    } catch (e) {
      showFeedback('❌ Erreur réseau : ' + e.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitTxt.textContent = 'Poster sur Discord';
    }
  });

  function showFeedback(text, type) {
    feedback.textContent = text;
    feedback.className = 'kt-feedback kt-feedback-' + type;
    feedback.style.display = 'block';
    setTimeout(() => { feedback.style.display = 'none'; }, 5000);
  }

  updatePreview();

})();
