const router = require('express').Router();
const c = require('../controllers/serviceController');
router.get('/', c.list);
router.get('/:id', c.get);
module.exports = router;
