const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getCurrent, getHistory } = require('../controllers/renewableController');

router.get('/current', authenticate, getCurrent);
router.get('/history', authenticate, getHistory);

module.exports = router;
