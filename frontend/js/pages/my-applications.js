import { api } from '../api.js';
import { appRow } from './profile.js';

export const meta = { title: 'मेरे आवेदन', desc: '' };
const FILTERS = [['all', 'सभी'], ['pending', 'प्रतीक्षारत'], ['progress', 'प्रक्रिया में'], ['done', 'पूर्ण']];
let apps = [];

export async function render() {
  try { apps = (await api('/applications/my')).data; } catch { apps = null; }
  const n = (k) => (k === 'all' ? apps.length : apps.filter((a) => a.status === k).length);
  return `
  <div class="container profile">
    <h1 class="page-title">मेरे आवेदन</h1><p class="muted">आपके द्वारा दिए गए सभी आवेदन यहाँ दिखेंगे।</p>
    ${apps === null ? '<p class="empty">आवेदन लोड नहीं हो सके। कृपया पेज रीफ़्रेश करें।</p>' : `
    <div class="chips" id="app-chips">${FILTERS.map(([k, t], i) => `<button type="button" class="chip${i ? '' : ' active'}" data-f="${k}">${t} (${n(k)})</button>`).join('')}</div>
    <section class="card"><ul class="app-list" id="app-list">${apps.length ? apps.map(appRow).join('') : '<li class="empty">अभी कोई आवेदन नहीं है।</li>'}</ul></section>`}
  </div>`;
}

export function mount(root) {
  const chips = root.querySelector('#app-chips'); if (!chips) return;
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    const list = apps.filter((a) => b.dataset.f === 'all' || a.status === b.dataset.f);
    root.querySelector('#app-list').innerHTML = list.length ? list.map(appRow).join('') : '<li class="empty">इस श्रेणी में कोई आवेदन नहीं है।</li>';
  });
}
