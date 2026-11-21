import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { esc } from '../utils.js';

export const meta = { title: 'फॉर्म डाउनलोड', desc: 'उपलब्ध आवेदन फॉर्म डाउनलोड करें।' };
const size = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export async function render() {
  let forms;
  try { forms = (await api('/forms')).data; }
  catch (error) {
    return `<section class="download-page container"><h1>फॉर्म डाउनलोड</h1><p class="empty">${esc(error.message)}</p></section>`;
  }
  const cards = forms.map((form) => `
    <article class="download-card">
      <span class="download-card-icon">${icon('file', 24)}</span>
      <div class="download-card-info">
        <h2>${esc(form.title)}</h2>
        ${form.description ? `<p>${esc(form.description)}</p>` : ''}
        <small>${esc(form.fileName)} · ${size(form.bytes || 0)}</small>
      </div>
      <a class="btn btn-primary btn-sm" href="${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api/forms/${encodeURIComponent(form._id)}/download">${icon('file', 16)}डाउनलोड करें</a>
    </article>`).join('');
  return `<section class="download-page container">
    <h1>फॉर्म डाउनलोड</h1>
    <p class="muted">उपलब्ध आवेदन फॉर्म यहाँ से डाउनलोड करें।</p>
    <div class="download-grid">${cards || '<p class="empty">अभी कोई फॉर्म उपलब्ध नहीं है।</p>'}</div>
  </section>`;
}
