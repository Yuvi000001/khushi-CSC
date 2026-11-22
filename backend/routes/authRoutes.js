const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const c = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validateRequest');
const { createRateLimitStore } = require('../config/rateLimitStore');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  store: createRateLimitStore('auth'),
  message: { success: false, message: 'बहुत ज़्यादा कोशिशें हुईं। थोड़ी देर बाद फिर करें।' },
});
const email = body('email').isEmail().withMessage('सही ईमेल पता लिखें।').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false });
const password = body('password').isString().isLength({ min: 8, max: 72 }).withMessage('पासवर्ड कम से कम 8 अक्षर का हो।')
  .matches(/[A-Za-z]/).withMessage('पासवर्ड में कम से कम एक अक्षर हो।').matches(/\d/).withMessage('पासवर्ड में कम से कम एक अंक हो।');
const mobile = body('mobile').matches(/^[6-9]\d{9}$/).withMessage('10 अंकों का सही मोबाइल नंबर लिखें।');

router.post('/register', limiter, [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('पूरा नाम लिखें।'), email, mobile, password,
], validate, c.register);
router.post('/login', limiter, [email, body('password').isString().notEmpty().withMessage('पासवर्ड लिखें।')], validate, c.login);
router.post('/logout', auth, c.logout);
router.post('/forgot-password', limiter, [email], validate, c.forgotPassword);
router.post('/reset-password', limiter, [body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('लिंक अमान्य है।'), password], validate, c.resetPassword);
router.get('/me', auth, c.me);
module.exports = router;
