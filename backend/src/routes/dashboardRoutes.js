const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getOverview } = require('../controllers/dashboardController');

router.get('/overview', authenticate, getOverview);

module.exports = router;
