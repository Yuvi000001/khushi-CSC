const test = require('node:test');
const assert = require('node:assert/strict');
const emailjs = require('@emailjs/nodejs');
const { sendMail } = require('../config/mailer');

const EMAILJS_ENV = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY'];

test('EmailJS sends mail using the configured service, template, and public key only', async () => {
  const previousEnv = Object.fromEntries(EMAILJS_ENV.map((key) => [key, process.env[key]]));
  const previousPrivateKey = process.env.EMAILJS_PRIVATE_KEY;
  const previousSend = Object.getOwnPropertyDescriptor(emailjs, 'send');
  const calls = [];
  EMAILJS_ENV.forEach((key, index) => { process.env[key] = `test-${index}`; });
  delete process.env.EMAILJS_PRIVATE_KEY;
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
      { publicKey: 'test-2' },
    ]]);
  } finally {
    EMAILJS_ENV.forEach((key) => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
    if (previousPrivateKey === undefined) delete process.env.EMAILJS_PRIVATE_KEY;
    else process.env.EMAILJS_PRIVATE_KEY = previousPrivateKey;
    Object.defineProperty(emailjs, 'send', previousSend);
  }
});

test('EmailJS provider errors include response details in logs', async () => {
  const previousEnv = Object.fromEntries(EMAILJS_ENV.map((key) => [key, process.env[key]]));
  const previousSend = Object.getOwnPropertyDescriptor(emailjs, 'send');
  const previousError = console.error;
  const errors = [];
  EMAILJS_ENV.forEach((key, index) => { process.env[key] = `test-${index}`; });
  Object.defineProperty(emailjs, 'send', {
    configurable: true,
    value: async () => {
      const error = new Error('Request failed');
      error.status = 404;
      error.text = 'No records found';
      throw error;
    },
  });
  console.error = (...args) => { errors.push(args); };
  try {
    assert.equal(await sendMail({ to: 'user@example.com', subject: 'Test subject', html: '<p>Hello</p>' }), false);
    assert.deepEqual(errors, [['[mail] send failed:', 404, 'No records found']]);
  } finally {
    EMAILJS_ENV.forEach((key) => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
    console.error = previousError;
    Object.defineProperty(emailjs, 'send', previousSend);
  }
});
