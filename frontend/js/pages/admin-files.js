import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, fmtDate } from '../utils.js';

export const meta = { title: 'फ़ाइलें', desc: '' };
let items = [];
const kb = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const table = () => `<div class="table-wrap"><table class="table"><thead><tr><th>फ़ाइल</th><th>प्रकार</th><th>साइज़</th><th>मालिक</th><th>तारीख़</th><th>कार्रवाई</th></tr></thead><tbody>
  ${items.map((f) => `<tr data-id="${f._id}"><td data-l="फ़ाइल" class="clip">${esc(f.cloudinaryPublicId.split('/').pop())}</td><td data-l="प्रकार">${esc(f.format || f.resourceType)} <span class="badge badge-${f.isPrivate ? 'amber' : 'green'}">${f.isPrivate ? 'निजी' : 'सार्वजनिक'}</span></td><td data-l="साइज़">${kb(f.bytes || 0)}</td><td data-l="मालिक">${esc(f.ownerId ? f.ownerId.name : '-')}</td><td data-l="तारीख़">${fmtDate(f.createdAt)}</td>
  <td class="actions"><button class="icon-btn round" data-act="open" aria-label="खोलें">${icon('eye', 16)}</button><button class="icon-btn round danger" data-act="del" aria-label="हटाएं">${icon('trash', 16)}</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">अभी कोई फ़ाइल नहीं है।</td></tr>'}</tbody></table></div>`;

export async function render() {
  let list;
  try { items = (await api('/admin/files')).data; list = table(); } catch (e) { list = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/files', 'फ़ाइलें', `
    <section class="panel"><h2>नई फ़ाइल अपलोड करें</h2>
      <form id="up" class="upload-form" novalidate>
        <select name="kind" aria-label="फ़ोल्डर"><option value="gallery">गैलरी (सार्वजनिक फोटो)</option><option value="documents">दस्तावेज़ (निजी)</option></select>
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="फ़ाइल चुनें">
        <button class="btn btn-primary btn-sm" type="submit">${icon('upload', 16)}अपलोड करें</button>
      </form><p class="muted small">फोटो अधिकतम 5MB, PDF अधिकतम 10MB। दस्तावेज़ निजी रहते हैं और सिर्फ अस्थायी लिंक से खुलते हैं।</p></section>
    <section class="panel" id="files">${list}</section>`);
}

export function mount(root) {
  const form = root.querySelector('#up');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = form.file.files[0];
    if (!file) return toast('पहले फ़ाइल चुनें।', 'error');
    const fd = new FormData(); fd.append('kind', form.kind.value); fd.append('file', file); // kind पहले, ताकि multer उसे पढ़े
    const btn = form.querySelector('button'); btn.disabled = true;
    try { const r = await api('/uploads', { method: 'POST', form: fd }); toast(r.message); form.reset(); items = (await api('/admin/files')).data; root.querySelector('#files').innerHTML = table(); }
    catch (err) { toast(err.message, 'error'); } finally { btn.disabled = false; }
  });
  root.querySelector('#files').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const f = items.find((x) => x._id === b.closest('tr').dataset.id); if (!f) return;
    try {
      if (b.dataset.act === 'open') { const r = await api(`/uploads/${f._id}/url`); window.open(r.data.url, '_blank', 'noopener'); }
      else if (await confirmBox('यह फ़ाइल हमेशा के लिए हटाएं?')) { const r = await api(`/uploads/${f._id}`, { method: 'DELETE' }); toast(r.message); items = items.filter((x) => x._id !== f._id); root.querySelector('#files').innerHTML = table(); }
    } catch (err) { toast(err.message, 'error'); }
  });
}
