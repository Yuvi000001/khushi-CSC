const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const emailjs = require('@emailjs/nodejs');
const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const {
  JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE, getJwtSecret,
} = require('../config/jwt');
const { IMAGE_EXTENSIONS, IMAGE_MIME_TYPES } = require('../utils/imageTypes');

const SECRET = 'test-secret-with-more-than-32-random-looking-bytes';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
    cookie(name, value, options) { this.cookieName = name; this.token = value; this.cookieOptions = options; },
  };
}

test('JWT secret must be at least 32 bytes', () => {
  const previous = process.env.JWT_SECRET;
  try {
    process.env.JWT_SECRET = 'short';
    assert.throws(() => getJwtSecret(), /at least 32 bytes/);
    process.env.JWT_SECRET = SECRET;
    assert.equal(getJwtSecret(), SECRET);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});

test('login requires a one-time email code before issuing a session', async () => {
  const envKeys = ['JWT_SECRET', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const previousFindOne = User.findOne;
  const previousFindById = User.findById;
  const previousChallengeUpsert = OtpChallenge.findOneAndUpdate;
  const previousChallengeFind = OtpChallenge.findOne;
  const previousChallengeDelete = OtpChallenge.findOneAndDelete;
  const previousChallengeUpdate = OtpChallenge.updateOne;
  const previousCompare = bcrypt.compare;
  const previousSend = Object.getOwnPropertyDescriptor(emailjs, 'send');
  const emailCalls = [];
  process.env.JWT_SECRET = SECRET;
  envKeys.slice(1).forEach((key, index) => { process.env[key] = `test-emailjs-${index}`; });
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    mobile: '9876543210',
    role: 'user',
    passwordHash: 'stored-hash',
    sessionVersion: 4,
    verified: true,
  };
  User.findOne = async () => user;
  OtpChallenge.findOneAndUpdate = async () => ({ _id: 'otp-challenge', otpHash: 'stored-otp-hash' });
  bcrypt.compare = async () => true;
  Object.defineProperty(emailjs, 'send', {
    configurable: true,
    value: async (...args) => { emailCalls.push(args); },
  });
  try {
    const loginRes = response();
    await authController.login({ body: { email: user.email, password: 'valid-password' } }, loginRes, (error) => { throw error; });
    assert.equal(loginRes.statusCode, 202);
    assert.equal(loginRes.data.data.requiresOtp, true);
    assert.equal(loginRes.token, undefined);
    const code = emailCalls[0][2].message_html.match(/letter-spacing:6px">(\d{6})</)[1];
    const challenge = {
      _id: 'otp-challenge',
      otpHash: crypto.createHmac('sha256', SECRET).update(`otp-v1\u0000login\u0000${user.email}\u0000${code}`).digest('hex'),
      userId: user._id,
      sessionVersion: user.sessionVersion,
    };
    OtpChallenge.findOne = async () => challenge;
    OtpChallenge.findOneAndDelete = async () => challenge;
    let attemptsUpdated = false;
    OtpChallenge.updateOne = async () => { attemptsUpdated = true; };
    User.findById = async () => user;

    const invalidRes = response();
    const wrongCode = code === '100000' ? '100001' : '100000';
    await authController.verifyLoginOtp({ body: { email: user.email, otp: wrongCode } }, invalidRes, (error) => { throw error; });
    assert.equal(invalidRes.statusCode, 400);
    assert.equal(invalidRes.token, undefined);
    assert.equal(attemptsUpdated, true);

    const res = response();
    await authController.verifyLoginOtp({ body: { email: user.email, otp: code } }, res, (error) => { throw error; });
    const payload = jwt.verify(res.token, SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    assert.equal(payload.sessionVersion, 4);
    assert.equal(res.cookieOptions.httpOnly, true);
  } finally {
    User.findOne = previousFindOne;
    User.findById = previousFindById;
    OtpChallenge.findOneAndUpdate = previousChallengeUpsert;
    OtpChallenge.findOne = previousChallengeFind;
    OtpChallenge.findOneAndDelete = previousChallengeDelete;
    OtpChallenge.updateOne = previousChallengeUpdate;
    bcrypt.compare = previousCompare;
    Object.defineProperty(emailjs, 'send', previousSend);
    envKeys.forEach((key) => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
  }
});

test('authentication rejects legacy and stale-version tokens', async () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFindById = User.findById;
  process.env.JWT_SECRET = SECRET;
  User.findById = () => ({ select: async () => ({ _id: '507f1f77bcf86cd799439011', sessionVersion: 4 }) });
  const issue = (claims) => jwt.sign(
    { id: '507f1f77bcf86cd799439011', csrf: 'test-csrf', ...claims },
    SECRET,
    { algorithm: JWT_ALGORITHM, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '1h' },
  );
  const callAuth = async (token) => {
    const res = response();
    let advanced = false;
    await auth({ cookies: { token }, method: 'GET' }, res, () => { advanced = true; });
    return { res, advanced };
  };
  try {
    const current = await callAuth(issue({ sessionVersion: 4 }));
    assert.equal(current.advanced, true);
    const stale = await callAuth(issue({ sessionVersion: 3 }));
    assert.equal(stale.res.statusCode, 401);
    const legacy = await callAuth(jwt.sign({ id: '507f1f77bcf86cd799439011' }, SECRET, { expiresIn: '1h' }));
    assert.equal(legacy.res.statusCode, 401);
  } finally {
    User.findById = previousFindById;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('only JPEG, PNG, and WebP image extensions are accepted', () => {
  assert.equal(IMAGE_EXTENSIONS['.jpg'], 'image/jpeg');
  assert.equal(IMAGE_EXTENSIONS['.png'], 'image/png');
  assert.equal(IMAGE_EXTENSIONS['.webp'], 'image/webp');
  assert.equal(IMAGE_EXTENSIONS['.svg'], undefined);
  assert.equal(IMAGE_MIME_TYPES.has('image/svg+xml'), false);
});
