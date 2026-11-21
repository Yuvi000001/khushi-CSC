import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { openDialog, confirmBox, toast } from '../components/notifications.js';
import { esc, badge, fmtDate, debounce, STATUS } from '../utils.js';

export const meta = { title: 'आवेदन प्रबंधन', desc: '' };
const FILTERS = [['', 'सभी'], ['pending', 'नए'], ['progress', 'प्रक्रिया में'], ['done', 'पूर्ण']];
const state = { q: '', status: '', page: 1 };
let items = [];

export function render({ query }) {
  state.q = query.q || ''; state.status = ''; state.page = 1;
  return adminShell('/admin/applications', 'आवेदन प्रबंधन', `
    <div class="toolbar">
      <div class="search">${icon('search', 18)}<input id="q" type="search" placeholder="नाम, मोबाइल या संदर्भ खोजें" value="${esc(state.q)}" aria-label="खोजें"></div>
      <div class="chips" id="f-chips">${FILTERS.map(([k, t], i) => `<button type="button" class="chip${i ? '' : ' active'}" data-s="${k}">${t}</button>`).join('')}</div>
    </div>
    <section class="panel"><div id="tbl" aria-live="polite"><p class="empty">लोड हो रहा है...</p></div></section>`);
}

async function load(root) {
  const box = root.querySelector('#tbl');
  const qs = new URLSearchParams({ page: state.page, ...(state.q && { q: state.q }), ...(state.status && { status: state.status }) });
  try {
    const { data } = await api(`/admin/applications?${qs}`);
    items = data.items;
    const rows = items.map((a) => `<tr data-id="${a._id}"><td data-l="संदर्भ">${esc(a.reference)}</td><td data-l="नाम">${esc(a.applicantName)}<small>${esc(a.applicantMobile)}</small></td><td data-l="सेवा">${esc(a.serviceId ? a.serviceId.name : '-')}</td><td data-l="स्थिति">${badge(a.status)}</td><td data-l="तारीख़">${fmtDate(a.createdAt)}</td>
      <td class="actions"><button class="icon-btn round" data-act="view" aria-label="देखें">${icon('eye', 16)}</button><button class="icon-btn round" data-act="edit" aria-label="स्थिति बदलें">${icon('edit', 16)}</button><button class="icon-btn round danger" data-act="del" aria-label="हटाएं">${icon('trash', 16)}</button></td></tr>`).join('');
    box.innerHTML = `<div class="table-wrap"><table class="table applications-table"><thead><tr><th>संदर्भ</th><th>नाम</th><th>सेवा</th><th>स्थिति</th><th>तारीख़</th><th>कार्रवाई</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">कोई आवेदन नहीं मिला।</td></tr>'}</tbody></table></div>
      <div class="pager"><span>कुल: ${data.total}</span><div><button class="btn btn-ghost btn-sm" data-p="-1" ${data.page <= 1 ? 'disabled' : ''}>पिछला</button><span>${data.page} / ${data.pages}</span><button class="btn btn-ghost btn-sm" data-p="1" ${data.page >= data.pages ? 'disabled' : ''}>अगला</button></div></div>`;
  } catch (e) { box.innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
}

function viewDialog(a) {
  const hist = (a.statusHistory || []).map((h) => `<li>${badge(h.status)} <small>${fmtDate(h.at)}</small> ${esc(h.note || '')}</li>`).join('');
  openDialog(`<dl class="kv"><dt>संदर्भ</dt><dd>${esc(a.reference)}</dd><dt>आवेदक</dt><dd>${esc(a.applicantName)}</dd><dt>मोबाइल</dt><dd>${esc(a.applicantMobile)}</dd><dt>सेवा</dt><dd>${esc(a.serviceId ? a.serviceId.name : '-')}</dd><dt>टिप्पणी</dt><dd>${esc(a.notes || '-')}</dd></dl><h3>स्थिति इतिहास</h3><ul class="history">${hist}</ul>`, { title: 'आवेदन विवरण' });
}

function editDialog(a, root) {
  const d = openDialog(`<form id="st" novalidate><div class="field"><label for="st-s">नई स्थिति</label><select id="st-s" name="status">${['pending', 'progress', 'done', 'cancelled'].map((k) => `<option value="${k}"${k === a.status ? ' selected' : ''}>${STATUS[k][0]}</option>`).join('')}</select></div>
    <div class="field"><label for="st-n">टिप्पणी (वैकल्पिक)</label><input id="st-n" name="note" maxlength="300"></div>
    <div class="dialog-actions"><button type="button" class="btn btn-ghost" data-close>रद्द करें</button><button class="btn btn-primary" type="submit">सहेजें</button></div></form>`, { title: `स्थिति बदलें - ${a.reference}` });
  d.querySelector('#st').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try { const r = await api(`/admin/applications/${a._id}/status`, { method: 'PATCH', body: f }); toast(r.message); d.close(); load(root); }
    catch (err) { toast(err.message, 'error'); }
  });
}

export function mount(root) {
  load(root);
  root.querySelector('#q').addEventListener('input', debounce((e) => { state.q = e.target.value.trim(); state.page = 1; load(root); }));
  root.querySelector('#f-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    state.status = b.dataset.s; state.page = 1;
    root.querySelectorAll('#f-chips .chip').forEach((c) => c.classList.toggle('active', c === b)); load(root);
  });
  root.addEventListener('click', async (e) => {
    const p = e.target.closest('[data-p]');
    if (p) { state.page += Number(p.dataset.p); load(root); return; }
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const a = items.find((x) => x._id === btn.closest('tr').dataset.id); if (!a) return;
    if (btn.dataset.act === 'view') viewDialog(a);
    else if (btn.dataset.act === 'edit') editDialog(a, root);
    else if (await confirmBox(`आवेदन ${a.reference} हमेशा के लिए हटाएं?`)) {
      try { const r = await api(`/admin/applications/${a._id}`, { method: 'DELETE' }); toast(r.message); load(root); } catch (err) { toast(err.message, 'error'); }
    }
  });
}
