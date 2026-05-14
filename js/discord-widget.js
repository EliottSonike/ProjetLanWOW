'use strict';

const DiscordWidget = (function () {

  const INVITE_CODE = 'n96wrGtenG';
  const API_URL     = `https://discord.com/api/v9/invites/${INVITE_CODE}?with_counts=true`;

  async function updateNav() {
    const badge  = document.getElementById('nav-discord-count');
    const status = document.getElementById('nav-discord-status');
    try {
      const data   = await fetch(API_URL).then(r => r.json());
      const online = data.approximate_presence_count || 0;
      const total  = data.approximate_member_count   || 0;

      if (status) {
        status.textContent = online > 0
          ? `${online} en ligne · ${total} membres`
          : `${total} membres`;
      }
      if (badge) {
        if (online > 0) {
          badge.textContent = online;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch {
      if (badge)  badge.style.display = 'none';
      if (status) status.textContent = 'Rejoindre →';
    }
  }

  function init() {
    updateNav();
    setInterval(updateNav, 60000);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', DiscordWidget.init);
