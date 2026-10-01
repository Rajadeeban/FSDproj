const { asyncHandler } = require('../middleware/errorHandler');
const { runOptimization } = require('../services/optimizationService');

const simulate = asyncHandler(async (req, res) => {
  const {
    solar, wind, demand, electrolyzerCapacity, targetProductionRate,
    batteryLevel, batteryCapacity, hydrogenLevel, hydrogenCapacity,
  } = req.body;

  const input = {
    solar: Number(solar),
    wind: Number(wind),
    demand: Number(demand),
    electrolyzerCapacity: Number(electrolyzerCapacity),
    targetProductionRate: Number(targetProductionRate),
    batteryLevel: Number(batteryLevel),
    batteryCapacity: Number(batteryCapacity),
    hydrogenLevel: Number(hydrogenLevel),
    hydrogenCapacity: Number(hydrogenCapacity),
  };

  const result = runOptimization(input);
  res.json({ success: true, data: result });
});

module.exports = { simulate };
