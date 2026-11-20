import { api } from '../api.js';
import { adminShell } from '../components/sidebar.js';
import { esc, fmtDate } from '../utils.js';

export const meta = { title: 'उपयोगकर्ता', desc: '' };

export async function render() {
  let inner;
  try {
    const { data } = await api('/admin/users');
    inner = `<div class="table-wrap"><table class="table"><thead><tr><th>नाम</th><th>ईमेल</th><th>मोबाइल</th><th>भूमिका</th><th>तारीख़</th></tr></thead><tbody>
      ${data.map((u) => `<tr><td data-l="नाम">${esc(u.name)}</td><td data-l="ईमेल">${esc(u.email)}</td><td data-l="मोबाइल">${esc(u.mobile)}</td><td data-l="भूमिका"><span class="badge badge-${u.role === 'admin' ? 'blue' : 'grey'}">${u.role === 'admin' ? 'प्रशासक' : 'उपयोगकर्ता'}</span></td><td data-l="तारीख़">${fmtDate(u.createdAt)}</td></tr>`).join('')}</tbody></table></div>`;
  } catch (e) { inner = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/users', 'उपयोगकर्ता', `<section class="panel">${inner}</section>`);
}
