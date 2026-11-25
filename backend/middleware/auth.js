const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE, getJwtSecret } = require('../config/jwt');

const same = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = async function auth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: 'कृपया पहले लॉगिन करें।' });
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    // CSRF: cookie ke saath header me token bhi chahiye (sirf POST/PATCH/DELETE par)
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !same(req.get('x-csrf-token'), payload.csrf)) {
      return res.status(403).json({ success: false, message: 'सुरक्षा जाँच विफल। पेज रीफ़्रेश करके दोबारा कोशिश करें।' });
    }
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user || user.blocked || payload.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ success: false, message: 'सत्र समाप्त हो गया। फिर से लॉगिन करें।' });
    }
    req.user = user;
    req.csrf = payload.csrf;
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'सत्र समाप्त हो गया। फिर से लॉगिन करें।' });
  }
};
