const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { optimizeCurrent, getHistory } = require('../controllers/optimizationController');

router.post('/run', authenticate, optimizeCurrent);
router.get('/history', authenticate, getHistory);

module.exports = router;
