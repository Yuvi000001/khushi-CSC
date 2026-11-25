import { CONFIG } from '../config.js';
import { openDialog, toast } from './notifications.js';
import { esc } from '../utils.js';
import { api } from '../api.js';

let razorpayScriptPromise = null;
const paymentActionRoots = new WeakSet();

export function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function paymentAction(item, itemType) {
  const amount = Number(item.price);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return `<div class="payment-action">
    <strong>केंद्र शुल्क: ${formatRupees(amount)}</strong>
    <button class="btn btn-primary btn-sm" type="button" data-payment-razorpay data-payment-price="${amount.toFixed(2)}" data-payment-title="${esc(item.name)}" data-payment-type="${itemType}" data-payment-slug="${esc(item.slug)}">Razorpay से भुगतान करें</button>
  </div>`;
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else {
        razorpayScriptPromise = null;
        reject(new Error('Razorpay checkout उपलब्ध नहीं है।'));
      }
    };
    script.onerror = () => {
      script.remove();
      razorpayScriptPromise = null;
      reject(new Error('Razorpay checkout लोड नहीं हुआ। इंटरनेट कनेक्शन जाँचें।'));
    };
    document.head.appendChild(script);
  });
  return razorpayScriptPromise;
}

async function openRazorpayCheckout(item, amount, triggerButton, form) {
  triggerButton.disabled = true;
  let dialogClosed = false;
  let paymentVerified = false;
  try {
    const Razorpay = await loadRazorpay();
    const result = await api('/payments/razorpay/orders', {
      method: 'POST',
      body: {
        itemType: item.itemType,
        itemSlug: item.slug,
        ...(item.itemType === 'custom' ? { amount } : {}),
      },
    });
    const checkout = new Razorpay({
      key: result.data.keyId,
      amount: result.data.amount,
      currency: result.data.currency,
      name: CONFIG.NAME_EN,
      description: `${item.name} - Khushi Online Centre`.slice(0, 255),
      order_id: result.data.orderId,
      handler: async (payment) => {
        try {
          const verified = await api('/payments/razorpay/verify', { method: 'POST', body: payment });
          paymentVerified = true;
          toast(verified.message);
          triggerButton.disabled = false;
        } catch (error) {
          toast(error.message, 'error');
          triggerButton.disabled = false;
        }
      },
      modal: {
        ondismiss: () => {
          triggerButton.disabled = false;
          if (item.itemType === 'custom' && !paymentVerified) {
            showRazorpayPayment(item, triggerButton, amount);
          }
        },
      },
      theme: { color: '#7A1F2B' },
    });
    checkout.on('payment.failed', () => {
      toast('भुगतान पूरा नहीं हुआ। आप फिर से कोशिश कर सकते हैं।', 'error');
      triggerButton.disabled = false;
    });
    const dialog = form && form.closest('dialog');
    if (dialog && dialog.open) {
      dialog.close();
      dialogClosed = true;
    }
    checkout.open();
  } catch (error) {
    toast(error.message, 'error');
    triggerButton.disabled = false;
    if (dialogClosed && item.itemType === 'custom') {
      showRazorpayPayment(item, triggerButton, amount);
    }
  }
}

function showRazorpayPayment(item, triggerButton, initialAmount = '') {
  if (item.itemType !== 'custom') {
    openRazorpayCheckout(item, Number(item.price), triggerButton);
    return;
  }

  const title = String(item.name || 'Khushi Online Centre').slice(0, 100);
  const dialog = openDialog(`
    <form class="payment-dialog" data-razorpay-form novalidate>
      <div class="field"><label for="razorpay-amount">भुगतान राशि (₹)</label><input id="razorpay-amount" name="amount" type="number" inputmode="decimal" min="1" max="1000000" step="0.01" value="${initialAmount}" required></div>
      <p class="muted small">भुगतान Razorpay के सुरक्षित checkout से होगा। PIN या OTP वेबसाइट पर न लिखें।</p>
      <button class="btn btn-primary btn-block" type="submit">Razorpay से भुगतान करें</button>
    </form>`, { title: `भुगतान - ${title}` });
  const form = dialog.querySelector('[data-razorpay-form]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form));
    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000 || !/^\d+(?:\.\d{1,2})?$/.test(String(formData.amount || amount))) {
      return toast('राशि ₹1 से ₹10,00,000 के बीच और अधिकतम 2 दशमलव अंकों में रखें।', 'error');
    }
    const submitButton = form.querySelector('[type="submit"]');
    openRazorpayCheckout(item, amount, submitButton, form);
  });
}

export function bindPaymentActions(root) {
  if (paymentActionRoots.has(root)) return;
  paymentActionRoots.add(root);
  root.addEventListener('click', (event) => {
    const anyAmountButton = event.target.closest('[data-any-payment]');
    if (anyAmountButton && root.contains(anyAmountButton)) {
      showRazorpayPayment({
        itemType: 'custom',
        slug: 'custom-payment',
        name: 'सामान्य भुगतान',
      }, anyAmountButton);
      return;
    }
    const razorpayButton = event.target.closest('[data-payment-razorpay]');
    if (razorpayButton && root.contains(razorpayButton)) {
      showRazorpayPayment({
        price: razorpayButton.dataset.paymentPrice,
        name: razorpayButton.dataset.paymentTitle,
        itemType: razorpayButton.dataset.paymentType,
        slug: razorpayButton.dataset.paymentSlug,
      }, razorpayButton);
      return;
    }
  });
}
