const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const c = require('../controllers/contactController');
const validate = require('../middleware/validateRequest');
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'आप कई संदेश भेज चुके हैं। बाद में कोशिश करें।' } });
router.post('/', limiter, [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('नाम लिखें।'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('10 अंकों का सही मोबाइल नंबर लिखें।'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('सही ईमेल लिखें।').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('subject').optional().trim().isLength({ max: 120 }),
  body('message').trim().isLength({ min: 5, max: 1500 }).withMessage('संदेश कम से कम 5 अक्षर का लिखें।')
    .custom((v) => !/\b\d{12}\b/.test(v.replace(/\s/g, '')) || Promise.reject()).withMessage('कृपया संदेश में आधार नंबर न लिखें।'),
], validate, c.create);
module.exports = router;
