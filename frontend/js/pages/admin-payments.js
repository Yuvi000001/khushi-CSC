import { api } from '../api.js';
import { adminShell } from '../components/sidebar.js';
import { confirmBox, toast } from '../components/notifications.js';
import { esc, badge, fmtDate } from '../utils.js';

export const meta = { title: 'भुगतान', desc: '' };

const FILTERS = [['', 'सभी'], ['pending', 'लंबित'], ['verified', 'जाँचे गए'], ['rejected', 'अस्वीकृत']];
let state = { page: 1, status: '' };
let requestId = 0;

export function render({ query }) {
  const page = Number.parseInt(query.page, 10);
  const status = FILTERS.some(([value]) => value && value === query.status) ? query.status : '';
  state = {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    status,
  };
  return adminShell('/admin/payments', 'भुगतान प्रबंधन', `
    <div class="toolbar">
      <div class="chips" id="payment-filters">${FILTERS.map(([status, title]) => `<button type="button" class="chip${state.status === status ? ' active' : ''}" data-status="${status}" aria-pressed="${state.status === status}">${title}</button>`).join('')}</div>
      <button type="button" class="btn btn-ghost btn-sm" id="refresh-payments">रीफ़्रेश करें</button>
    </div>
    <section class="panel"><p class="muted small">यह ग्राहक द्वारा भेजी गई भुगतान रिपोर्ट है, बैंक से स्वतः सत्यापित नहीं। पुष्टि करने से पहले UPI खाते में transaction reference जाँचें।</p>
      <div id="payments-table" aria-live="polite"><p class="empty">लोड हो रहा है...</p></div>
    </section>`);
}

async function load(root) {
  const box = root.querySelector('#payments-table');
  const currentRequest = ++requestId;
  const query = new URLSearchParams({ page: state.page, ...(state.status && { status: state.status }) });
  box.innerHTML = '<p class="empty">लोड हो रहा है...</p>';
  try {
    const { data } = await api(`/admin/payments?${query}`);
    if (currentRequest !== requestId) return;
    const rows = data.items.map((payment) => `<tr data-payment-id="${payment._id}">
      <td data-l="ग्राहक">${esc(payment.customerName)}<small>${esc(payment.mobile)}</small></td>
      <td data-l="सेवा / योजना">${payment.itemType === 'scheme' ? 'योजना' : 'सेवा'}: ${esc(payment.itemName)}</td>
      <td data-l="राशि">₹${esc(Number(payment.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 }))}</td>
      <td data-l="UPI संदर्भ">${esc(payment.transactionId)}</td>
      <td data-l="स्थिति">${badge(payment.status)}</td>
      <td data-l="तारीख़">${fmtDate(payment.createdAt)}</td>
      <td class="actions">${payment.status === 'pending' ? '<button class="btn btn-primary btn-sm" data-payment-status="verified">जाँचकर सही</button><button class="btn btn-ghost btn-sm" data-payment-status="rejected">अस्वीकृत</button>' : ''}</td>
    </tr>`).join('');
    box.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>ग्राहक</th><th>सेवा / योजना</th><th>राशि</th><th>UPI संदर्भ</th><th>स्थिति</th><th>तारीख़</th><th>कार्रवाई</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="empty">कोई भुगतान रिपोर्ट नहीं मिली।</td></tr>'}</tbody></table></div>
      <div class="pager"><span>कुल भुगतान: ${data.total}</span><div><button class="btn btn-ghost btn-sm" data-page="-1" ${data.page <= 1 ? 'disabled' : ''}>पिछला</button><span>${data.page} / ${data.pages}</span><button class="btn btn-ghost btn-sm" data-page="1" ${data.page >= data.pages ? 'disabled' : ''}>अगला</button></div></div>`;
  } catch (error) {
    if (currentRequest === requestId) box.innerHTML = `<p class="empty">${esc(error.message)}</p>`;
  }
}

export function mount(root) {
  load(root);
  root.querySelector('#payment-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    state.status = button.dataset.status;
    state.page = 1;
    root.querySelectorAll('#payment-filters .chip').forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    load(root);
  });
  root.querySelector('#refresh-payments').addEventListener('click', () => load(root));
  root.addEventListener('click', async (event) => {
    const pageButton = event.target.closest('[data-page]');
    if (pageButton && !pageButton.disabled) {
      state.page += Number(pageButton.dataset.page);
      load(root);
      return;
    }

    const statusButton = event.target.closest('[data-payment-status]');
    if (!statusButton) return;
    const row = statusButton.closest('[data-payment-id]');
    const status = statusButton.dataset.paymentStatus;
    const prompt = status === 'verified'
      ? 'UPI खाते में इस transaction reference की रकम मिलान करके पुष्टि की है?'
      : 'इस भुगतान रिपोर्ट को अस्वीकृत करें?';
    if (!await confirmBox(prompt, status === 'verified' ? 'जाँचकर सही' : 'अस्वीकृत करें')) return;
    statusButton.disabled = true;
    try {
      const result = await api(`/admin/payments/${row.dataset.paymentId}/status`, { method: 'PATCH', body: { status } });
      toast(result.message);
      load(root);
    } catch (error) {
      statusButton.disabled = false;
      toast(error.message, 'error');
    }
  });
}
