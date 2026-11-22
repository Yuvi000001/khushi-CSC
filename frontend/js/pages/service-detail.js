import { CONFIG } from '../config.js';
import { api, session } from '../api.js';
import { DEFAULT_SERVICES } from '../data.js';
import { icon } from '../icons/icons.js';
import { esc, rules } from '../utils.js';
import { field, submitForm } from '../components/form.js';
import { toast } from '../components/notifications.js';
import { bindPaymentActions, paymentAction } from '../components/payment.js';

export const meta = { title: 'सेवा', desc: '' };
let service = null;

async function load(slug) {
  try { return (await api(`/services/${encodeURIComponent(slug)}`)).data; }
  catch (e) { if (e.status === 404) return null; return DEFAULT_SERVICES.find((s) => s.slug === slug) || null; }
}

export async function render({ params }) {
  service = await load(params.slug);
  if (!service) return `<section class="container notfound"><h1>सेवा नहीं मिली</h1><a class="btn btn-primary" href="/services" data-link>सभी सेवाएं देखें</a></section>`;
  meta.title = service.name; meta.desc = service.description;
  const wa = `${CONFIG.WHATSAPP}?text=${encodeURIComponent(`नमस्ते, मुझे ${service.name} के बारे में जानकारी चाहिए।`)}`;
  const li = (items, ic) => items.map((t) => `<li>${icon(ic, 18)}<span>${esc(t)}</span></li>`).join('');
  const u = session.user;
  const apply = u ? `
    <form class="card apply" id="apply-form" novalidate>
      <h2>ऑनलाइन आवेदन दर्ज करें</h2>
      <p class="muted">आवेदन दर्ज होने के बाद केंद्र आपसे संपर्क करेगा। यहाँ Aadhaar नंबर, OTP या Bank PIN न लिखें।</p>
      <div class="field"><label for="f-applicantName">आवेदक का नाम <span class="req">*</span></label><input id="f-applicantName" name="applicantName" value="${esc(u.name)}" autocomplete="name"></div>
      <div class="field"><label for="f-applicantMobile">मोबाइल नंबर <span class="req">*</span></label><input id="f-applicantMobile" name="applicantMobile" value="${esc(u.mobile)}" inputmode="numeric" maxlength="10" autocomplete="tel"></div>
      <div class="field"><label for="f-notes">टिप्पणी (वैकल्पिक)</label><textarea id="f-notes" name="notes" rows="3" maxlength="1000" placeholder="कोई ज़रूरी बात हो तो लिखें"></textarea></div>
      <button class="btn btn-primary" type="submit">आवेदन दर्ज करें</button>
    </form>` : `
    <div class="card apply"><h2>ऑनलाइन आवेदन दर्ज करें</h2><p class="muted">आवेदन की स्थिति देखने के लिए पहले लॉगिन करें।</p>
    <a class="btn btn-primary" href="/login?next=${encodeURIComponent('/services/' + service.slug)}" data-link>लॉगिन करें</a></div>`;
  return `
  <div class="container detail">
    <nav class="crumbs" aria-label="ब्रेडक्रंब"><a href="/" data-link>होम</a>${icon('chevron', 14)}<a href="/services" data-link>सेवाएं</a>${icon('chevron', 14)}<span aria-current="page">${esc(service.name)}</span></nav>
    <header class="detail-head">
      <span class="detail-ic">${icon(service.icon, 40)}</span>
      <div><h1 data-i18n-en="${esc(service.nameEn || '')}">${esc(service.name)}</h1><p>${esc(service.description)}</p><p class="en">${esc(service.nameEn)}</p></div>
    </header>
    <div class="detail-grid">
      <div class="detail-main">
        <section class="card" data-reveal><h2>मुख्य सुविधाएं</h2><ul class="ticks">${li(service.features || [], 'check')}</ul></section>
        <section class="card" data-reveal><h2>आवश्यक दस्तावेज़ (सामान्यतः)</h2><ul class="ticks docs">${li(service.documents || [], 'document')}</ul>
          <p class="muted small">नोट: दस्तावेज़ सेवा और पात्रता के अनुसार अलग-अलग हो सकते हैं। आवेदन से पहले पुष्टि कर लें।</p></section>
        <div class="alert">${icon('info', 20)}<p>सरकारी शुल्क अलग से लगेगा। कृपया Aadhaar नंबर, OTP या Bank PIN किसी के साथ साझा न करें - न फ़ोन पर, न मैसेज में।</p></div>
        <div class="cta-row"><a class="btn btn-primary" href="${CONFIG.CALL}">${icon('phone', 18)}हमें कॉल करें</a><a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${icon('whatsapp', 18)}WhatsApp करें</a></div>
        ${Number(service.price) > 0 ? `<section class="card payment-card"><h2>ऑनलाइन भुगतान</h2><p class="muted">यह केंद्र का सेवा शुल्क है। सरकारी शुल्क इसमें शामिल नहीं है।</p>${paymentAction(service, 'service')}</section>` : ''}
        ${apply}
      </div>
      <aside class="detail-side card">
        <h2>केंद्र की जानकारी</h2>
        <dl>
          <dt>CSC ID</dt><dd>${CONFIG.CSC_ID}</dd>
          <dt>संचालक</dt><dd>${CONFIG.OWNER}</dd>
          <dt>पता</dt><dd>${CONFIG.ADDRESS}</dd>
          <dt>मोबाइल</dt><dd><a href="${CONFIG.CALL}">${CONFIG.MOBILE}</a></dd>
          <dt>ईमेल</dt><dd><a href="mailto:${CONFIG.EMAIL}">${CONFIG.EMAIL}</a></dd>
          ${CONFIG.TIMING ? `<dt>समय</dt><dd>${esc(CONFIG.TIMING)}</dd>` : ''}
        </dl>
      </aside>
    </div>
  </div>`;
}

export function mount(root) {
  bindPaymentActions(root);
  const form = root.querySelector('#apply-form'); if (!form || !service) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, (d) => ({
      applicantName: rules.required(d.applicantName, 'आवेदक का नाम लिखें।'),
      applicantMobile: rules.mobile(d.applicantMobile),
      notes: /\b\d{12}\b/.test(d.notes.replace(/\s/g, '')) ? 'कृपया आधार नंबर न लिखें।' : '',
    }), async (d) => {
      const r = await api('/applications', { method: 'POST', body: { serviceId: service._id || service.slug, ...d } });
      toast(`आवेदन दर्ज हो गया। संदर्भ: ${r.data.reference}`);
      form.reset();
    });
  });
}
