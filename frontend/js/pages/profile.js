import { api, session } from '../api.js';
import { icon } from '../icons/icons.js';
import { esc, badge, fmtDate } from '../utils.js';

export const meta = { title: 'मेरी प्रोफ़ाइल', desc: '' };

export const appRow = (a) => `
  <li class="app-row">
    <span class="app-ic">${icon((a.serviceId && a.serviceId.icon) || 'document', 22)}</span>
    <div class="app-info"><strong>${esc(a.serviceId ? a.serviceId.name : 'सेवा हटा दी गई')}</strong><small>Ref: ${esc(a.reference)}</small><small>तारीख़: ${fmtDate(a.createdAt)}</small></div>
    ${badge(a.status)}
  </li>`;

export async function render() {
  const u = session.user;
  let apps = [], failed = false;
  try { apps = (await api('/applications/my')).data; } catch { failed = true; }
  const c = (s) => apps.filter((a) => a.status === s).length;
  const stats = [['कुल आवेदन', apps.length], ['प्रतीक्षारत', c('pending')], ['प्रक्रिया में', c('progress')], ['पूर्ण', c('done')]];
  return `
  <div class="container profile">
    <header class="profile-head">
      <span class="avatar" aria-hidden="true">${esc(u.name.trim().charAt(0).toUpperCase())}</span>
      <div><h1>${esc(u.name)}</h1><p>${icon('mail', 15)} ${esc(u.email)}</p><p>${icon('phone', 15)} ${esc(u.mobile)}</p></div>
      <button class="btn btn-ghost btn-sm" data-logout>${icon('logout', 16)}लॉगआउट</button>
    </header>
    <div class="stats">${stats.map(([k, v]) => `<div class="stat"><strong>${v}</strong><span>${k}</span></div>`).join('')}</div>
    <section class="card">
      <div class="card-head"><h2>मेरे आवेदन</h2><a href="/my-applications" data-link class="link">सभी देखें</a></div>
      ${failed ? '<p class="empty">आवेदन लोड नहीं हो सके। कृपया पेज रीफ़्रेश करें।</p>'
        : apps.length ? `<ul class="app-list">${apps.slice(0, 5).map(appRow).join('')}</ul>`
        : '<p class="empty">अभी कोई आवेदन नहीं है। <a href="/services" data-link>कोई सेवा चुनकर आवेदन करें।</a></p>'}
    </section>
  </div>`;
}
