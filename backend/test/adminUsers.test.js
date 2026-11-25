const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const OtpChallenge = require('../models/OtpChallenge');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE } = require('../config/jwt');

const USER_ID = '507f1f77bcf86cd799439011';
const ADMIN_ID = '507f1f77bcf86cd799439012';
const SECRET = 'admin-user-tests-secret-with-at-least-32-bytes';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

test('blocking a user changes status and increments session version', async () => {
  const previousFindById = User.findById;
  const previousFindOneAndUpdate = User.findOneAndUpdate;
  let update;
  User.findById = async () => ({ _id: USER_ID, role: 'user' });
  User.findOneAndUpdate = async (...args) => {
    update = args;
    return { blocked: true };
  };
  try {
    const res = response();
    await adminController.updateUserBlock({
      params: { id: USER_ID },
      body: { blocked: true },
      user: { _id: ADMIN_ID },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.equal(res.data.data.blocked, true);
    assert.equal(update[1].$inc.sessionVersion, 1);
    assert.equal(update[0].role, 'user');
  } finally {
    User.findById = previousFindById;
    User.findOneAndUpdate = previousFindOneAndUpdate;
  }
});

test('admin accounts cannot be blocked or deleted', async () => {
  const previousFindById = User.findById;
  const previousFindOneAndUpdate = User.findOneAndUpdate;
  const previousFindOneAndDelete = User.findOneAndDelete;
  User.findById = async () => ({ _id: ADMIN_ID, role: 'admin' });
  User.findOneAndUpdate = async () => { throw new Error('Admin status must not change'); };
  User.findOneAndDelete = async () => { throw new Error('Admin account must not be deleted'); };
  try {
    const req = { params: { id: ADMIN_ID }, body: { blocked: true }, user: { _id: '507f1f77bcf86cd799439013' } };
    const blockRes = response();
    await adminController.updateUserBlock(req, blockRes, (error) => { throw error; });
    assert.equal(blockRes.statusCode, 403);

    const deleteRes = response();
    await adminController.deleteUser(req, deleteRes, (error) => { throw error; });
    assert.equal(deleteRes.statusCode, 403);
  } finally {
    User.findById = previousFindById;
    User.findOneAndUpdate = previousFindOneAndUpdate;
    User.findOneAndDelete = previousFindOneAndDelete;
  }
});

test('deleting a user clears authentication challenges but preserves linked records', async () => {
  const previousFindById = User.findById;
  const previousFindOneAndDelete = User.findOneAndDelete;
  const previousPasswordDeleteMany = PasswordReset.deleteMany;
  const previousOtpDeleteMany = OtpChallenge.deleteMany;
  const calls = [];
  const user = { _id: USER_ID, role: 'user', email: 'user@example.com' };
  User.findById = async () => user;
  User.findOneAndDelete = async (filter) => {
    calls.push(['user', filter]);
    return user;
  };
  PasswordReset.deleteMany = async (filter) => calls.push(['password-reset', filter]);
  OtpChallenge.deleteMany = async (filter) => calls.push(['otp', filter]);
  try {
    const res = response();
    await adminController.deleteUser({
      params: { id: USER_ID },
      user: { _id: ADMIN_ID },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[0][1], { _id: USER_ID, role: 'user' });
    assert.deepEqual(calls[1][1], { userId: USER_ID });
    assert.deepEqual(calls[2][1], { email: user.email });
  } finally {
    User.findById = previousFindById;
    User.findOneAndDelete = previousFindOneAndDelete;
    PasswordReset.deleteMany = previousPasswordDeleteMany;
    OtpChallenge.deleteMany = previousOtpDeleteMany;
  }
});

test('blocked users cannot use existing sessions', async () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFindById = User.findById;
  process.env.JWT_SECRET = SECRET;
  User.findById = () => ({ select: async () => ({ _id: USER_ID, sessionVersion: 3, blocked: true }) });
  const token = jwt.sign(
    { id: USER_ID, csrf: 'test-csrf', sessionVersion: 3 },
    SECRET,
    { algorithm: JWT_ALGORITHM, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '1h' },
  );
  try {
    const res = response();
    let advanced = false;
    await auth({ cookies: { token }, method: 'GET' }, res, () => { advanced = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(advanced, false);
  } finally {
    User.findById = previousFindById;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('blocked users cannot start a login session', async () => {
  const previousFindOne = User.findOne;
  const previousCompare = bcrypt.compare;
  User.findOne = async () => ({ passwordHash: 'stored-hash', blocked: true });
  bcrypt.compare = async () => true;
  try {
    const res = response();
    await authController.login({
      body: { email: 'blocked@example.com', password: 'valid-password' },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 403);
    assert.match(res.data.message, /ब्लॉक/);
  } finally {
    User.findOne = previousFindOne;
    bcrypt.compare = previousCompare;
  }
});
