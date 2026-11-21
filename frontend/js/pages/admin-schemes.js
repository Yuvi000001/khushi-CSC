import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { openDialog, confirmBox, toast } from '../components/notifications.js';
import { esc } from '../utils.js';

export const meta = { title: 'योजना प्रबंधन', desc: '' };
let items = [];

const image = (scheme) => scheme.imageUrl
  ? `<img class="scheme-admin-image" src="${esc(scheme.imageUrl)}" alt="${esc(scheme.name)}">`
  : `<span class="scheme-admin-image scheme-admin-placeholder">${icon('document', 24)}</span>`;

const grid = () => `<div class="scheme-admin-grid">${items.map((scheme) => `
  <article class="scheme-admin${scheme.active ? '' : ' off'}" data-slug="${esc(scheme.slug)}">
    ${image(scheme)}
    <div class="scheme-admin-info"><h3 data-i18n-en="${esc(scheme.nameEn || '')}">${esc(scheme.name)}</h3><p data-i18n-en="${esc(scheme.descriptionEn || '')}">${esc(scheme.description || '')}</p>
      <small><span data-i18n-en="${esc(scheme.categoryEn || '')}">${esc(scheme.category || scheme.categoryEn || '')}</span> · ${scheme.active ? 'चालू' : 'बंद'}</small></div>
    <div class="actions">
      <button class="icon-btn round" data-act="toggle" aria-label="चालू / बंद करें">${icon('toggle', 16)}</button>
      <button class="icon-btn round" data-act="edit" aria-label="बदलें">${icon('edit', 16)}</button>
      <button class="icon-btn round danger" data-act="del" aria-label="हटाएं">${icon('trash', 16)}</button>
    </div>
  </article>`).join('') || '<p class="empty">अभी कोई योजना नहीं है।</p>'}</div>`;

export async function render() {
  let inner;
  try { items = (await api('/admin/schemes')).data; inner = grid(); }
  catch (e) { inner = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/schemes', 'योजना प्रबंधन', `<section class="panel"><div id="schemes">${inner}</div></section>`,
    `<button type="button" class="btn btn-primary btn-sm" id="add-scheme">${icon('plus', 14)}नई योजना जोड़ें</button>`);
}

async function reload(root) {
  items = (await api('/admin/schemes')).data;
  root.querySelector('#schemes').innerHTML = grid();
}

