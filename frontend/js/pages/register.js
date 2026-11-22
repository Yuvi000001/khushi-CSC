import { CONFIG } from '../config.js';
import { register, verifySignupOtp } from '../api.js';
import { logo } from '../icons/icons.js';
import { esc, rules } from '../utils.js';
import { field, pwField, bindPw, submitForm } from '../components/form.js';
import { toast } from '../components/notifications.js';
import { navigate } from '../router.js';

export const meta = { title: 'रजिस्टर करें', desc: 'खुशी ऑनलाइन सेंटर पर नया खाता बनाएं।' };

export function render() {
  return `
  <section class="auth"><div class="auth-card">
    <div class="auth-head">${logo(112)}<strong>${CONFIG.NAME_EN}</strong><small>CSC ID : ${CONFIG.CSC_ID}</small></div>
    <h1>रजिस्टर करें</h1><p class="muted">अपनी जानकारी भरकर नया खाता बनाएं।</p>
    <form id="reg-form" novalidate>
      ${field({ name: 'name', label: 'पूरा नाम', ph: 'अपना पूरा नाम लिखें', ac: 'name' })}
      ${field({ name: 'email', label: 'ईमेल पता', type: 'email', ph: 'अपना ईमेल लिखें', ac: 'email' })}
      ${field({ name: 'mobile', label: 'मोबाइल नंबर', ph: '10 अंकों का नंबर', ac: 'tel', mode: 'numeric', max: 10 })}
      ${pwField({ ph: 'कम से कम 8 अक्षर, एक अक्षर और एक अंक', ac: 'new-password' })}
      <div class="field check"><label><input type="checkbox" name="terms" value="1"> <span>मैं नियम एवं शर्तों से सहमत हूँ। मैं समझता/समझती हूँ कि यह सरकारी वेबसाइट नहीं है।</span></label></div>
      <button class="btn btn-primary btn-block" type="submit">रजिस्टर करें</button>
    </form>
    <p class="alt">पहले से खाता है? <a href="/login" data-link>लॉगिन करें</a></p>
  </div></section>`;
}

export function mount(root) {
  bindPw(root);
  const form = root.querySelector('#reg-form');
  const registrationForm = form.innerHTML;
  let pendingEmail = '';
  const showOtp = (email) => {
    form.innerHTML = `${field({ name: 'otp', label: 'ईमेल पर आया OTP', ph: '6 अंकों का कोड', mode: 'numeric', max: 6, ac: 'one-time-code' })}
      <p class="muted small">${esc(email)} पर भेजा गया कोड दर्ज करें। OTP सही होने के बाद ही खाता बनेगा।</p>
      <p class="muted small">कोड नहीं आया? वापस जाकर एक मिनट बाद फिर कोशिश करें।</p>
      <button class="btn btn-primary btn-block" type="submit">OTP सत्यापित करके खाता बनाएं</button>
      <button class="btn btn-ghost btn-block" type="button" data-otp-back>वापस</button>`;
    form.querySelector('[name="otp"]').focus();
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (pendingEmail) {
      submitForm(form, (d) => ({ otp: /^\d{6}$/.test(d.otp) ? '' : '6 अंकों का सही OTP लिखें।' }), async (d) => {
        const user = await verifySignupOtp(pendingEmail, d.otp);
        toast('OTP सत्यापित। आपका खाता बन गया।');
        navigate(user.role === 'admin' ? '/admin' : '/profile');
      });
      return;
    }
    submitForm(form, (d) => ({
      name: d.name.trim().length < 2 ? 'पूरा नाम लिखें।' : '', email: rules.email(d.email), mobile: rules.mobile(d.mobile),
      password: rules.password(d.password), terms: d.terms ? '' : 'आगे बढ़ने के लिए सहमति ज़रूरी है।',
    }), async (d) => {
      const result = await register({ name: d.name, email: d.email, mobile: d.mobile, password: d.password });
      pendingEmail = result.data.email;
      showOtp(pendingEmail);
      toast(result.message);
    });
  });
  form.addEventListener('click', (e) => {
    if (!e.target.closest('[data-otp-back]')) return;
    pendingEmail = '';
    form.innerHTML = registrationForm;
  });
}
