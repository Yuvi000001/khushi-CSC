import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, badge, fmtDate } from '../utils.js';

export const meta = { title: 'डैशबोर्ड', desc: '' };

function chart(weekly) {
  const W = 600, H = 220, L = 34, B = 30, T = 14, R = 30;
  const max = Math.max(4, ...weekly.map((d) => d.count));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i) => L + (i * (W - L - R)) / (weekly.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const pts = weekly.map((d, i) => `${x(i).toFixed(1)},${y(d.count).toFixed(1)}`);
  const grid = [0, 1, 2, 3, 4].map((k) => `<line x1="${L}" x2="${W - R}" y1="${y(k * step)}" y2="${y(k * step)}" stroke="#E6D9C6" stroke-dasharray="3 4"/><text x="${L - 8}" y="${y(k * step) + 4}" text-anchor="end" font-size="11" fill="#6B5B55">${k * step}</text>`).join('');
  const labels = weekly.map((d, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6B5B55">${new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</text>`).join('');
  const dots = weekly.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.count)}" r="4" fill="#fff" stroke="#7A1F2B" stroke-width="2"><title>${d.date}: ${d.count}</title></circle>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="पिछले 7 दिनों के आवेदन">${grid}${labels}
    <polyline points="${x(0)},${y(0)} ${pts.join(' ')} ${x(weekly.length - 1)},${y(0)}" fill="#7A1F2B" opacity=".08" stroke="none"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#7A1F2B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
}

async function body() {
  const { data } = await api('/admin/dashboard');
  const s = data.stats;
  const boxes = [['कुल आवेदन', s.total, 'clipboard'], ['उपयोगकर्ता', s.users, 'users'], ['पूछताछ', s.enquiries, 'inbox'], ['लंबित भुगतान', s.pendingPayments || 0, 'rupee'], ['पूर्ण', s.done, 'check']];
  const rows = data.recent.map((a) => `<tr><td data-l="संदर्भ">${esc(a.reference)}</td><td data-l="नाम">${esc(a.applicantName)}</td><td data-l="सेवा">${esc(a.serviceId ? a.serviceId.name : '-')}</td><td data-l="स्थिति">${badge(a.status)}</td><td data-l="तारीख़">${fmtDate(a.createdAt)}</td>
    <td><a class="icon-btn round" href="/admin/applications?q=${encodeURIComponent(a.reference)}" data-link aria-label="आवेदन खोलें">${icon('edit', 16)}</a></td></tr>`).join('');
  const payments = (data.recentPayments || []).map((p) => `<tr data-payment-id="${p._id}">
    <td data-l="नाम">${esc(p.customerName)}<small>${esc(p.mobile)}</small></td>
    <td data-l="सेवा">${p.itemType === 'scheme' ? 'योजना' : 'सेवा'}: ${esc(p.itemName)}</td>
    <td data-l="राशि">₹${esc(p.amount)}</td>
    <td data-l="UPI संदर्भ">${esc(p.transactionId)}</td>
    <td data-l="स्थिति">${badge(p.status)}</td>
    <td data-l="तारीख़">${fmtDate(p.createdAt)}</td>
    <td class="actions">${p.status === 'pending' ? `<button class="btn btn-primary btn-sm" data-payment-status="verified">जाँचकर सही</button><button class="btn btn-ghost btn-sm" data-payment-status="rejected">अस्वीकृत</button>` : ''}</td>
  </tr>`).join('');
  return `
  <div class="stat-boxes">${boxes.map(([k, v, ic]) => `<div class="stat-box"><span>${icon(ic, 20)}</span><div><strong>${v}</strong><small>${k}</small></div></div>`).join('')}</div>
  <section class="panel"><h2>आवेदन (पिछले 7 दिन)</h2>${chart(data.weekly)}</section>
  <section class="panel"><div class="panel-head"><h2>हाल के आवेदन</h2><button class="icon-btn round" id="refresh" aria-label="रीफ़्रेश करें">${icon('refresh', 16)}</button></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>संदर्भ</th><th>नाम</th><th>सेवा</th><th>स्थिति</th><th>तारीख़</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="empty">अभी कोई आवेदन नहीं है।</td></tr>'}</tbody></table></div></section>
  <section class="panel"><div class="panel-head"><h2>UPI भुगतान रिपोर्ट (हाल की 10)</h2><button class="icon-btn round" id="refresh-payments" aria-label="रीफ़्रेश करें">${icon('refresh', 16)}</button></div>
    <p class="muted small">ग्राहक द्वारा भेजी गई रिपोर्ट है, बैंक से स्वतः सत्यापित नहीं। UPI खाते में reference जाँचकर ही स्थिति बदलें।</p>
    <div class="table-wrap"><table class="table"><thead><tr><th>ग्राहक</th><th>सेवा / योजना</th><th>राशि</th><th>UPI संदर्भ</th><th>स्थिति</th><th>तारीख़</th><th>कार्रवाई</th></tr></thead>
    <tbody>${payments || '<tr><td colspan="7" class="empty">अभी कोई भुगतान रिपोर्ट नहीं है।</td></tr>'}</tbody></table></div></section>`;
}

export async function render() {
  let inner;
  try { inner = await body(); } catch (e) { inner = `<p class="empty">${esc(e.message)}</p>`; }
  return adminShell('/admin', 'डैशबोर्ड', `<div id="dash">${inner}</div>`);
}

export function mount(root) {
  root.addEventListener('click', async (e) => {
    const box = root.querySelector('#dash');
    if (e.target.closest('#refresh, #refresh-payments')) {
      try { box.innerHTML = await body(); } catch (err) { box.innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
      return;
    }
    const button = e.target.closest('[data-payment-status]');
    if (!button) return;
    const row = button.closest('[data-payment-id]');
    const status = button.dataset.paymentStatus;
    const prompt = status === 'verified'
      ? 'UPI खाते में इस transaction reference की रकम मिलान करके पुष्टि की है?'
      : 'इस भुगतान रिपोर्ट को अस्वीकृत करें?';
    if (!await confirmBox(prompt, status === 'verified' ? 'जाँचकर सही' : 'अस्वीकृत करें')) return;
    button.disabled = true;
    try {
      const result = await api(`/admin/payments/${row.dataset.paymentId}/status`, { method: 'PATCH', body: { status } });
      toast(result.message);
      box.innerHTML = await body();
    } catch (error) {
      button.disabled = false;
      toast(error.message, 'error');
    }
  });
}
