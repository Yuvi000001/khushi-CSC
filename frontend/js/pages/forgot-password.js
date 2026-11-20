import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { logo } from '../icons/icons.js';
import { rules } from '../utils.js';
import { field, pwField, bindPw, submitForm } from '../components/form.js';
import { toast } from '../components/notifications.js';
import { navigate } from '../router.js';

export const meta = { title: 'पासवर्ड भूल गए?', desc: 'पासवर्ड रीसेट करें।' };

export function render({ path, query }) {
  const head = `<div class="auth-head">${logo(112)}<strong>${CONFIG.NAME_EN}</strong><small>CSC ID : ${CONFIG.CSC_ID}</small></div>`;
  if (path === '/reset-password') {
    return `<section class="auth"><div class="auth-card">${head}<h1>नया पासवर्ड बनाएं</h1><p class="muted">नया पासवर्ड लिखें। लिंक सिर्फ एक बार चलता है।</p>
      <form id="reset-form" novalidate>${pwField({ ph: 'कम से कम 8 अक्षर, एक अक्षर और एक अंक', ac: 'new-password', label: 'नया पासवर्ड' })}
      <button class="btn btn-primary btn-block" type="submit">पासवर्ड बदलें</button></form>
      <p class="alt"><a href="/login" data-link>वापस लॉगिन पर जाएं</a></p></div></section>`;
  }
  return `<section class="auth"><div class="auth-card">${head}<h1>पासवर्ड भूल गए?</h1>
    <p class="muted">अपना पंजीकृत ईमेल लिखें। हम पासवर्ड बदलने का लिंक भेजेंगे।</p>
    <form id="forgot-form" novalidate>${field({ name: 'email', label: 'ईमेल पता', type: 'email', ph: 'अपना ईमेल लिखें', ac: 'email' })}
    <button class="btn btn-primary btn-block" type="submit">रीसेट लिंक भेजें</button></form>
    <p class="info-text">लिंक 30 मिनट तक चलेगा। कृपया यह लिंक या कोई OTP किसी के साथ साझा न करें।</p>
    <p class="alt"><a href="/login" data-link>वापस लॉगिन पर जाएं</a></p></div></section>`;
}

export function mount(root, { path, query }) {
  bindPw(root);
  const forgot = root.querySelector('#forgot-form');
  if (forgot) forgot.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(forgot, (d) => ({ email: rules.email(d.email) }), async (d) => {
      const r = await api('/auth/forgot-password', { method: 'POST', body: { email: d.email } });
      toast(r.message); forgot.reset();
    });
  });
  const reset = root.querySelector('#reset-form');
  if (reset) reset.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(reset, (d) => ({ password: rules.password(d.password) }), async (d) => {
      const r = await api('/auth/reset-password', { method: 'POST', body: { token: query.token || '', password: d.password } });
      toast(r.message); navigate('/login');
    });
  });
}
