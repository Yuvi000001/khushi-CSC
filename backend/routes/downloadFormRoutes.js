const router = require('express').Router();
const controller = require('../controllers/downloadFormController');

router.get('/', controller.list);
router.get('/:id/download', controller.download);

module.exports = router;
