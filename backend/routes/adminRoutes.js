const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/adminController');
const schemes = require('../controllers/schemeController');
const ads = require('../controllers/adController');
const downloadForms = require('../controllers/downloadFormController');
const payments = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validateRequest');
router.use(auth, adminOnly);

const exampleImages = () => body('documentExamples').optional().isArray({ max: 8 }).bail().custom((examples) => (
  examples.every((example) => example
    && typeof example.name === 'string'
    && example.name.trim().length >= 2
    && example.name.trim().length <= 80
    && typeof example.imageFileId === 'string'
    && /^[a-f\d]{24}$/i.test(example.imageFileId))
)).withMessage('हर उदाहरण के लिए नाम और अपलोड की गई फोटो चुनें।');
const svc = (optional) => {
  const o = (v) => (optional ? v.optional() : v);
  return [
    o(body('name').trim().isLength({ min: 2, max: 100 })).withMessage('सेवा का नाम लिखें।'),
    body('nameEn').optional().trim().isLength({ max: 100 }),
    o(body('category').isIn(['govt', 'identity', 'digital'])).withMessage('श्रेणी चुनें।'),
    body('description').optional().trim().isLength({ max: 400 }),
    body('price').optional({ nullable: true }).isFloat({ min: 0, max: 1000000 }).withMessage('राशि 0 से 10,00,000 रुपये के बीच रखें।').bail().custom((value) => /^\d+(?:\.\d{1,2})?$/.test(String(value))).withMessage('राशि में अधिकतम 2 दशमलव अंक रखें।'),
    body('icon').optional().isString().isLength({ max: 30 }),
    body('features').optional().isArray({ max: 12 }),
    body('documents').optional().isArray({ max: 12 }),
    exampleImages(),
    body('active').optional().isBoolean(),
    body('displayOrder').optional().isInt({ min: 0, max: 9999 }),
  ];
};
const schemeFields = (optional) => {
  const field = (name) => {
    const validator = body(name);
    return optional ? validator.optional() : validator;
  };
  return [
    field('name').trim().isLength({ min: 2, max: 100 }).withMessage('योजना का नाम लिखें।'),
    field('nameEn').trim().isLength({ min: 2, max: 100 }).withMessage('योजना का English नाम लिखें।'),
    body('slug').optional().trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).isLength({ max: 80 }),
    body('description').optional().trim().isLength({ max: 600 }),
    body('descriptionEn').optional().trim().isLength({ max: 600 }),
    body('category').optional().trim().isLength({ max: 80 }),
    body('categoryEn').optional().trim().isLength({ max: 80 }),
    body('price').optional({ nullable: true }).isFloat({ min: 0, max: 1000000 }).withMessage('राशि 0 से 10,00,000 रुपये के बीच रखें।').bail().custom((value) => /^\d+(?:\.\d{1,2})?$/.test(String(value))).withMessage('राशि में अधिकतम 2 दशमलव अंक रखें।'),
    body('icon').optional().trim().isLength({ max: 30 }),
    body('imageUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).isLength({ max: 2048 }),
    body('imageFileId').optional({ nullable: true }).isMongoId(),
    exampleImages(),
    body('active').optional().isBoolean(),
    body('displayOrder').optional().isInt({ min: 0, max: 9999 }),
  ];
};

router.get('/dashboard', c.dashboard);
router.get('/applications', c.applications);
router.get('/payments', payments.adminList);
router.patch('/payments/:id/status', [body('status').isIn(['verified', 'rejected']).withMessage('भुगतान की स्थिति चुनें।')], validate, payments.updateStatus);
router.patch('/applications/:id/status', [body('status').isIn(['pending', 'progress', 'done', 'cancelled']).withMessage('अमान्य स्थिति।'), body('note').optional().trim().isLength({ max: 300 })], validate, c.updateApplicationStatus);
router.delete('/applications/:id', c.deleteApplication);
router.get('/services', c.allServices);
router.post('/services', svc(false), validate, c.createService);
router.patch('/services/:id', svc(true), validate, c.updateService);
router.delete('/services/:id', c.deleteService);
router.get('/schemes', schemes.adminList);
router.get('/ads', ads.adminList);
router.patch('/ads/settings', [body('intervalSeconds').isInt({ min: 1, max: 10 }).withMessage('स्लाइड का समय 1 से 10 सेकंड के बीच चुनें।')], validate, ads.updateSettings);
router.post('/schemes', schemeFields(false), validate, schemes.create);
router.patch('/schemes/:slug', schemeFields(true), validate, schemes.update);
router.delete('/schemes/:slug', schemes.remove);
router.get('/download-forms', downloadForms.adminList);
router.post('/download-forms', [
  body('title').trim().isLength({ min: 2, max: 120 }).withMessage('फॉर्म का नाम लिखें।'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('price').isFloat({ min: 0, max: 1000000 }).bail()
    .custom((value) => /^\d+(?:\.\d{1,2})?$/.test(String(value)))
    .withMessage('राशि 0 से 10,00,000 रुपये के बीच और अधिकतम 2 दशमलव अंकों में रखें।'),
  body('fileId').isMongoId().withMessage('दस्तावेज़ अपलोड करें।'),
], validate, downloadForms.create);
router.delete('/download-forms/:id', downloadForms.remove);
router.get('/enquiries', c.enquiries);
router.patch('/enquiries/:id/status', [body('status').isIn(['new', 'read', 'replied']).withMessage('अमान्य स्थिति।')], validate, c.updateEnquiryStatus);
router.get('/users', c.users);
router.patch('/users/:id/status', [body('blocked').isBoolean().withMessage('खाते की स्थिति चुनें।')], validate, c.updateUserBlock);
router.delete('/users/:id', c.deleteUser);
router.get('/files', c.files);
module.exports = router;
