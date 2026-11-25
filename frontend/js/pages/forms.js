import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { esc } from '../utils.js';
import { bindPaymentActions } from '../components/payment.js';

export const meta = { title: 'फॉर्म डाउनलोड', desc: 'उपलब्ध आवेदन फॉर्म डाउनलोड करें।' };

export async function render() {
  let forms;
  try { forms = (await api('/forms')).data; }
  catch (error) {
    return `<section class="download-page container"><h1>फॉर्म डाउनलोड</h1><p class="empty">${esc(error.message)}</p></section>`;
  }
  const cards = forms.map((form) => {
    const price = Number(form.price) || 0;
    const action = price > 0
      ? `<div class="download-card-action"><strong>डाउनलोड शुल्क: ₹${esc(price.toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</strong><button class="btn btn-primary btn-sm" type="button" data-payment-razorpay data-payment-price="${esc(price.toFixed(2))}" data-payment-title="${esc(form.title)}" data-payment-type="form" data-payment-slug="${esc(form._id)}" data-payment-filename="${esc(form.fileName || form.title)}">${icon('file', 14)}Razorpay से भुगतान और डाउनलोड</button></div>`
      : `<a class="btn btn-primary btn-sm" href="${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api/forms/${encodeURIComponent(form._id)}/download">${icon('file', 14)}मुफ़्त डाउनलोड</a>`;
    return `<article class="download-card"><div class="download-card-info"><h2>${esc(form.title)}</h2>${form.description ? `<p>${esc(form.description)}</p>` : ''}</div>${action}</article>`;
  }).join('');
  return `<section class="download-page container">
    <h1>फॉर्म डाउनलोड</h1>
    <div class="download-grid">${cards || '<p class="empty">अभी कोई फॉर्म उपलब्ध नहीं है।</p>'}</div>
  </section>`;
}

export function mount(root) {
  bindPaymentActions(root);
}
