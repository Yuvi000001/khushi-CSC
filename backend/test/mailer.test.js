const test = require('node:test');
const assert = require('node:assert/strict');
const emailjs = require('@emailjs/nodejs');
const { sendMail } = require('../config/mailer');

const EMAILJS_ENV = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];

test('EmailJS sends mail using the configured service, template, and template parameters', async () => {
  const previousEnv = Object.fromEntries(EMAILJS_ENV.map((key) => [key, process.env[key]]));
  const previousSend = Object.getOwnPropertyDescriptor(emailjs, 'send');
  const calls = [];
  EMAILJS_ENV.forEach((key, index) => { process.env[key] = `test-${index}`; });
  Object.defineProperty(emailjs, 'send', {
    configurable: true,
    value: async (...args) => { calls.push(args); },
  });
  try {
    assert.equal(await sendMail({ to: 'user@example.com', subject: 'Test subject', html: '<p>Hello</p>' }), true);
    assert.deepEqual(calls, [[
      'test-0',
      'test-1',
      { to_email: 'user@example.com', subject: 'Test subject', message_html: '<p>Hello</p>' },
      { publicKey: 'test-2', privateKey: 'test-3' },
    ]]);
  } finally {
    EMAILJS_ENV.forEach((key) => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
    Object.defineProperty(emailjs, 'send', previousSend);
  }
});
