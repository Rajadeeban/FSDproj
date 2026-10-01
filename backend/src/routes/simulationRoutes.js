const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { simulate } = require('../controllers/simulationController');

const numField = (name) => body(name).isFloat({ min: 0 }).withMessage(`${name} must be a non-negative number`);

router.post(
  '/run',
  authenticate,
  [
    numField('solar'),
    numField('wind'),
    numField('demand'),
    numField('electrolyzerCapacity'),
    numField('targetProductionRate'),
    body('batteryLevel').isFloat({ min: 0, max: 100 }).withMessage('batteryLevel must be 0-100'),
    numField('batteryCapacity'),
    body('hydrogenLevel').isFloat({ min: 0, max: 100 }).withMessage('hydrogenLevel must be 0-100'),
    numField('hydrogenCapacity'),
  ],
  validate,
  simulate
);

module.exports = router;
