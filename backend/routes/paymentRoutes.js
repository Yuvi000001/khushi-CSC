const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const c = require('../controllers/paymentController');
const validate = require('../middleware/validateRequest');
const { createRateLimitStore } = require('../config/rateLimitStore');

const submitLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('payments'),
  message: { success: false, message: 'बहुत अधिक प्रयास हुए। कुछ देर बाद फिर कोशिश करें।' },
});

router.post('/', submitLimit, [
  body('itemType').isIn(['service', 'scheme']).withMessage('सेवा या योजना चुनें।'),
  body('itemSlug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).isLength({ max: 80 }).withMessage('सेवा या योजना नहीं मिली।'),
  body('amount').isFloat({ min: 0.01, max: 1000000 }).bail().custom((value) => /^\d+(?:\.\d{1,2})?$/.test(String(value))).withMessage('भुगतान राशि सही नहीं है।'),
  body('customerName').trim().isLength({ min: 2, max: 100 }).withMessage('अपना नाम लिखें।'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('10 अंकों का सही मोबाइल नंबर लिखें।'),
  body('transactionId').trim().matches(/^[A-Za-z0-9-]{6,50}$/).withMessage('UPI transaction reference सही लिखें।'),
], validate, c.submit);

router.post('/razorpay/orders', submitLimit, [
  body('itemType').isIn(['service', 'scheme', 'form', 'custom']).withMessage('सेवा, योजना या फॉर्म चुनें।'),
  body('itemSlug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).isLength({ max: 80 }).withMessage('सेवा या योजना नहीं मिली।'),
  body('amount').if(body('itemType').equals('custom'))
    .isFloat({ min: 1, max: 1000000 }).bail()
    .custom((value) => /^\d+(?:\.\d{1,2})?$/.test(String(value)))
    .withMessage('राशि ₹1 से ₹10,00,000 के बीच और अधिकतम 2 दशमलव अंकों में रखें।'),
], validate, c.createRazorpayOrder);

router.post('/razorpay/verify', submitLimit, [
  body('razorpay_order_id').matches(/^order_[A-Za-z0-9]+$/).withMessage('भुगतान ऑर्डर सही नहीं है।'),
  body('razorpay_payment_id').matches(/^pay_[A-Za-z0-9]+$/).withMessage('भुगतान पहचान सही नहीं है।'),
  body('razorpay_signature').matches(/^[a-f\d]{64}$/i).withMessage('भुगतान हस्ताक्षर सही नहीं है।'),
], validate, c.verifyRazorpayPayment);

module.exports = router;
