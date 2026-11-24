const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {
  verifyCheckoutSignature,
  verifyWebhookSignature,
} = require('../utils/razorpay');
const app = require('../app');

const SECRET = 'test-razorpay-webhook-secret';

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

test('checkout signatures are bound to their order and payment IDs', () => {
  const signature = sign('order_123|pay_456');
  assert.equal(verifyCheckoutSignature('order_123', 'pay_456', signature, SECRET), true);
  assert.equal(verifyCheckoutSignature('order_other', 'pay_456', signature, SECRET), false);
  assert.equal(verifyCheckoutSignature('order_123', 'pay_other', signature, SECRET), false);
  assert.equal(verifyCheckoutSignature('order_123', 'pay_456', 'not-a-signature', SECRET), false);
});

test('webhook signatures verify the exact raw request body', () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const signature = sign(body);
  assert.equal(verifyWebhookSignature(body, signature, SECRET), true);
  assert.equal(verifyWebhookSignature(Buffer.from(`${body} `), signature, SECRET), false);
  assert.equal(verifyWebhookSignature(body, signature, ''), false);
});

test('Razorpay webhook and custom order routes enforce signatures and amount limits', async () => {
  const envKeys = ['RAZORPAY_WEBHOOK_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/webhooks/razorpay`;
    const body = JSON.stringify({ event: 'payment.authorized' });
    const signed = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sign(body) },
      body,
    });
    assert.equal(signed.status, 200, await signed.text());

    const invalid = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': '0'.repeat(64) },
      body,
    });
    assert.equal(invalid.status, 400);

    const invalidAmount = await fetch(`${url.replace('/webhooks/razorpay', '/payments/razorpay/orders')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: 'custom',
        itemSlug: 'custom-payment',
        amount: 0.5,
        customerName: 'Test Customer',
        mobile: '9876543210',
      }),
    });
    assert.equal(invalidAmount.status, 422);

  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    envKeys.forEach((key) => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
  }
});
