import { api } from '../api.js';
import { toast } from './notifications.js';
import { esc } from '../utils.js';

const MAX_EXAMPLES = 8;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function row(example = {}) {
  const fileId = typeof example.imageFileId === 'object'
    ? example.imageFileId?._id || ''
    : example.imageFileId || '';
  const imageUrl = example.imageUrl || example.imageFileId?.secureUrl || '';
  return `<div class="document-example-row" data-file-id="${esc(fileId)}">
    <div class="field"><label>दस्तावेज़ का नाम</label><input type="text" data-example-name value="${esc(example.name || '')}" maxlength="80" placeholder="जैसे: आधार कार्ड"></div>
    <div class="field"><label>उदाहरण फोटो (JPG, PNG, WebP; अधिकतम 5 MB)</label><input type="file" data-example-image accept="image/jpeg,image/png,image/webp">${imageUrl ? `<img class="document-example-preview" src="${esc(imageUrl)}" alt="${esc(example.name || 'दस्तावेज़ का उदाहरण')}">` : ''}</div>
    <button class="btn btn-ghost btn-sm" type="button" data-remove-example>हटाएं</button>
  </div>`;
}

export function documentExamplesField(examples = []) {
  return `<section class="field document-example-field">
    <label>ज़रूरी दस्तावेज़ों की उदाहरण फोटो</label>
    <p class="muted small">यह फोटो सभी visitors देख सकेंगे। केवल sample या पूरी तरह छिपाई गई जानकारी वाली फोटो अपलोड करें—किसी असली ग्राहक का दस्तावेज़ नहीं।</p>
    <div data-document-example-rows>${examples.map(row).join('')}</div>
    <button type="button" class="btn btn-ghost btn-sm" data-add-example>+ उदाहरण फोटो जोड़ें</button>
  </section>`;
}

export function bindDocumentExamples(form, dialog) {
  const rows = form.querySelector('[data-document-example-rows]');
  const addButton = form.querySelector('[data-add-example]');
  const previews = new Set();
  const updateAddButton = () => { addButton.disabled = rows.children.length >= MAX_EXAMPLES; };
  addButton.addEventListener('click', () => {
    if (rows.children.length >= MAX_EXAMPLES) return;
    rows.insertAdjacentHTML('beforeend', row());
    updateAddButton();
  });
  rows.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-example]');
    if (!removeButton) return;
    const exampleRow = removeButton.closest('.document-example-row');
    const preview = exampleRow.querySelector('.document-example-preview');
    if (preview && preview.dataset.objectUrl) {
      URL.revokeObjectURL(preview.dataset.objectUrl);
      previews.delete(preview.dataset.objectUrl);
    }
    exampleRow.remove();
    updateAddButton();
  });
  rows.addEventListener('change', (event) => {
    const input = event.target.closest('[data-example-image]');
    if (!input) return;
    const exampleRow = input.closest('.document-example-row');
    let preview = exampleRow.querySelector('.document-example-preview');
    if (preview && preview.dataset.objectUrl) {
      URL.revokeObjectURL(preview.dataset.objectUrl);
      previews.delete(preview.dataset.objectUrl);
    }
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    previews.add(url);
    if (!preview) {
      preview = document.createElement('img');
      preview.className = 'document-example-preview';
      input.after(preview);
    }
    preview.src = url;
    preview.alt = 'दस्तावेज़ की उदाहरण फोटो';
    preview.dataset.objectUrl = url;
  });
  dialog.addEventListener('close', () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    previews.clear();
  });
  updateAddButton();
}

export async function collectDocumentExamples(form, uploadedIds) {
  const entries = [...form.querySelectorAll('.document-example-row')].map((exampleRow) => ({
    row: exampleRow,
    name: exampleRow.querySelector('[data-example-name]').value.trim(),
    fileId: exampleRow.dataset.fileId,
    file: exampleRow.querySelector('[data-example-image]').files[0],
  })).filter((entry) => entry.name || entry.fileId || entry.file);

  for (const entry of entries) {
    if (entry.name.length < 2) throw new Error('दस्तावेज़ का नाम कम से कम 2 अक्षर का लिखें।');
    if (!entry.file && !entry.fileId) throw new Error('हर दस्तावेज़ उदाहरण के लिए फोटो चुनें।');
    if (entry.file && !IMAGE_TYPES.includes(entry.file.type)) throw new Error('JPG, PNG या WebP फोटो चुनें।');
    if (entry.file && entry.file.size > 5 * 1024 * 1024) throw new Error('फोटो 5 MB से छोटी होनी चाहिए।');
  }
  if (entries.length > MAX_EXAMPLES) throw new Error('अधिकतम 8 उदाहरण फोटो जोड़ें।');

  const result = [];
  for (const entry of entries) {
    let imageFileId = entry.fileId;
    if (entry.file) {
      const upload = new FormData();
      upload.append('kind', 'gallery');
      upload.append('file', entry.file);
      const uploaded = await api('/uploads', { method: 'POST', form: upload });
      imageFileId = uploaded.data.id;
      uploadedIds.push(imageFileId);
    }
    result.push({ name: entry.name, imageFileId });
  }
  return result;
}

export async function removeDocumentExampleFiles(ids) {
  for (const id of new Set(ids.filter(Boolean).map(String))) {
    try { await api(`/uploads/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
    catch { toast('कुछ पुरानी उदाहरण फोटो हट नहीं सकीं। Admin Files में जाकर जाँचें।', 'error'); }
  }
}

export async function cleanupRemovedDocumentExamples(previous = [], current = []) {
  const retained = new Set(current.map((example) => String(example.imageFileId)));
  const removed = previous
    .map((example) => example.imageFileId?._id || example.imageFileId)
    .filter((id) => id && !retained.has(String(id)));
  await removeDocumentExampleFiles(removed);
}
