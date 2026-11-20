import { CONFIG } from '../config.js';
import { register } from '../api.js';
import { logo } from '../icons/icons.js';
import { rules } from '../utils.js';
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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, (d) => ({
      name: d.name.trim().length < 2 ? 'पूरा नाम लिखें।' : '', email: rules.email(d.email), mobile: rules.mobile(d.mobile),
      password: rules.password(d.password), terms: d.terms ? '' : 'आगे बढ़ने के लिए सहमति ज़रूरी है।',
    }), async (d) => {
      await register({ name: d.name, email: d.email, mobile: d.mobile, password: d.password });
      toast('खाता बन गया। स्वागत है!');
      navigate('/profile');
    });
  });
}
