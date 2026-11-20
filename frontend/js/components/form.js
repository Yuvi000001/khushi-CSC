import { esc } from '../utils.js';
import { icon } from '../icons/icons.js';

export const field = ({ name, label, type = 'text', ph = '', ac = 'off', req = true, mode = '', max = '' }) =>
  `<div class="field"><label for="f-${name}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
  <input id="f-${name}" name="${name}" type="${type}" placeholder="${esc(ph)}" autocomplete="${ac}"${mode ? ` inputmode="${mode}"` : ''}${max ? ` maxlength="${max}"` : ''}></div>`;

export const pwField = ({ name = 'password', label = 'पासवर्ड', ph = 'अपना पासवर्ड लिखें', ac = 'current-password' } = {}) =>
  `<div class="field"><label for="f-${name}">${label} <span class="req" aria-hidden="true">*</span></label>
  <div class="pw"><input id="f-${name}" name="${name}" type="password" placeholder="${esc(ph)}" autocomplete="${ac}">
  <button type="button" class="pw-toggle" data-pw aria-label="पासवर्ड दिखाएं / छुपाएं">${icon('eye', 18)}</button></div></div>`;

export function bindPw(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pw]'); if (!b) return;
    const i = b.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password';
  });
}

// Form submit ka common pattern: validate -> button band -> API -> errors
export async function submitForm(form, validate, action) {
  const btn = form.querySelector('[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());
  const errs = validate(data);
  const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
  const { fieldErrors } = await import('../utils.js');
  if (!fieldErrors(form, clean)) return;
  const label = btn.textContent; btn.disabled = true; btn.textContent = 'कृपया प्रतीक्षा करें...';
  try { await action(data); }
  catch (err) {
    const { toast } = await import('./notifications.js');
    toast(err.message, 'error');
    if (err.errors) fieldErrors(form, Object.fromEntries(err.errors.map((x) => [x.field, x.message])));
  } finally { btn.disabled = false; btn.textContent = label; }
}
