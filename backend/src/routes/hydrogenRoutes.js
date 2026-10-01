const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getCurrent, getHistory, getSchedule } = require('../controllers/hydrogenController');

router.get('/current', authenticate, getCurrent);
router.get('/history', authenticate, getHistory);
router.get('/schedule', authenticate, getSchedule);

module.exports = router;
