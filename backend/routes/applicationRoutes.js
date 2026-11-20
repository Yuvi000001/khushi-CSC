const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validateRequest');
router.use(auth);
router.post('/', [
  body('serviceId').isString().notEmpty().withMessage('सेवा चुनें।'),
  body('applicantName').trim().isLength({ min: 2, max: 80 }).withMessage('आवेदक का नाम लिखें।'),
  body('applicantMobile').matches(/^[6-9]\d{9}$/).withMessage('10 अंकों का सही मोबाइल नंबर लिखें।'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('टिप्पणी बहुत लंबी है।'),
], validate, c.create);
router.get('/my', c.my);
router.get('/:id', c.get);
module.exports = router;
