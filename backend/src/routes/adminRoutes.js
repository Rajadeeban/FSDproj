const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getUsers, updateUserRole, deleteUser, getConfig, upsertConfig, getSystemStats,
} = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/config', getConfig);
router.post('/config', upsertConfig);
router.get('/stats', getSystemStats);

module.exports = router;
