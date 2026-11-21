const router = require('express').Router();
const c = require('../controllers/schemeController');

router.get('/', c.list);
module.exports = router;
