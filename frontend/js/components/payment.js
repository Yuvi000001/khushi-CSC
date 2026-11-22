import { CONFIG } from '../config.js';
import { openDialog, toast } from './notifications.js';
import { esc } from '../utils.js';
import { api } from '../api.js';

let qrCodePromise = null;

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
    <button class="btn btn-primary btn-sm" type="button" data-payment data-payment-price="${amount.toFixed(2)}" data-payment-title="${esc(item.name)}" data-payment-type="${itemType}" data-payment-slug="${esc(item.slug)}">UPI से भुगतान करें</button>
  </div>`;
}

function loadQrCode() {
  if (window.QRCode) return Promise.resolve(window.QRCode);
  if (qrCodePromise) return qrCodePromise;
  qrCodePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    script.onload = () => {
      if (window.QRCode) resolve(window.QRCode);
      else {
        qrCodePromise = null;
        reject(new Error('QR बनाने की लाइब्रेरी उपलब्ध नहीं है।'));
      }
    };
    script.onerror = () => {
      script.remove();
      qrCodePromise = null;
      reject(new Error('QR लाइब्रेरी लोड नहीं हुई। इंटरनेट कनेक्शन जाँचें।'));
    };
    document.head.appendChild(script);
  });
  return qrCodePromise;
}

async function showPayment(item) {
  const amount = Number(item.price);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    toast('इस सेवा के लिए भुगतान राशि उपलब्ध नहीं है।', 'error');
    return;
  }
  if (!/^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(CONFIG.UPI_ID)) {
    toast('भुगतान के लिए UPI ID सही तरह सेट नहीं है।', 'error');
    return;
  }

  const title = String(item.name || 'Khushi Online Centre').slice(0, 100);
  const uri = `upi://pay?${new URLSearchParams({
    pa: CONFIG.UPI_ID,
    pn: CONFIG.NAME_EN,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `${title} - Khushi Online Centre`,
  }).toString()}`;
  const dialog = openDialog(`
    <div class="payment-dialog">
      <p class="payment-total">भुगतान राशि <strong>${formatRupees(amount)}</strong></p>
      <div class="payment-qr" data-payment-qr role="img" aria-label="भुगतान के लिए UPI QR कोड">QR तैयार हो रहा है...</div>
      <p class="muted small">QR को UPI ऐप से स्कैन करें। भुगतान की पुष्टि करने से पहले ऐप में प्राप्तकर्ता और राशि जाँच लें।</p>
      <p class="payment-vpa">UPI ID: <code>${esc(CONFIG.UPI_ID)}</code></p>
      <a class="btn btn-primary btn-block" href="${esc(uri)}">UPI ऐप खोलें</a>
      <p class="payment-note">भुगतान वेबसाइट पर अपने-आप सत्यापित नहीं होता। कृपया रसीद सुरक्षित रखें और केंद्र से पुष्टि करें।</p>
      <form class="payment-report-form" data-payment-report novalidate>
        <h3>भुगतान के बाद रिपोर्ट करें</h3>
        <p class="muted small">UPI ऐप में भुगतान पूरा होने के बाद अपना नाम, मोबाइल और transaction reference भरें। PIN या OTP कभी न लिखें।</p>
        <div class="field"><label for="payment-name">आपका नाम</label><input id="payment-name" name="customerName" maxlength="100" autocomplete="name" required></div>
        <div class="field"><label for="payment-mobile">मोबाइल नंबर</label><input id="payment-mobile" name="mobile" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" required></div>
        <div class="field"><label for="payment-reference">UPI transaction reference / UTR</label><input id="payment-reference" name="transactionId" maxlength="50" autocomplete="off" required></div>
        <button class="btn btn-ghost btn-block" type="submit">भुगतान रिपोर्ट भेजें</button>
      </form>
    </div>`, { title: `भुगतान - ${title}` });
  const reportForm = dialog.querySelector('[data-payment-report]');
  reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(reportForm));
    const customerName = formData.customerName.trim();
    const mobile = formData.mobile.trim();
    const transactionId = formData.transactionId.trim();
    if (customerName.length < 2) return toast('अपना नाम लिखें।', 'error');
    if (!/^[6-9]\d{9}$/.test(mobile)) return toast('10 अंकों का सही मोबाइल नंबर लिखें।', 'error');
    if (!/^[A-Za-z0-9-]{6,50}$/.test(transactionId)) return toast('UPI transaction reference सही लिखें।', 'error');
    const submitButton = reportForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const result = await api('/payments', {
        method: 'POST',
        body: { itemType: item.itemType, itemSlug: item.slug, amount, customerName, mobile, transactionId },
      });
      toast(result.message);
      reportForm.innerHTML = `<p class="payment-report-success">रिपोर्ट मिल गई। संदर्भ: <strong>${esc(result.data.reference)}</strong><br>जाँच पूरी होने तक स्थिति लंबित रहेगी।</p>`;
    } catch (error) {
      toast(error.message, 'error');
      submitButton.disabled = false;
    }
  });
  const qrTarget = dialog.querySelector('[data-payment-qr]');
  try {
    const QRCode = await loadQrCode();
    if (!qrTarget.isConnected) return;
    qrTarget.textContent = '';
    new QRCode(qrTarget, {
      text: uri,
      width: 240,
      height: 240,
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (error) {
    if (qrTarget.isConnected) qrTarget.textContent = `${error.message} नीचे दिए गए बटन से UPI ऐप खोलें।`;
  }
}

export function bindPaymentActions(root) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-payment]');
    if (!button || !root.contains(button)) return;
    showPayment({
      price: button.dataset.paymentPrice,
      name: button.dataset.paymentTitle,
      itemType: button.dataset.paymentType,
      slug: button.dataset.paymentSlug,
    });
  });
}
