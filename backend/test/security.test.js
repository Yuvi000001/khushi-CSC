const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

test('login issues a signed JWT with fixed algorithm, audience, issuer, and session version', async () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousFindOne = User.findOne;
  const previousCompare = bcrypt.compare;
  process.env.JWT_SECRET = SECRET;
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    mobile: '9876543210',
    role: 'user',
    passwordHash: 'stored-hash',
    sessionVersion: 4,
  };
  User.findOne = async () => user;
  bcrypt.compare = async () => true;
  try {
    const res = response();
    await authController.login({ body: { email: user.email, password: 'valid-password' } }, res, (error) => { throw error; });
    const payload = jwt.verify(res.token, SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    assert.equal(payload.sessionVersion, 4);
    assert.equal(res.cookieOptions.httpOnly, true);
  } finally {
    User.findOne = previousFindOne;
    bcrypt.compare = previousCompare;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
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
