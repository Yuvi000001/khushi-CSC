import { api } from '../api.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, fmtDate } from '../utils.js';

export const meta = { title: 'उपयोगकर्ता', desc: '' };
let users = [];

function table() {
  return `<div class="table-wrap"><table class="table"><thead><tr><th>नाम</th><th>ईमेल</th><th>मोबाइल</th><th>भूमिका</th><th>खाता</th><th>तारीख़</th><th>कार्रवाई</th></tr></thead><tbody>
    ${users.map((u) => {
    const isAdmin = u.role === 'admin';
    const blocked = Boolean(u.blocked);
    return `<tr data-user-id="${esc(u._id)}">
      <td data-l="नाम">${esc(u.name)}</td>
      <td data-l="ईमेल">${esc(u.email)}</td>
      <td data-l="मोबाइल">${esc(u.mobile)}</td>
      <td data-l="भूमिका"><span class="badge badge-${isAdmin ? 'blue' : 'grey'}">${isAdmin ? 'प्रशासक' : 'उपयोगकर्ता'}</span></td>
      <td data-l="खाता"><span class="badge badge-${blocked ? 'red' : 'green'}">${blocked ? 'ब्लॉक' : 'चालू'}</span></td>
      <td data-l="तारीख़">${fmtDate(u.createdAt)}</td>
      <td data-l="कार्रवाई" class="actions">${isAdmin ? '—' : `<button type="button" class="btn btn-ghost btn-sm" data-user-action="toggle">${blocked ? 'अनब्लॉक' : 'ब्लॉक करें'}</button><button type="button" class="btn btn-danger btn-sm" data-user-action="delete">खाता हटाएं</button>`}</td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
}

export async function render() {
  let inner;
  try {
    users = (await api('/admin/users')).data;
    inner = `<div id="user-table">${table()}</div>`;
  } catch (e) { inner = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin/users', 'उपयोगकर्ता', `<section class="panel">${inner}</section>`);
}

async function reload(root) {
  users = (await api('/admin/users')).data;
  root.querySelector('#user-table').innerHTML = table();
}

export function mount(root) {
  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;
    const user = users.find((item) => item._id === button.closest('[data-user-id]')?.dataset.userId);
    if (!user || user.role === 'admin') return;

    const blocked = Boolean(user.blocked);
    const action = button.dataset.userAction;
    const message = action === 'delete'
      ? `खाता "${user.name}" हमेशा के लिए हटाएं? इससे केवल लॉगिन खाता हटेगा; आवेदन, अपलोड और भुगतान रिकॉर्ड सुरक्षित रहेंगे।`
      : `${user.name} का खाता ${blocked ? 'अनब्लॉक' : 'ब्लॉक'} करें?`;
    const confirmLabel = action === 'delete' ? 'हाँ, खाता हटाएं' : blocked ? 'हाँ, अनब्लॉक करें' : 'हाँ, ब्लॉक करें';
    if (!await confirmBox(message, confirmLabel)) return;

    try {
      const result = action === 'delete'
        ? await api(`/admin/users/${encodeURIComponent(user._id)}`, { method: 'DELETE' })
        : await api(`/admin/users/${encodeURIComponent(user._id)}/status`, { method: 'PATCH', body: { blocked: !blocked } });
      toast(result.message);
      await reload(root);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}
