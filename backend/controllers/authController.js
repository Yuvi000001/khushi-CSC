const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendMail } = require('../config/mailer');
const tpl = require('../utils/emailTemplates');

const DUMMY_HASH = bcrypt.hashSync('khushi-dummy-password', 12); // timing barabar rakhne ke liye
const prod = process.env.NODE_ENV === 'production';
const cross = process.env.COOKIE_CROSS_SITE === 'true';
const cookieOpts = {
  httpOnly: true,
  secure: prod || cross,
  sameSite: cross ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, mobile: u.mobile, role: u.role });

function issue(res, user) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign({ id: user._id, csrf }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookieOpts);
  return csrf;
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'इस ईमेल से खाता पहले से बना है। कृपया लॉगिन करें।' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, mobile, passwordHash });
    const csrfToken = issue(res, user);
    const m = tpl.welcome(user.name);
    sendMail({ to: user.email, ...m });
    res.status(201).json({ success: true, message: 'खाता बन गया।', data: { user: publicUser(user), csrfToken } });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // user न मिलने पर भी hash compare, ताकि समय से अंदाज़ा न लगे
    const hash = user ? user.passwordHash : DUMMY_HASH;
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) return res.status(401).json({ success: false, message: 'ईमेल या पासवर्ड गलत है।' });
    const csrfToken = issue(res, user);
    res.json({ success: true, data: { user: publicUser(user), csrfToken } });
  } catch (e) { next(e); }
};

exports.logout = (req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: undefined });
  res.json({ success: true, message: 'लॉगआउट हो गया।' });
};

exports.me = (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user), csrfToken: req.csrf } });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const raw = crypto.randomBytes(32).toString('hex');
      await PasswordReset.deleteMany({ userId: user._id });
      await PasswordReset.create({
        userId: user._id,
        tokenHash: crypto.createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      const base = (process.env.CLIENT_URL || '').split(',')[0].replace(/\/$/, '');
      sendMail({ to: user.email, ...tpl.passwordReset(user.name, `${base}/reset-password?token=${raw}`) });
    }
    // हमेशा एक जैसा जवाब — ईमेल मौजूद है या नहीं, पता न चले
    res.json({ success: true, message: 'अगर यह ईमेल पंजीकृत है तो रीसेट लिंक भेज दिया गया है।' });
  } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const rec = await PasswordReset.findOne({ tokenHash, used: false, expiresAt: { $gt: new Date() } });
    if (!rec) return res.status(400).json({ success: false, message: 'लिंक अमान्य है या समाप्त हो चुका है।' });
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await User.updateOne({ _id: rec.userId }, { passwordHash });
    await PasswordReset.deleteMany({ userId: rec.userId }); // उपयोग के बाद हटाएं
    res.json({ success: true, message: 'पासवर्ड बदल गया। अब लॉगिन करें।' });
  } catch (e) { next(e); }
};
