import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, fmtDate } from '../utils.js';

export const meta = { title: 'फ़ाइलें', desc: '' };
let items = [];
let downloadForms = [];
const kb = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

const table = () => `<div class="table-wrap"><table class="table"><thead><tr><th>फ़ाइल</th><th>प्रकार</th><th>साइज़</th><th>मालिक</th><th>तारीख़</th><th>कार्रवाई</th></tr></thead><tbody>
  ${items.map((f) => `<tr data-id="${f._id}"><td data-l="फ़ाइल" class="clip">${esc(f.cloudinaryPublicId.split('/').pop())}</td><td data-l="प्रकार">${esc(f.format || f.resourceType)} <span class="badge badge-${f.isPrivate ? 'amber' : 'green'}">${f.isPrivate ? 'निजी' : 'सार्वजनिक'}</span></td><td data-l="साइज़">${kb(f.bytes || 0)}</td><td data-l="मालिक">${esc(f.ownerId ? f.ownerId.name : '-')}</td><td data-l="तारीख़">${fmtDate(f.createdAt)}</td>
  <td class="actions"><button class="icon-btn round" data-act="open" aria-label="खोलें">${icon('eye', 16)}</button><button class="icon-btn round danger" data-act="del" aria-label="हटाएं">${icon('trash', 16)}</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">अभी कोई फ़ाइल नहीं है।</td></tr>'}</tbody></table></div>`;

const downloadFormsTable = () => `<div class="table-wrap"><table class="table"><thead><tr><th>फॉर्म का नाम</th><th>फ़ाइल</th><th>साइज़</th><th>कार्रवाई</th></tr></thead><tbody>
  ${downloadForms.map((form) => `<tr data-form-id="${form._id}"><td data-l="फॉर्म का नाम">${esc(form.title)}</td><td data-l="फ़ाइल">${esc(form.fileId ? form.fileId.originalName : '-')}</td><td data-l="साइज़">${kb(form.fileId ? form.fileId.bytes || 0 : 0)}</td><td class="actions"><button type="button" class="icon-btn round danger" data-form-act="del" aria-label="हटाएं">${icon('trash', 16)}</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">अभी कोई डाउनलोड फॉर्म नहीं है।</td></tr>'}</tbody></table></div>`;

export async function render() {
  let list, formsList;
  try { items = (await api('/admin/files')).data; list = table(); } catch (e) { list = `<p class="empty">${esc(e.message)}</p>`; }
  try { downloadForms = (await api('/admin/download-forms')).data; formsList = downloadFormsTable(); } catch (e) { formsList = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/files', 'फ़ाइलें', `
    <section class="panel"><h2>डाउनलोड फॉर्म जोड़ें</h2>
      <form id="download-form-upload" class="download-form-upload" novalidate>
        <label class="field"><span>फॉर्म का नाम *</span><input name="title" maxlength="120" required placeholder="जैसे: आवेदन फॉर्म"></label>
        <label class="field"><span>विवरण</span><input name="description" maxlength="500" placeholder="वैकल्पिक जानकारी"></label>
        <label class="field"><span>PDF / Word / Excel / PowerPoint दस्तावेज़ *</span><input type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv" required></label>
        <button class="btn btn-primary btn-sm" type="submit">${icon('upload', 16)}अपलोड करें</button>
      </form>
      <p class="muted small">PDF, Word, Excel, PowerPoint, OpenDocument, RTF, TXT और CSV फ़ाइलें (अधिकतम 20 MB) अपलोड कर सकते हैं। ये फॉर्म सार्वजनिक रूप से डाउनलोड किए जा सकेंगे।</p>
      <div id="download-forms">${formsList}</div>
    </section>
    <section class="panel"><h2>नई फ़ाइल अपलोड करें</h2>
      <form id="up" class="upload-form" novalidate>
        <select name="kind" aria-label="फ़ोल्डर"><option value="gallery">गैलरी (सार्वजनिक फोटो)</option><option value="documents">दस्तावेज़ (निजी)</option></select>
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="फ़ाइल चुनें">
        <button class="btn btn-primary btn-sm" type="submit">${icon('upload', 16)}अपलोड करें</button>
      </form><p class="muted small">फोटो अधिकतम 5MB, PDF अधिकतम 10MB। दस्तावेज़ निजी रहते हैं और सिर्फ अस्थायी लिंक से खुलते हैं।</p></section>
    <section class="panel" id="files">${list}</section>`);
}

export function mount(root) {
  const downloadFormUpload = root.querySelector('#download-form-upload');
  downloadFormUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = downloadFormUpload.elements.title.value.trim();
    const file = downloadFormUpload.elements.file.files[0];
    if (title.length < 2) return toast('फॉर्म का नाम कम से कम 2 अक्षर का लिखें।', 'error');
    if (!file) return toast('पहले दस्तावेज़ चुनें।', 'error');
    if (file.size > 20 * 1024 * 1024) return toast('दस्तावेज़ 20MB से छोटी होनी चाहिए।', 'error');
    const button = downloadFormUpload.querySelector('[type="submit"]');
    button.disabled = true;
    let uploadedId = '';
    let saved = false;
    try {
      const uploadData = new FormData();
      uploadData.append('kind', 'forms');
      uploadData.append('file', file);
      const uploaded = await api('/uploads', { method: 'POST', form: uploadData });
      uploadedId = uploaded.data.id;
      const result = await api('/admin/download-forms', {
        method: 'POST',
        body: { title, description: downloadFormUpload.elements.description.value.trim(), fileId: uploadedId },
      });
      saved = true;
      toast(result.message);
      downloadFormUpload.reset();
      downloadForms = (await api('/admin/download-forms')).data;
      root.querySelector('#download-forms').innerHTML = downloadFormsTable();
    } catch (err) {
      toast(err.message, 'error');
      if (uploadedId && !saved) {
        try { await api(`/uploads/${uploadedId}`, { method: 'DELETE' }); }
        catch { toast('अपलोड हुई फ़ाइल साफ नहीं हो सकी। फ़ाइलें पेज से उसे हटाएं।', 'error'); }
      }
    } finally { button.disabled = false; }
  });

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
  root.querySelector('#download-forms').addEventListener('click', async (e) => {
    const button = e.target.closest('[data-form-act="del"]');
    if (!button) return;
    const form = downloadForms.find((item) => item._id === button.closest('[data-form-id]').dataset.formId);
    if (!form || !await confirmBox(`"${form.title}" डाउनलोड फॉर्म हटाएं?`)) return;
    button.disabled = true;
    try {
      const result = await api(`/admin/download-forms/${form._id}`, { method: 'DELETE' });
      try { await api(`/uploads/${result.data.fileId}`, { method: 'DELETE' }); }
      catch { toast('फॉर्म हट गया, लेकिन फ़ाइल साफ नहीं हो सकी। फ़ाइलें सूची से उसे हटाएं।', 'error'); }
      toast(result.message);
      downloadForms = (await api('/admin/download-forms')).data;
      root.querySelector('#download-forms').innerHTML = downloadFormsTable();
      items = (await api('/admin/files')).data;
      root.querySelector('#files').innerHTML = table();
    } catch (err) { toast(err.message, 'error'); button.disabled = false; }
  });
}
