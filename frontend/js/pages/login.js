import { CONFIG } from '../config.js';
import { login, verifyLoginOtp } from '../api.js';
import { logo } from '../icons/icons.js';
import { esc, rules } from '../utils.js';
import { field, pwField, bindPw, submitForm } from '../components/form.js';
import { toast } from '../components/notifications.js';
import { navigate, safeNext } from '../router.js';

export const meta = { title: 'लॉगिन करें', desc: 'खुशी ऑनलाइन सेंटर में लॉगिन करें।' };

export function render() {
  return `
  <section class="auth"><div class="auth-card">
    <div class="auth-head">${logo(112)}<strong>${CONFIG.NAME_EN}</strong><small>CSC ID : ${CONFIG.CSC_ID}</small></div>
    <h1>लॉगिन करें</h1><p class="muted">अपने खाते में प्रवेश करें।</p>
    <div class="tabs" role="tablist"><button type="button" role="tab" class="tab active" data-tab="user" aria-selected="true">User Login</button><button type="button" role="tab" class="tab" data-tab="admin" aria-selected="false">Admin Login</button></div>
    <form id="login-form" novalidate>
      ${field({ name: 'email', label: 'ईमेल पता', type: 'email', ph: 'अपना ईमेल लिखें', ac: 'username' })}
      ${pwField()}
      <p class="row-links"><a href="/forgot-password" data-link>पासवर्ड भूल गए?</a></p>
      <button class="btn btn-primary btn-block" type="submit">लॉगिन करें</button>
    </form>
    <p class="alt">खाता नहीं है? <a href="/register" data-link>रजिस्टर करें</a></p>
  </div></section>`;
}

export function mount(root, { query }) {
  bindPw(root);
  let tab = 'user';
  root.querySelector('.tabs').addEventListener('click', (e) => {
    const t = e.target.closest('.tab'); if (!t) return;
    tab = t.dataset.tab;
    root.querySelectorAll('.tab').forEach((x) => { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', String(x === t)); });
  });
  const form = root.querySelector('#login-form');
  const credentialsForm = form.innerHTML;
  let pendingEmail = '';
  const showOtp = (email) => {
    form.innerHTML = `${field({ name: 'otp', label: 'ईमेल पर आया OTP', ph: '6 अंकों का कोड', mode: 'numeric', max: 6, ac: 'one-time-code' })}
      <p class="muted small">${esc(email)} पर भेजा गया कोड दर्ज करें। यह 10 मिनट तक मान्य है।</p>
      <p class="muted small">कोड नहीं आया? वापस जाकर एक मिनट बाद फिर कोशिश करें।</p>
      <button class="btn btn-primary btn-block" type="submit">OTP सत्यापित करें</button>
      <button class="btn btn-ghost btn-block" type="button" data-otp-back>वापस</button>`;
    form.querySelector('[name="otp"]').focus();
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (pendingEmail) {
      submitForm(form, (d) => ({ otp: /^\d{6}$/.test(d.otp) ? '' : '6 अंकों का सही OTP लिखें।' }), async (d) => {
        const u = await verifyLoginOtp(pendingEmail, d.otp);
        if (tab === 'admin' && u.role !== 'admin') toast('यह खाता प्रशासक का नहीं है। आप सामान्य उपयोगकर्ता के रूप में लॉगिन हुए।', 'error');
        else toast('OTP सही है। लॉगिन सफल रहा।');
        navigate(u.role === 'admin' ? '/admin' : safeNext(query.next) || '/profile');
      });
      return;
    }
    submitForm(form, (d) => ({ email: rules.email(d.email), password: rules.required(d.password, 'पासवर्ड लिखें।') }), async (d) => {
      const result = await login(d.email, d.password);
      pendingEmail = result.data.email;
      showOtp(pendingEmail);
      toast(result.message);
    });
  });
  form.addEventListener('click', (e) => {
    if (!e.target.closest('[data-otp-back]')) return;
    pendingEmail = '';
    form.innerHTML = credentialsForm;
  });
}
