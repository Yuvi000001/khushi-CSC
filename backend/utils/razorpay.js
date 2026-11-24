const crypto = require('crypto');

const apiBaseUrl = 'https://api.razorpay.com/v1';

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay credentials are not configured.');
    error.status = 503;
    throw error;
  }
  return { keyId, keySecret };
}

async function request(method, path, body) {
  const { keyId, keySecret } = getCredentials();
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    const error = new Error('Razorpay से संपर्क नहीं हो पाया।');
    error.status = 502;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error('Razorpay से अमान्य जवाब मिला।');
    error.status = 502;
    throw error;
  }
  if (!response.ok) {
    const error = new Error('Razorpay अनुरोध पूरा नहीं कर पाया।');
    error.status = 502;
    throw error;
  }
  return data;
}

function matchesSignature(data, signature, secret) {
  if (!Buffer.isBuffer(data) && typeof data !== 'string') return false;
  if (typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  if (!secret) return false;
  const actual = Buffer.from(signature, 'hex');
  const expected = crypto.createHmac('sha256', secret).update(data).digest();
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

exports.createOrder = (order) => request('POST', '/orders', order);
exports.fetchPayment = (paymentId) => request('GET', `/payments/${encodeURIComponent(paymentId)}`);
exports.getKeyId = () => getCredentials().keyId;
exports.verifyCheckoutSignature = (orderId, paymentId, signature, secret) => (
  matchesSignature(`${orderId}|${paymentId}`, signature, secret)
);
exports.verifyWebhookSignature = (rawBody, signature, secret) => (
  matchesSignature(rawBody, signature, secret)
);
