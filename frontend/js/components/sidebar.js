import { CONFIG } from '../config.js';
import { session } from '../api.js';
import { icon } from '../icons/icons.js';
import { esc } from '../utils.js';

const NAV = [
  ['/admin', 'dashboard', 'डैशबोर्ड'], ['/admin/applications', 'clipboard', 'आवेदन'], ['/admin/enquiries', 'inbox', 'पूछताछ'],
  ['/admin/services', 'grid', 'सेवाएं'], ['/admin/users', 'users', 'उपयोगकर्ता'], ['/admin/files', 'folder', 'फ़ाइलें'], ['/admin/settings', 'settings', 'सेटिंग्स'],
];

export function adminShell(active, title, body, headerExtra = '') {
  const u = session.user || { name: '' };
  const items = NAV.map(([p, ic, t]) => `<a href="${p}" data-link class="side-item${p === active ? ' active' : ''}"${p === active ? ' aria-current="page"' : ''}>${icon(ic, 18)}<span>${t}</span></a>`).join('');
  return `<div class="admin">
    <aside class="sidebar">
      <a class="side-brand" href="/" data-link><strong>${CONFIG.NAME_EN}</strong><small>CSC ID : ${CONFIG.CSC_ID}</small></a>
      <nav class="side-nav" aria-label="एडमिन मेनू">${items}<button type="button" class="side-item side-logout" data-logout>${icon('logout', 18)}<span>लॉगआउट</span></button></nav>
    </aside>
    <section class="admin-main">
      <header class="admin-head"><div><h1>${title}</h1><p>नमस्ते, ${esc(u.name)} • प्रशासक</p></div><div class="admin-head-extra">${headerExtra}</div></header>
      ${body}
    </section>
  </div>`;
}