function form(scheme) {
  scheme = scheme || {};
  return `<form id="scheme-form" novalidate>
    <div class="scheme-form-grid">
      <div class="field"><label for="scheme-name">योजना का नाम (हिंदी) *</label><input id="scheme-name" name="name" value="${esc(scheme.name || '')}" maxlength="100" required></div>
      <div class="field"><label for="scheme-name-en">Name in English *</label><input id="scheme-name-en" name="nameEn" value="${esc(scheme.nameEn || '')}" maxlength="100" required></div>
      <div class="field"><label for="scheme-description">विवरण (हिंदी)</label><textarea id="scheme-description" name="description" rows="3" maxlength="600">${esc(scheme.description || '')}</textarea></div>
      <div class="field"><label for="scheme-description-en">Description in English</label><textarea id="scheme-description-en" name="descriptionEn" rows="3" maxlength="600">${esc(scheme.descriptionEn || '')}</textarea></div>
      <div class="field"><label for="scheme-category">श्रेणी (हिंदी)</label><input id="scheme-category" name="category" value="${esc(scheme.category || '')}" maxlength="80"></div>
      <div class="field"><label for="scheme-category-en">Category in English</label><input id="scheme-category-en" name="categoryEn" value="${esc(scheme.categoryEn || '')}" maxlength="80"></div>
      <div class="field"><label for="scheme-order">दिखाने का क्रम</label><input id="scheme-order" name="displayOrder" type="number" min="0" max="9999" value="${Number(scheme.displayOrder) || items.length + 1}"></div>
      <div class="field"><label for="scheme-image">योजना की फोटो (JPG, PNG, WebP; अधिकतम 5 MB)</label><input id="scheme-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"></div>
    </div>
    <div class="scheme-image-preview" id="scheme-image-preview">${scheme.imageUrl ? `<img src="${esc(scheme.imageUrl)}" alt="${esc(scheme.name)}">` : '<span>फोटो चुनें</span>'}</div>
    <div class="dialog-actions"><button type="button" class="btn btn-ghost" data-close>रद्द करें</button><button class="btn btn-primary" type="submit">सहेजें</button></div>
  </form>`;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function editor(scheme, root) {
  const dialog = openDialog(form(scheme), { title: scheme ? 'योजना बदलें' : 'नई योजना जोड़ें', wide: true });
  const formEl = dialog.querySelector('#scheme-form');
  const imageInput = formEl.elements.image;
  let previewUrl = '';
  let uploadedId = '';
  let saved = false;
  imageInput.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = imageInput.files[0];
    previewUrl = file ? URL.createObjectURL(file) : '';
    dialog.querySelector('#scheme-image-preview').innerHTML = previewUrl
      ? `<img src="${previewUrl}" alt="योजना की फोटो">`
      : scheme && scheme.imageUrl ? `<img src="${esc(scheme.imageUrl)}" alt="${esc(scheme.name)}">` : '<span>फोटो चुनें</span>';
  });
  dialog.addEventListener('close', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(formEl));
    const file = imageInput.files[0];
    if (values.name.trim().length < 2 || values.nameEn.trim().length < 2) return toast('हिंदी और English में योजना का नाम लिखें।', 'error');
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast('JPG, PNG या WebP फोटो चुनें।', 'error');
    if (file && file.size > 5 * 1024 * 1024) return toast('फोटो 5 MB से छोटी होनी चाहिए।', 'error');

    const button = formEl.querySelector('[type="submit"]');
    button.disabled = true;
    const payload = {
      name: values.name.trim(),
      nameEn: values.nameEn.trim(),
      description: values.description.trim(),
      descriptionEn: values.descriptionEn.trim(),
      category: values.category.trim(),
      categoryEn: values.categoryEn.trim(),
      displayOrder: values.displayOrder === '' ? items.length + 1 : Number(values.displayOrder),
      imageUrl: scheme ? scheme.imageUrl : '',
      imageFileId: scheme ? scheme.imageFileId : null,
    };
    if (!scheme) payload.slug = slugify(payload.nameEn) || `scheme-${Date.now().toString(36)}`;

    try {
      if (file) {
        const upload = new FormData();
        upload.append('kind', 'gallery');
        upload.append('file', file);
        const result = await api('/uploads', { method: 'POST', form: upload });
        uploadedId = result.data.id;
        payload.imageUrl = result.data.url;
        payload.imageFileId = result.data.id;
      }
      const path = scheme ? `/admin/schemes/${encodeURIComponent(scheme.slug)}` : '/admin/schemes';
      const result = await api(path, { method: scheme ? 'PATCH' : 'POST', body: payload });
      saved = true;
      dialog.close();
      toast(result.message);
      if (file && scheme && scheme.imageFileId) {
        try { await api(`/uploads/${scheme.imageFileId}`, { method: 'DELETE' }); }
        catch { toast('योजना सेव हो गई, लेकिन पुरानी फोटो हट नहीं सकी। Admin Files से उसे हटाएं।', 'error'); }
      }
      await reload(root);
    } catch (error) {
      toast(error.message, 'error');
      if (uploadedId && !saved) {
        try { await api(`/uploads/${uploadedId}`, { method: 'DELETE' }); }
        catch { toast('अपलोड हुई फोटो साफ नहीं हो सकी। Admin Files में जाकर उसे हटाएं।', 'error'); }
      }
    } finally { button.disabled = false; }
  });
}

export function mount(root) {
  const addButton = root.querySelector('#add-scheme');
  if (addButton) addButton.addEventListener('click', () => editor(null, root));
  root.addEventListener('click', async (event) => {
    if (event.target.closest('#add-scheme')) return;
    const button = event.target.closest('[data-act]');
    if (!button) return;
    const scheme = items.find((item) => item.slug === button.closest('[data-slug]').dataset.slug);
    if (!scheme) return;
    try {
      if (button.dataset.act === 'edit') return editor(scheme, root);
      if (button.dataset.act === 'toggle') {
        await api(`/admin/schemes/${encodeURIComponent(scheme.slug)}`, { method: 'PATCH', body: { active: !scheme.active } });
        await reload(root);
      } else if (await confirmBox(`"${scheme.name}" योजना हमेशा के लिए हटाएं?`)) {
        const result = await api(`/admin/schemes/${encodeURIComponent(scheme.slug)}`, { method: 'DELETE' });
        if (result.data.imageFileId) {
          try { await api(`/uploads/${result.data.imageFileId}`, { method: 'DELETE' }); }
          catch { toast('योजना हट गई, लेकिन उसकी फोटो साफ नहीं हो सकी। Admin Files से उसे हटाएं।', 'error'); }
        }
        toast(result.message);
        await reload(root);
      }
    } catch (error) { toast(error.message, 'error'); }
  });
}
