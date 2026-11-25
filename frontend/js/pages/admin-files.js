import { api } from '../api.js';
import { CONFIG } from '../config.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, fmtDate } from '../utils.js';

export const meta = { title: 'फ़ाइलें', desc: '' };
let items = [];
let downloadForms = [];
const canPreview = (file) => file && (file.mimeType === 'application/pdf' || /^image\/(jpeg|png|webp)$/.test(file.mimeType));
const previewUrl = (fileId) => `${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api/uploads/${encodeURIComponent(fileId)}/view`;
const viewButton = (fileId, action = 'data-file-view') => `<button type="button" class="icon-btn round" ${action}="${esc(fileId)}" aria-label="फ़ाइल देखें">${icon('eye', 16)}</button>`;

const table = () => `<div class="table-wrap admin-file-list"><table class="table"><thead><tr><th>फ़ाइल</th><th>देखें</th></tr></thead><tbody>
  ${items.map((f) => `<tr><td data-l="फ़ाइल" class="clip">${esc(f.originalName || f.cloudinaryPublicId.split('/').pop())}</td><td class="actions">${viewButton(f._id)}</td></tr>`).join('') || '<tr><td colspan="2" class="empty">अभी कोई फ़ाइल नहीं है।</td></tr>'}</tbody></table></div>`;

const downloadFormsTable = () => `<div class="table-wrap"><table class="table"><thead><tr><th>फॉर्म का नाम</th><th>फ़ाइल</th><th>डाउनलोड राशि</th><th>कार्रवाई</th></tr></thead><tbody>
  ${downloadForms.map((form) => `<tr data-form-id="${form._id}"><td data-l="फॉर्म का नाम">${esc(form.title)}</td><td data-l="फ़ाइल">${esc(form.fileId ? form.fileId.originalName : '-')}</td><td data-l="डाउनलोड राशि">${Number(form.price) > 0 ? `₹${esc(Number(form.price).toLocaleString('en-IN', { maximumFractionDigits: 2 }))}` : 'निःशुल्क'}</td><td class="actions">${canPreview(form.fileId) ? viewButton(form.fileId._id, 'data-form-view') : ''}<button type="button" class="icon-btn round danger" data-form-act="del" aria-label="हटाएं">${icon('trash', 16)}</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">अभी कोई डाउनलोड फॉर्म नहीं है।</td></tr>'}</tbody></table></div>`;

export async function render() {
  let list, formsList;
  try { items = (await api('/admin/files')).data.filter((file) => !['khushi/forms', 'khushi/ads'].includes(file.folder) && canPreview(file)); list = table(); } catch (e) { list = `<p class="empty">${esc(e.message)}</p>`; }
  try { downloadForms = (await api('/admin/download-forms')).data; formsList = downloadFormsTable(); } catch (e) { formsList = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/files', 'फ़ाइलें', `
    <section class="panel"><h2>डाउनलोड फॉर्म जोड़ें</h2>
      <form id="download-form-upload" class="download-form-upload" novalidate>
        <label class="field"><span>फॉर्म का नाम *</span><input name="title" maxlength="120" required placeholder="जैसे: आवेदन फॉर्म"></label>
        <label class="field"><span>विवरण</span><input name="description" maxlength="500" placeholder="वैकल्पिक जानकारी"></label>
        <label class="field"><span>डाउनलोड राशि (₹; 0 = निःशुल्क) *</span><input name="price" type="number" min="0" max="1000000" step="0.01" value="0" required></label>
        <label class="field"><span>PDF / Word / Excel / PowerPoint दस्तावेज़ *</span><input type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv" required></label>
        <button class="btn btn-primary btn-sm" type="submit">${icon('upload', 16)}अपलोड करें</button>
      </form>
      <p class="muted small">PDF, Word, Excel, PowerPoint, OpenDocument, RTF, TXT और CSV फ़ाइलें (अधिकतम 20 MB) अपलोड कर सकते हैं। ₹0 वाले फॉर्म मुफ़्त होंगे; बाकी फॉर्म Razorpay भुगतान के बाद डाउनलोड होंगे।</p>
      <div id="download-forms">${formsList}</div>
    </section>
    <section class="panel" id="files">${list}</section>`);
}

export function mount(root) {
  const downloadFormUpload = root.querySelector('#download-form-upload');
  downloadFormUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = downloadFormUpload.elements.title.value.trim();
    const file = downloadFormUpload.elements.file.files[0];
    const priceText = downloadFormUpload.elements.price.value.trim();
    const price = Number(priceText);
    if (title.length < 2) return toast('फॉर्म का नाम कम से कम 2 अक्षर का लिखें।', 'error');
    if (!/^\d+(?:\.\d{1,2})?$/.test(priceText) || !Number.isFinite(price) || price < 0 || price > 1000000) {
      return toast('डाउनलोड राशि 0 से 10,00,000 रुपये के बीच और अधिकतम 2 दशमलव अंकों में रखें।', 'error');
    }
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
        body: { title, description: downloadFormUpload.elements.description.value.trim(), price, fileId: uploadedId },
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
        catch { toast('अपलोड हुई फ़ाइल साफ नहीं हो सकी। कृपया इसे हटाने के लिए सहायता लें।', 'error'); }
      }
    } finally { button.disabled = false; }
  });

  root.querySelector('#files').addEventListener('click', (e) => {
    const button = e.target.closest('[data-file-view]');
    if (button) window.open(previewUrl(button.dataset.fileView), '_blank', 'noopener');
  });
  root.querySelector('#download-forms').addEventListener('click', async (e) => {
    const preview = e.target.closest('[data-form-view]');
    if (preview) { window.open(previewUrl(preview.dataset.formView), '_blank', 'noopener'); return; }
    const button = e.target.closest('[data-form-act="del"]');
    if (!button) return;
    const form = downloadForms.find((item) => item._id === button.closest('[data-form-id]').dataset.formId);
    if (!form || !await confirmBox(`"${form.title}" डाउनलोड फॉर्म हटाएं?`)) return;
    button.disabled = true;
    try {
      const result = await api(`/admin/download-forms/${form._id}`, { method: 'DELETE' });
      try { await api(`/uploads/${result.data.fileId}`, { method: 'DELETE' }); }
      catch { toast('फॉर्म हट गया, लेकिन उसकी फ़ाइल साफ नहीं हो सकी। कृपया सहायता लें।', 'error'); }
      toast(result.message);
      downloadForms = (await api('/admin/download-forms')).data;
      root.querySelector('#download-forms').innerHTML = downloadFormsTable();
    } catch (err) { toast(err.message, 'error'); button.disabled = false; }
  });
}
