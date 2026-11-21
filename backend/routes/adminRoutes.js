const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/adminController');
const schemes = require('../controllers/schemeController');
const downloadForms = require('../controllers/downloadFormController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validateRequest');
router.use(auth, adminOnly);

const svc = (optional) => {
  const o = (v) => (optional ? v.optional() : v);
  return [
    o(body('name').trim().isLength({ min: 2, max: 100 })).withMessage('सेवा का नाम लिखें।'),
    body('nameEn').optional().trim().isLength({ max: 100 }),
    o(body('category').isIn(['govt', 'identity', 'digital'])).withMessage('श्रेणी चुनें।'),
    body('description').optional().trim().isLength({ max: 400 }),
    body('icon').optional().isString().isLength({ max: 30 }),
    body('features').optional().isArray({ max: 12 }),
    body('documents').optional().isArray({ max: 12 }),
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
    body('icon').optional().trim().isLength({ max: 30 }),
    body('imageUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).isLength({ max: 2048 }),
    body('imageFileId').optional({ nullable: true }).isMongoId(),
    body('active').optional().isBoolean(),
    body('displayOrder').optional().isInt({ min: 0, max: 9999 }),
  ];
};

router.get('/dashboard', c.dashboard);
router.get('/applications', c.applications);
router.patch('/applications/:id/status', [body('status').isIn(['pending', 'progress', 'done', 'cancelled']).withMessage('अमान्य स्थिति।'), body('note').optional().trim().isLength({ max: 300 })], validate, c.updateApplicationStatus);
router.delete('/applications/:id', c.deleteApplication);
router.get('/services', c.allServices);
router.post('/services', svc(false), validate, c.createService);
router.patch('/services/:id', svc(true), validate, c.updateService);
router.delete('/services/:id', c.deleteService);
router.get('/schemes', schemes.adminList);
router.post('/schemes', schemeFields(false), validate, schemes.create);
router.patch('/schemes/:slug', schemeFields(true), validate, schemes.update);
router.delete('/schemes/:slug', schemes.remove);
router.get('/download-forms', downloadForms.adminList);
router.post('/download-forms', [
  body('title').trim().isLength({ min: 2, max: 120 }).withMessage('फॉर्म का नाम लिखें।'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('fileId').isMongoId().withMessage('दस्तावेज़ अपलोड करें।'),
], validate, downloadForms.create);
router.delete('/download-forms/:id', downloadForms.remove);
router.get('/enquiries', c.enquiries);
router.patch('/enquiries/:id/status', [body('status').isIn(['new', 'read', 'replied']).withMessage('अमान्य स्थिति।')], validate, c.updateEnquiryStatus);
router.get('/users', c.users);
router.get('/files', c.files);
module.exports = router;
