import { CONFIG } from '../config.js';
import { session } from '../api.js';
import { icon, logo } from '../icons/icons.js';
import { esc } from '../utils.js';

const LINKS = [['/', 'होम'], ['/services', 'सेवाएं'], ['/about', 'हमारे बारे में'], ['/contact', 'संपर्क']];

export function renderNavbar(path = '/') {
  const u = session.user;
  const active = (p) => (p === '/' ? path === '/' : path.startsWith(p));
  const links = LINKS.map(([p, t]) => `<a href="${p}" data-link${active(p) ? ' class="active" aria-current="page"' : ''}>${t}</a>`).join('');
  const account = u
    ? `<a class="btn btn-ghost btn-sm" href="${u.role === 'admin' ? '/admin' : '/profile'}" data-link>${icon('user', 16)}<span>${u.role === 'admin' ? 'डैशबोर्ड' : esc(u.name.split(' ')[0])}</span></a>`
    : `<a class="btn btn-ghost btn-sm" href="/login" data-link>लॉगिन</a>`;
  document.getElementById('site-nav').innerHTML = `
  <header class="nav">
    <div class="notice-bar"><span>${icon('info', 15)}</span><p>यह सरकारी वेबसाइट नहीं है। सेवाएं पात्रता, पोर्टल की उपलब्धता और आधिकारिक अनुमति पर निर्भर हैं। Aadhaar नंबर, OTP या Bank PIN कभी साझा न करें।</p></div>
    <div class="nav-inner container">
      <a class="brand" href="/" data-link aria-label="${CONFIG.NAME_EN} - होम">${logo(56)}<span class="brand-text"><strong>${CONFIG.NAME_EN}</strong><small>CSC ID : ${CONFIG.CSC_ID}</small></span></a>
      <button class="nav-toggle icon-btn" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="मेनू खोलें">${icon('menu', 24)}</button>
      <nav id="nav-menu" class="nav-menu" aria-label="मुख्य मेनू">
        <div class="nav-links">${links}</div>
        <div class="nav-actions">${account}<a class="btn btn-wa btn-sm" href="${CONFIG.WHATSAPP}" target="_blank" rel="noopener">${icon('whatsapp', 16)}<span>WhatsApp</span></a></div>
      </nav>
    </div>
  </header>`;
}

export function initNavbarEvents() {
  document.getElementById('site-nav').addEventListener('click', (e) => {
    const t = e.target.closest('.nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (t && menu) {
      const open = menu.classList.toggle('open');
      t.setAttribute('aria-expanded', String(open));
      t.setAttribute('aria-label', open ? 'मेनू बंद करें' : 'मेनू खोलें');
    } else if (e.target.closest('a[data-link]') && menu) menu.classList.remove('open');
  });
}
