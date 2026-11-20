export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const STATUS = {
  pending: ['प्रतीक्षारत', 'amber'], progress: ['प्रक्रिया में', 'blue'], done: ['पूर्ण', 'green'], cancelled: ['रद्द', 'red'],
  new: ['नया', 'amber'], read: ['पढ़ा', 'grey'], replied: ['जवाब दिया', 'green'],
};
export const badge = (s) => { const [t, c] = STATUS[s] || [s, 'grey']; return `<span class="badge badge-${c}">${esc(t)}</span>`; };
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export function setMeta(title, desc) {
  document.title = title ? `${title} | खुशी ऑनलाइन सेंटर` : 'खुशी ऑनलाइन सेंटर | CSC एवं MP Online सेवाएं, विदिशा';
  if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
}
export function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
export function fieldErrors(form, errors) {
  $$('.field-error', form).forEach((e) => e.remove());
  Object.entries(errors).forEach(([name, msg]) => {
    const input = form.elements[name]; if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const p = document.createElement('p'); p.className = 'field-error'; p.textContent = msg;
    (input.closest('.field') || input.parentElement).appendChild(p);
  });
  $$('[aria-invalid]', form).forEach((i) => { if (!errors[i.name]) i.removeAttribute('aria-invalid'); });
  const first = Object.keys(errors)[0]; if (first) form.elements[first]?.focus();
  return Object.keys(errors).length === 0;
}
export const rules = {
  mobile: (v) => (/^[6-9]\d{9}$/.test(v) ? '' : '10 अंकों का सही मोबाइल नंबर लिखें।'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'सही ईमेल पता लिखें।'),
  password: (v) => (v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : 'कम से कम 8 अक्षर, एक अक्षर और एक अंक हो।'),
  required: (v, m = 'यह जानकारी ज़रूरी है।') => (v.trim() ? '' : m),
};
