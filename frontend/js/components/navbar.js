import { CONFIG } from '../config.js';
import { session } from '../api.js';
import { icon, logo } from '../icons/icons.js';
import { esc } from '../utils.js';
import { getLanguage, translateText } from '../i18n.js';

const LINKS = [['/', 'होम'], ['/services', 'सेवाएं'], ['/forms', 'फॉर्म डाउनलोड'], ['/about', 'हमारे बारे में'], ['/contact', 'संपर्क']];
const MOBILE_LINKS = [['/', 'home', 'होम'], ['/services', 'grid', 'सेवाएं'], ['/forms', 'file', 'फॉर्म डाउनलोड'], ['/contact', 'chat', 'संपर्क']];

export function renderNavbar(path = '/') {
  const u = session.user;
  const active = (p) => (p === '/' ? path === '/' : path.startsWith(p));
  const links = LINKS.map(([p, t]) => `<a href="${p}" data-link${active(p) ? ' class="active" aria-current="page"' : ''}>${t}</a>`).join('');
  const mobileLinks = MOBILE_LINKS.map(([p, ic, t]) => `<a class="mobile-tab${active(p) ? ' active' : ''}" href="${p}" data-link${active(p) ? ' aria-current="page"' : ''}>${icon(ic, 21)}<span>${t}</span></a>`).join('');
  const account = u
    ? `<a class="btn btn-ghost btn-sm" href="${u.role === 'admin' ? '/admin' : '/profile'}" data-link>${icon('user', 16)}<span>${u.role === 'admin' ? 'डैशबोर्ड' : esc(u.name.split(' ')[0])}</span></a>`
    : `<a class="btn btn-ghost btn-sm" href="/login" data-link>लॉगिन</a>`;
  const accountHref = u ? (u.role === 'admin' ? '/admin' : '/profile') : '/login';
  const accountLabel = u ? (u.role === 'admin' ? 'डैशबोर्ड' : 'मेरी प्रोफ़ाइल') : 'लॉगिन';
  const accountIcon = u && u.role === 'admin' ? 'dashboard' : 'user';
  const accountActive = u
    ? (u.role === 'admin' ? path.startsWith('/admin') : path.startsWith('/profile') || path.startsWith('/my-applications'))
    : path.startsWith('/login') || path.startsWith('/register');
  const language = getLanguage();
  document.getElementById('site-nav').innerHTML = `
  <header class="nav">
    <div class="notice-bar"><span>${icon('info', 15)}</span><p>यह सरकारी वेबसाइट नहीं है। सेवाएं पात्रता, पोर्टल की उपलब्धता और आधिकारिक अनुमति पर निर्भर हैं। Aadhaar नंबर, OTP या Bank PIN कभी साझा न करें।</p></div>
    <div class="nav-inner container">
      <a class="brand" href="/" data-link aria-label="${CONFIG.NAME_EN} - होम">${logo(56)}<span class="brand-text"><strong>${CONFIG.NAME_EN}</strong><small>CSC ID : ${CONFIG.CSC_ID}</small></span></a>
      <button class="nav-toggle icon-btn" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="मेनू खोलें">${icon('menu', 24)}</button>
      <nav id="nav-menu" class="nav-menu" aria-label="मुख्य मेनू">
        <div class="nav-links">${links}</div>
        <div class="nav-actions">${account}<a class="btn btn-wa btn-sm" href="${CONFIG.WHATSAPP}" target="_blank" rel="noopener">${icon('whatsapp', 16)}<span>WhatsApp</span></a><button class="btn btn-ghost btn-sm lang-toggle" type="button" data-language-toggle aria-label="${language === 'en' ? 'Switch to Hindi' : 'Switch to English'}">${language === 'en' ? 'हिन्दी' : 'English'}</button></div>
      </nav>
    </div>
  </header>
  <nav class="mobile-tabs" aria-label="मुख्य मेनू">
    ${mobileLinks}
    <a class="mobile-tab${accountActive ? ' active' : ''}" href="${accountHref}" data-link${accountActive ? ' aria-current="page"' : ''}>${icon(accountIcon, 21)}<span>${accountLabel}</span></a>
  </nav>`;
}

export function initNavbarEvents() {
  document.getElementById('site-nav').addEventListener('click', (e) => {
    const t = e.target.closest('.nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (t && menu) {
      const open = menu.classList.toggle('open');
      t.setAttribute('aria-expanded', String(open));
      t.setAttribute('aria-label', translateText(open ? 'मेनू बंद करें' : 'मेनू खोलें'));
    } else if (e.target.closest('a[data-link]') && menu) menu.classList.remove('open');
  });
}
