const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAlerts, refreshAlerts, resolveAlert } = require('../controllers/alertController');

router.get('/', authenticate, getAlerts);
router.post('/refresh', authenticate, refreshAlerts);
router.patch('/:id/resolve', authenticate, resolveAlert);

module.exports = router;
