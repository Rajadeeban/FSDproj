const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getForecast, getAnalytics, exportCsv } = require('../controllers/forecastController');

router.get('/forecast', authenticate, getForecast);
router.get('/analytics', authenticate, getAnalytics);
router.get('/export', authenticate, exportCsv);

module.exports = router;
