import { api } from '../api.js';
import { icon, iconNames } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { CATS } from '../components/service-card.js';
import { openDialog, confirmBox, toast } from '../components/notifications.js';
import { esc } from '../utils.js';

export const meta = { title: 'सेवा प्रबंधन', desc: '' };
let items = [];

const grid = () => `<div class="svc-admin-grid">${items.map((s) => `
  <article class="svc-admin${s.active ? '' : ' off'}" data-id="${s._id}">
    <span class="svc-ic">${icon(s.icon, 24)}</span>
    <div><h3 data-i18n-en="${esc(s.nameEn || '')}">${esc(s.name)}</h3><small>${esc(CATS[s.category] || '')}</small><small>${s.active ? 'चालू' : 'बंद'}</small></div>
    <div class="actions"><button class="icon-btn round" data-act="toggle" aria-label="चालू / बंद करें">${icon('toggle', 16)}</button><button class="icon-btn round" data-act="edit" aria-label="बदलें">${icon('edit', 16)}</button><button class="icon-btn round danger" data-act="del" aria-label="हटाएं">${icon('trash', 16)}</button></div>
  </article>`).join('') || '<p class="empty">कोई सेवा नहीं है।</p>'}</div>`;

export async function render() {
  let inner;
  try { items = (await api('/admin/services')).data; inner = grid(); } catch (e) { inner = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/services', 'सेवा प्रबंधन', `<div id="svc">${inner}</div><p class="muted small" style="margin-top:1rem">कुल सेवाएं: ${items.length}</p>`,
    `<button type="button" class="btn btn-primary btn-sm" id="add">${icon('plus', 14)}नई सेवा जोड़ें</button>`);
}

function form(s) {
  s = s || {};
  const lines = (a) => esc((a || []).join('\n'));
  return `<form id="sf" novalidate>
    <div class="field"><label for="s-name">सेवा का नाम (हिंदी)</label><input id="s-name" name="name" value="${esc(s.name || '')}" maxlength="100"></div>
    <div class="field"><label for="s-en">English name</label><input id="s-en" name="nameEn" value="${esc(s.nameEn || '')}" maxlength="100"></div>
    <div class="field"><label for="s-cat">श्रेणी</label><select id="s-cat" name="category">${Object.entries(CATS).map(([k, t]) => `<option value="${k}"${k === s.category ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="s-ic">आइकन</label><select id="s-ic" name="icon">${iconNames.map((k) => `<option${k === (s.icon || 'document') ? ' selected' : ''}>${k}</option>`).join('')}</select></div>
    <div class="field"><label for="s-d">छोटा विवरण</label><textarea id="s-d" name="description" rows="2" maxlength="400">${esc(s.description || '')}</textarea></div>
    <div class="field"><label for="s-f">मुख्य सुविधाएं (हर लाइन में एक)</label><textarea id="s-f" name="features" rows="3">${lines(s.features)}</textarea></div>
    <div class="field"><label for="s-docs">आवश्यक दस्तावेज़ (हर लाइन में एक)</label><textarea id="s-docs" name="documents" rows="3">${lines(s.documents)}</textarea></div>
    <div class="dialog-actions"><button type="button" class="btn btn-ghost" data-close>रद्द करें</button><button class="btn btn-primary" type="submit">सहेजें</button></div></form>`;
}

async function reload(root) { items = (await api('/admin/services')).data; root.querySelector('#svc').innerHTML = grid(); }

function editor(s, root) {
  const d = openDialog(form(s), { title: s ? 'सेवा बदलें' : 'नई सेवा जोड़ें', wide: true });
  d.querySelector('#sf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const list = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
    if (f.name.trim().length < 2) return toast('सेवा का नाम लिखें।', 'error');
    const body = { ...f, features: list(f.features), documents: list(f.documents) };
    try {
      const r = s ? await api(`/admin/services/${s._id}`, { method: 'PATCH', body }) : await api('/admin/services', { method: 'POST', body: { ...body, displayOrder: items.length + 1 } });
      toast(r.message); d.close(); await reload(root);
    } catch (err) { toast(err.message, 'error'); }
  });
}

export function mount(root) {
  const addButton = root.querySelector('#add');
  if (addButton) addButton.addEventListener('click', () => editor(null, root));
  root.addEventListener('click', async (e) => {
    if (e.target.closest('#add')) return;
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const s = items.find((x) => x._id === btn.closest('.svc-admin').dataset.id); if (!s) return;
    try {
      if (btn.dataset.act === 'edit') editor(s, root);
      else if (btn.dataset.act === 'toggle') { await api(`/admin/services/${s._id}`, { method: 'PATCH', body: { active: !s.active } }); await reload(root); }
      else if (await confirmBox(`"${s.name}" सेवा हटाएं?`)) { const r = await api(`/admin/services/${s._id}`, { method: 'DELETE' }); toast(r.message); await reload(root); }
    } catch (err) { toast(err.message, 'error'); }
  });
}
