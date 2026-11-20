import { esc } from '../utils.js';
import { icon } from '../icons/icons.js';

export function toast(message, type = 'success') {
  const box = document.getElementById('toasts'); if (!box) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `${icon(type === 'error' ? 'info' : 'check', 18)}<span>${esc(message)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 4200);
}

export function openDialog(html, { title = '', wide = false } = {}) {
  const d = document.createElement('dialog');
  d.className = `dialog${wide ? ' wide' : ''}`;
  d.innerHTML = `<div class="dialog-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="बंद करें">${icon('close', 18)}</button></div><div class="dialog-body">${html}</div>`;
  document.body.appendChild(d);
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  d.addEventListener('close', () => d.remove());
  d.showModal();
  return d;
}

export function confirmBox(message, okLabel = 'हाँ, हटाएं') {
  return new Promise((resolve) => {
    const d = openDialog(`<p>${esc(message)}</p><div class="dialog-actions"><button class="btn btn-ghost" data-close>रद्द करें</button><button class="btn btn-danger" data-ok>${esc(okLabel)}</button></div>`, { title: 'पुष्टि करें' });
    let ok = false;
    d.querySelector('[data-ok]').addEventListener('click', () => { ok = true; d.close(); });
    d.addEventListener('close', () => resolve(ok));
  });
}
