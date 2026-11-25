const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const emailjs = require('@emailjs/nodejs');
const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const authController = require('../controllers/authController');

const SECRET = 'signup-test-secret-with-at-least-32-bytes';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
    cookie(name, value, options) { this.cookieName = name; this.token = value; this.cookieOptions = options; },
  };
}

test('signup creates an account only after email OTP verification', async () => {
  const envKeys = ['JWT_SECRET', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const previousFindOne = User.findOne;
  const previousCreate = User.create;
  const previousHash = bcrypt.hash;
  const previousChallengeUpsert = OtpChallenge.findOneAndUpdate;
  const previousChallengeFind = OtpChallenge.findOne;
  const previousChallengeDelete = OtpChallenge.findOneAndDelete;
  const previousSend = Object.getOwnPropertyDescriptor(emailjs, 'send');
  const emailCalls = [];
  let createdData;
  process.env.JWT_SECRET = SECRET;
  envKeys.slice(1).forEach((key, index) => { process.env[key] = `test-emailjs-${index}`; });
  User.findOne = async () => null;
  bcrypt.hash = async () => 'hashed-password';
  OtpChallenge.findOneAndUpdate = async () => ({ _id: 'signup-challenge', otpHash: 'stored-otp-hash' });
  User.create = async (data) => {
    createdData = data;
    return {
      ...data,
      _id: '507f1f77bcf86cd799439011',
      role: 'user',
      sessionVersion: 0,
    };
  };
  Object.defineProperty(emailjs, 'send', {
    configurable: true,
    value: async (...args) => { emailCalls.push(args); },
  });
  try {
    const registrationRes = response();
    await authController.register({
      body: { name: 'Test User', email: 'test@example.com', mobile: '9876543210', password: 'valid-password', role: 'admin' },
    }, registrationRes, (error) => { throw error; });
    assert.equal(registrationRes.statusCode, 202);
    assert.equal(createdData, undefined);
    const code = emailCalls[0][2].message_html.match(/letter-spacing:6px">(\d{6})</)[1];
    const challenge = {
      _id: 'signup-challenge',
      otpHash: crypto.createHmac('sha256', SECRET).update(`otp-v1\u0000signup\u0000test@example.com\u0000${code}`).digest('hex'),
      signupData: { toObject: () => ({ name: 'Test User', mobile: '9876543210', passwordHash: 'hashed-password' }) },
    };
    OtpChallenge.findOne = async () => challenge;
    OtpChallenge.findOneAndDelete = async () => challenge;

    const verifyRes = response();
    await authController.verifySignupOtp({ body: { email: 'test@example.com', otp: code } }, verifyRes, (error) => { throw error; });
    assert.deepEqual(createdData, {
      name: 'Test User',
      mobile: '9876543210',
      passwordHash: 'hashed-password',
      email: 'test@example.com',
      verified: true,
    });
    assert.equal(createdData.role, undefined);
    assert.equal(verifyRes.statusCode, 201);
    assert.equal(verifyRes.cookieOptions.httpOnly, true);
  } finally {
    User.findOne = previousFindOne;
    User.create = previousCreate;
    bcrypt.hash = previousHash;
    OtpChallenge.findOneAndUpdate = previousChallengeUpsert;
    OtpChallenge.findOne = previousChallengeFind;
    OtpChallenge.findOneAndDelete = previousChallengeDelete;
    Object.defineProperty(emailjs, 'send', previousSend);
    envKeys.forEach((key) => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
  }
});

test('signup rejects an email or mobile number already used by another account', async () => {
  const previousFindOne = User.findOne;
  User.findOne = async (query) => {
    assert.deepEqual(query, { $or: [{ email: 'new@example.com' }, { mobile: '9876543210' }] });
    return { _id: 'existing-user' };
  };
  try {
    const res = response();
    await authController.register({
      body: { name: 'New User', email: 'new@example.com', mobile: '9876543210', password: 'valid-password' },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 409);
    assert.match(res.data.message, /ईमेल या मोबाइल नंबर/);
  } finally {
    User.findOne = previousFindOne;
  }
});
