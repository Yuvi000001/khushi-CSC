import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { rules } from '../utils.js';
import { field, submitForm } from '../components/form.js';
import { toast } from '../components/notifications.js';

export const meta = { title: 'संपर्क करें', desc: 'खुशी ऑनलाइन सेंटर से संपर्क करें - मोबाइल 7470630571, khushionlinecentre11@gmail.com, राम द्वारा, विदिशा।' };

export function render() {
  const rows = [
    ['id', 'CSC ID', CONFIG.CSC_ID], ['user', 'संचालक', CONFIG.OWNER], ['phone', 'मोबाइल', CONFIG.MOBILE],
    ['mail', 'ईमेल', `<a href="mailto:${CONFIG.EMAIL}">${CONFIG.EMAIL}</a>`], ['map', 'पता', CONFIG.ADDRESS],
    ...(CONFIG.TIMING ? [['clock', 'समय', CONFIG.TIMING]] : []),
  ];
  return `
  <section class="page-hero"><div class="container"><h1>संपर्क करें</h1><p>किसी भी जानकारी या सेवा की सहायता के लिए हमसे संपर्क करें।</p></div></section>
  <div class="container contact-grid">
    <section class="card contact-info" data-reveal>
      <h2>${CONFIG.NAME_EN}</h2>
      <ul class="rows">${rows.map(([ic, k, v]) => `<li>${icon(ic, ic === 'map' ? 15 : 18)}<span><small>${k}</small>${v}</span></li>`).join('')}</ul>
      <div class="cta-row"><a class="btn btn-primary" href="${CONFIG.CALL}">${icon('phone', 18)}कॉल करें</a><a class="btn btn-wa" href="${CONFIG.WHATSAPP}" target="_blank" rel="noopener">${icon('whatsapp', 18)}WhatsApp</a></div>
      <a class="map-box" href="${CONFIG.MAPS}" target="_blank" rel="noopener" aria-label="Google Maps पर देखें">
        <svg viewBox="0 0 400 150" aria-hidden="true"><rect width="400" height="150" fill="#EFE6D6"/><path d="M0 100l120-30 90 30 190-50" stroke="#fff" stroke-width="10" fill="none"/><path d="M150 0l40 150M280 0l-30 150" stroke="#fff" stroke-width="6"/><path d="M200 38c-14 0-24 10-24 23 0 17 24 40 24 40s24-23 24-40c0-13-10-23-24-23z" fill="#7A1F2B"/><circle cx="200" cy="61" r="8" fill="#FFFAF0"/></svg>
        <span>${icon('map', 13)}Google Maps पर देखें</span></a>
    </section>
    <section class="card" data-reveal>
      <h2>पूछताछ फॉर्म</h2>
      <form id="enquiry" novalidate>
        ${field({ name: 'name', label: 'नाम', ph: 'अपना नाम लिखें', ac: 'name' })}
        ${field({ name: 'mobile', label: 'मोबाइल नंबर', ph: '10 अंकों का नंबर', ac: 'tel', mode: 'numeric', max: 10 })}
        ${field({ name: 'email', label: 'ईमेल (वैकल्पिक)', type: 'email', ph: 'जवाब ईमेल पर चाहिए तो', ac: 'email', req: false })}
        <div class="field"><label for="f-subject">विषय <span class="req">*</span></label>
          <select id="f-subject" name="subject"><option value="">विषय चुनें</option><option>सरकारी योजना की जानकारी</option><option>प्रमाण पत्र / कार्ड</option><option>पैन कार्ड</option><option>ऑनलाइन फॉर्म</option><option>अन्य</option></select></div>
        <div class="field"><label for="f-message">संदेश <span class="req">*</span></label><textarea id="f-message" name="message" rows="4" maxlength="1500" placeholder="अपनी बात लिखें। Aadhaar नंबर या OTP न लिखें।"></textarea></div>
        <button class="btn btn-primary" type="submit">संदेश भेजें</button>
      </form>
    </section>
  </div>`;
}

export function mount(root) {
  const form = root.querySelector('#enquiry');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, (d) => ({
      name: rules.required(d.name, 'नाम लिखें।'), mobile: rules.mobile(d.mobile),
      email: d.email ? rules.email(d.email) : '', subject: rules.required(d.subject, 'विषय चुनें।'),
      message: d.message.trim().length < 5 ? 'संदेश कम से कम 5 अक्षर का लिखें।' : /\b\d{12}\b/.test(d.message.replace(/\s/g, '')) ? 'कृपया आधार नंबर न लिखें।' : '',
    }), async (d) => {
      const r = await api('/contact', { method: 'POST', body: d }); // सफलता तभी दिखती है जब सर्वर पुष्टि करे
      toast(r.message); form.reset();
    });
  });
}
