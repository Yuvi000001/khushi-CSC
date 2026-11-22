const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const OtpChallenge = require('../models/OtpChallenge');
const { sendMail } = require('../config/mailer');
const { JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE, getJwtSecret } = require('../config/jwt');
const tpl = require('../utils/emailTemplates');

const DUMMY_HASH = bcrypt.hashSync('khushi-dummy-password', 12); // timing barabar rakhne ke liye
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
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
  const token = jwt.sign({ id: user._id, csrf, sessionVersion: user.sessionVersion }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '7d',
  });
  res.cookie('token', token, cookieOpts);
  return csrf;
}

function hashOtp(email, purpose, code) {
  return crypto.createHmac('sha256', getJwtSecret())
    .update(`otp-v1\u0000${purpose}\u0000${email}\u0000${code}`)
    .digest('hex');
}

async function startOtp({ email, purpose, userId, sessionVersion, signupData }) {
  const now = new Date();
  const code = crypto.randomInt(100000, 1000000).toString();
  let challenge;
  try {
    challenge = await OtpChallenge.findOneAndUpdate({
      email,
      purpose,
      $or: [
        { lastSentAt: { $lte: new Date(now.getTime() - OTP_COOLDOWN_MS) } },
        { lastSentAt: { $exists: false } },
      ],
    }, {
      $set: {
        otpHash: hashOtp(email, purpose, code),
        attempts: 0,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        lastSentAt: now,
        userId,
        sessionVersion,
        signupData,
      },
      $setOnInsert: { email, purpose },
    }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code === 11000) return { ok: false, reason: 'cooldown' };
    throw error;
  }

  const sent = await sendMail({ to: email, ...tpl.authOtp(purpose, code) });
  if (!sent) {
    await OtpChallenge.deleteOne({ _id: challenge._id, otpHash: challenge.otpHash });
    return { ok: false, reason: 'delivery' };
  }
  return { ok: true };
}

async function consumeOtp(email, purpose, code) {
  const now = new Date();
  const challenge = await OtpChallenge.findOne({
    email, purpose, expiresAt: { $gt: now }, attempts: { $lt: OTP_MAX_ATTEMPTS },
  });
  if (!challenge) return null;

  const expected = Buffer.from(challenge.otpHash, 'hex');
  const received = Buffer.from(hashOtp(email, purpose, code), 'hex');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    await OtpChallenge.updateOne({
      _id: challenge._id, otpHash: challenge.otpHash, expiresAt: { $gt: now }, attempts: { $lt: OTP_MAX_ATTEMPTS },
    }, { $inc: { attempts: 1 } });
    return null;
  }

  return OtpChallenge.findOneAndDelete({
    _id: challenge._id,
    otpHash: challenge.otpHash,
    expiresAt: { $gt: now },
    attempts: { $lt: OTP_MAX_ATTEMPTS },
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'इस ईमेल से खाता पहले से बना है। कृपया लॉगिन करें।' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await startOtp({
      email,
      purpose: 'signup',
      signupData: { name, mobile, passwordHash },
    });
    if (!result.ok) {
      const status = result.reason === 'cooldown' ? 429 : 503;
      const message = result.reason === 'cooldown'
        ? 'OTP अभी भेजा गया है। नया OTP पाने के लिए एक मिनट बाद कोशिश करें।'
        : 'OTP ईमेल नहीं भेजा जा सका। कृपया बाद में फिर कोशिश करें।';
      return res.status(status).json({ success: false, message });
    }
    res.status(202).json({
      success: true,
      message: 'ईमेल पर OTP भेजा गया है। सत्यापन के बाद ही खाता बनेगा।',
      data: { requiresOtp: true, email },
    });
  } catch (e) { next(e); }
};

exports.verifySignupOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const challenge = await consumeOtp(email, 'signup', otp);
    if (!challenge || !challenge.signupData) {
      return res.status(400).json({ success: false, message: 'OTP गलत है या समाप्त हो गया है।' });
    }
    let user;
    try {
      user = await User.create({ ...challenge.signupData.toObject(), email, verified: true });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: 'इस ईमेल से खाता पहले से बना है। कृपया लॉगिन करें।' });
      }
      throw error;
    }
    const csrfToken = issue(res, user);
    const m = tpl.welcome(user.name);
    sendMail({ to: user.email, ...m });
    res.status(201).json({ success: true, message: 'OTP सही है। आपका खाता बन गया।', data: { user: publicUser(user), csrfToken } });
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
    const result = await startOtp({
      email,
      purpose: 'login',
      userId: user._id,
      sessionVersion: user.sessionVersion,
    });
    if (!result.ok) {
      const status = result.reason === 'cooldown' ? 429 : 503;
      const message = result.reason === 'cooldown'
        ? 'OTP अभी भेजा गया है। नया OTP पाने के लिए एक मिनट बाद कोशिश करें।'
        : 'OTP ईमेल नहीं भेजा जा सका। कृपया बाद में फिर कोशिश करें।';
      return res.status(status).json({ success: false, message });
    }
    res.status(202).json({
      success: true,
      message: 'ईमेल पर OTP भेजा गया है। लॉगिन जारी रखने के लिए OTP सत्यापित करें।',
      data: { requiresOtp: true, email },
    });
  } catch (e) { next(e); }
};

exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const challenge = await consumeOtp(email, 'login', otp);
    if (!challenge || !challenge.userId) {
      return res.status(400).json({ success: false, message: 'OTP गलत है या समाप्त हो गया है।' });
    }
    const user = await User.findById(challenge.userId);
    if (!user || user.sessionVersion !== challenge.sessionVersion) {
      return res.status(400).json({ success: false, message: 'OTP गलत है या समाप्त हो गया है।' });
    }
    if (!user.verified) {
      user.verified = true;
      await user.save();
    }
    const csrfToken = issue(res, user);
    res.json({ success: true, message: 'OTP सही है। लॉगिन सफल रहा।', data: { user: publicUser(user), csrfToken } });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });
    res.clearCookie('token', { ...cookieOpts, maxAge: undefined });
    res.json({ success: true, message: 'लॉगआउट हो गया।' });
  } catch (e) { next(e); }
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
    await User.updateOne({ _id: rec.userId }, { $set: { passwordHash }, $inc: { sessionVersion: 1 } });
    await PasswordReset.deleteMany({ userId: rec.userId }); // उपयोग के बाद हटाएं
    res.json({ success: true, message: 'पासवर्ड बदल गया। अब लॉगिन करें।' });
  } catch (e) { next(e); }
};
