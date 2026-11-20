import { api } from '../api.js';
import { adminShell } from '../components/sidebar.js';
import { openDialog, toast } from '../components/notifications.js';
import { esc, badge, fmtDate, STATUS } from '../utils.js';

export const meta = { title: 'पूछताछ', desc: '' };
let items = [];

const table = () => `<div class="table-wrap"><table class="table"><thead><tr><th>नाम</th><th>मोबाइल</th><th>संदेश</th><th>स्थिति</th><th>तारीख़</th></tr></thead><tbody>
  ${items.map((m) => `<tr class="clickable" data-id="${m._id}" tabindex="0"><td data-l="नाम">${esc(m.name)}</td><td data-l="मोबाइल">${esc(m.mobile)}</td><td data-l="संदेश" class="clip">${esc(m.message)}</td><td data-l="स्थिति">${badge(m.status)}</td><td data-l="तारीख़">${fmtDate(m.createdAt)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">अभी कोई पूछताछ नहीं है।</td></tr>'}</tbody></table></div>`;

export async function render() {
  let inner;
  try { items = (await api('/admin/enquiries')).data; inner = table(); } catch (e) { inner = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/enquiries', 'पूछताछ', `<section class="panel" id="enq">${inner}</section>`);
}

async function setStatus(m, status, root) {
  try { await api(`/admin/enquiries/${m._id}/status`, { method: 'PATCH', body: { status } }); m.status = status; root.querySelector('#enq').innerHTML = table(); }
  catch (e) { toast(e.message, 'error'); }
}

export function mount(root) {
  const open = async (tr) => {
    const m = items.find((x) => x._id === tr.dataset.id); if (!m) return;
    if (m.status === 'new') await setStatus(m, 'read', root);
    const d = openDialog(`<dl class="kv"><dt>नाम</dt><dd>${esc(m.name)}</dd><dt>मोबाइल</dt><dd><a href="tel:${esc(m.mobile)}">${esc(m.mobile)}</a></dd>${m.email ? `<dt>ईमेल</dt><dd>${esc(m.email)}</dd>` : ''}<dt>विषय</dt><dd>${esc(m.subject || '-')}</dd><dt>संदेश</dt><dd class="pre">${esc(m.message)}</dd></dl>
      <div class="field"><label for="es">स्थिति</label><select id="es">${['new', 'read', 'replied'].map((k) => `<option value="${k}"${k === m.status ? ' selected' : ''}>${STATUS[k][0]}</option>`).join('')}</select></div>`, { title: 'पूछताछ' });
    d.querySelector('#es').addEventListener('change', (e) => setStatus(m, e.target.value, root));
  };
  root.addEventListener('click', (e) => { const tr = e.target.closest('tr.clickable'); if (tr) open(tr); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const tr = e.target.closest('tr.clickable'); if (tr) open(tr); } });
}
