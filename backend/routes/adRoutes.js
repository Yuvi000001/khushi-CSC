const router = require('express').Router();
const c = require('../controllers/adController');

router.get('/', c.list);
module.exports = router;
