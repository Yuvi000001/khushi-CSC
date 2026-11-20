import { CONFIG } from './config.js';

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors; }
}
export const session = { user: null, csrf: null };
try { session.csrf = sessionStorage.getItem('ko_csrf'); } catch { /* private mode */ }

export function setSession(user, csrf) {
  session.user = user; session.csrf = csrf || null;
  try { csrf ? sessionStorage.setItem('ko_csrf', csrf) : sessionStorage.removeItem('ko_csrf'); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent('session-change'));
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && session.csrf) headers['X-CSRF-Token'] = session.csrf;
  let res;
  try {
    res = await fetch(`${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api${path}`, {
      method, headers, credentials: 'include', body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('सर्वर से संपर्क नहीं हो पाया। इंटरनेट जाँचें या बाद में कोशिश करें।', 0);
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  if (!res.ok || !data || !data.success) throw new ApiError((data && data.message) || 'कुछ गलत हो गया। फिर कोशिश करें।', res.status, data && data.errors);
  return data;
}

export async function loadSession() {
  try { const r = await api('/auth/me'); setSession(r.data.user, r.data.csrfToken); }
  catch { setSession(null, null); }
}
export async function login(email, password) { const r = await api('/auth/login', { method: 'POST', body: { email, password } }); setSession(r.data.user, r.data.csrfToken); return r.data.user; }
export async function register(body) { const r = await api('/auth/register', { method: 'POST', body }); setSession(r.data.user, r.data.csrfToken); return r.data.user; }
export async function logout() { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setSession(null, null); }
