import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, fmtDate } from '../utils.js';

export const meta = { title: 'होम विज्ञापन', desc: '' };
let items = [];
const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'jpe', 'jfif', 'png', 'webp', 'gif', 'bmp', 'dib',
  'tif', 'tiff', 'avif', 'heic', 'heif', 'svg', 'ico', 'jp2', 'j2k',
]);

const grid = () => `<div class="ad-admin-grid">${items.map((ad) => `
  <article class="ad-admin-card" data-id="${esc(ad._id)}">
    <img src="${esc(ad.url)}" alt="${esc(ad.originalName || 'होम विज्ञापन')}" loading="lazy">
    <div class="ad-admin-info"><strong>${esc(ad.originalName || 'होम विज्ञापन')}</strong><small>${fmtDate(ad.createdAt)}</small></div>
    <button type="button" class="icon-btn round danger" data-delete-ad aria-label="विज्ञापन हटाएं">${icon('trash', 16)}</button>
  </article>`).join('') || '<p class="empty">अभी कोई होम फोटो नहीं है।</p>'}</div>`;

async function reload(root) {
  items = (await api('/admin/ads')).data;
  root.querySelector('#ad-list').innerHTML = grid();
}

export async function render() {
  let list;
  try { items = (await api('/admin/ads')).data; list = grid(); }
  catch (error) { list = `<p class="empty">${esc(error.message)}</p>`; }
  return adminShell('/admin/ads', 'होम विज्ञापन', `
    <section class="panel">
      <h2>होम स्लाइड में फोटो जोड़ें</h2>
      <form id="ad-upload" class="ad-upload-form" novalidate>
        <label class="field"><span>एक साथ कई फोटो चुनें</span><input type="file" name="images" accept="image/*,.heic,.heif,.avif,.tif,.tiff,.bmp,.dib,.svg,.ico,.jp2,.j2k" multiple required></label>
        <button class="btn btn-primary btn-sm" type="submit">${icon('upload', 16)}होम पर जोड़ें</button>
      </form>
      <p class="muted small">सभी सामान्य फोटो फ़ॉर्मेट चुन सकते हैं; हर फोटो अधिकतम 5 MB। फोटो 2 सेकंड के अंतर से दिखाई देंगी। हटाने पर स्लाइड से भी हट जाएगी।</p>
    </section>
    <section class="panel"><div id="ad-list">${list}</div></section>`);
}

export function mount(root) {
  const form = root.querySelector('#ad-upload');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const files = [...form.elements.images.files];
    if (!files.length) return toast('पहले फोटो चुनें।', 'error');
    for (const file of files) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!file.type.startsWith('image/') && !IMAGE_EXTENSIONS.has(extension)) return toast('फोटो फ़ाइल चुनें।', 'error');
      if (file.size > 5 * 1024 * 1024) return toast(`${file.name}: फोटो 5 MB से छोटी होनी चाहिए।`, 'error');
    }

    const button = form.querySelector('[type="submit"]');
    const buttonHtml = button.innerHTML;
    button.disabled = true;
    button.textContent = `अपलोड हो रहा है (0/${files.length})`;
    let uploaded = 0;
    let failure = '';
    try {
      for (const file of files) {
        const data = new FormData();
        data.append('kind', 'ads');
        data.append('file', file);
        try {
          await api('/uploads', { method: 'POST', form: data });
          uploaded++;
          button.textContent = `अपलोड हो रहा है (${uploaded}/${files.length})`;
        } catch (error) {
          failure = `${file.name}: ${error.message}`;
          break;
        }
      }

      if (uploaded) {
        form.reset();
        try { await reload(root); }
        catch (error) {
          toast(`${uploaded} फोटो अपलोड हुईं, लेकिन सूची refresh नहीं हो सकी: ${error.message}`, 'error');
          return;
        }
      }
      if (failure) toast(`${uploaded} फोटो अपलोड हुईं। ${failure}`, 'error');
      else toast(`${uploaded} फोटो होम स्लाइड में जोड़ दी गईं।`);
    } finally {
      button.disabled = false;
      button.innerHTML = buttonHtml;
    }
  });

  root.querySelector('#ad-list').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-ad]');
    if (!button || !await confirmBox('इस फोटो को होम स्लाइड से हमेशा के लिए हटाएं?')) return;
    const ad = items.find((item) => item._id === button.closest('[data-id]').dataset.id);
    if (!ad) return;
    button.disabled = true;
    try {
      const result = await api(`/uploads/${encodeURIComponent(ad._id)}`, { method: 'DELETE' });
      items = items.filter((item) => item._id !== ad._id);
      root.querySelector('#ad-list').innerHTML = grid();
      toast(result.message);
    } catch (error) {
      toast(error.message, 'error');
      button.disabled = false;
    }
  });
}
