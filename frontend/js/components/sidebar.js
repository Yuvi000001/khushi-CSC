import { CONFIG } from '../config.js';
import { session } from '../api.js';
import { icon, logo } from '../icons/icons.js';
import { esc } from '../utils.js';
import { getLanguage } from '../i18n.js';

const NAV = [
  ['/admin', 'dashboard', 'डैशबोर्ड'], ['/admin/applications', 'clipboard', 'आवेदन'], ['/admin/payments', 'rupee', 'भुगतान'], ['/admin/enquiries', 'inbox', 'पूछताछ'],
  ['/admin/services', 'grid', 'सेवाएं'], ['/admin/schemes', 'document', 'योजनाएं'], ['/admin/ads', 'image', 'होम विज्ञापन'], ['/admin/users', 'users', 'उपयोगकर्ता'], ['/admin/files', 'folder', 'फ़ाइलें'], ['/admin/settings', 'settings', 'सेटिंग्स'],
];

export function adminShell(active, title, body, headerExtra = '') {
  const u = session.user || { name: '' };
  const language = getLanguage();
  const items = NAV.map(([p, ic, t]) => `<a href="${p}" data-link class="side-item${p === active ? ' active' : ''}"${p === active ? ' aria-current="page"' : ''}>${icon(ic, 18)}<span>${t}</span></a>`).join('');
  return `<div class="admin">
    <aside class="sidebar">
      <a class="side-brand" href="/" data-link><span class="side-brand-identity">${logo(36)}<strong>${CONFIG.NAME_EN}</strong></span><small>CSC ID : ${CONFIG.CSC_ID}</small></a>
      <nav class="side-nav" aria-label="एडमिन मेनू">${items}<button type="button" class="side-item side-logout" data-logout>${icon('logout', 18)}<span>लॉगआउट</span></button></nav>
    </aside>
    <section class="admin-main">
      <header class="admin-head"><div><h1>${title}</h1><p>नमस्ते, ${esc(u.name)} • प्रशासक</p></div><div class="admin-head-extra">${headerExtra}<button class="btn btn-ghost btn-sm lang-toggle" type="button" data-language-toggle aria-label="${language === 'en' ? 'Switch to Hindi' : 'Switch to English'}">${language === 'en' ? 'हिन्दी' : 'English'}</button></div></header>
      ${body}
    </section>
  </div>`;
}
