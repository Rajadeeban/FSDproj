const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { runOptimization } = require('../services/optimizationService');

const optimizeCurrent = asyncHandler(async (req, res) => {
  const [latestEnergy, latestH2, latestStorage, configs] = await Promise.all([
    prisma.energyReading.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.hydrogenProduction.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.storageStatus.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.systemConfig.findMany(),
  ]);

  if (!latestEnergy || !latestStorage) {
    return res.status(400).json({ success: false, message: 'Insufficient live data to optimize. Seed the database first.' });
  }

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  const electrolyzerCapacity = parseFloat(configMap.electrolyzerCapacity || 600);

  const input = {
    solar: latestEnergy.solarGeneration,
    wind: latestEnergy.windGeneration,
    demand: latestEnergy.demand,
    electrolyzerCapacity,
    targetProductionRate: latestH2?.targetRate || 8,
    batteryLevel: latestStorage.batteryLevel,
    batteryCapacity: latestStorage.batteryCapacity,
    hydrogenLevel: latestStorage.hydrogenLevel,
    hydrogenCapacity: latestStorage.hydrogenCapacity,
  };

  const result = runOptimization(input);

  const saved = await prisma.optimizationResult.create({
    data: {
      inputSolar: input.solar,
      inputWind: input.wind,
      inputDemand: input.demand,
      batteryLevel: input.batteryLevel,
      hydrogenLevel: input.hydrogenLevel,
      currentHydrogenAlloc: result.current.hydrogen,
      currentBatteryAlloc: result.current.battery,
      currentGridAlloc: result.current.grid,
      optimizedHydrogenAlloc: result.optimized.hydrogen,
      optimizedBatteryAlloc: result.optimized.battery,
      optimizedGridAlloc: result.optimized.grid,
      efficiencyImprovement: result.efficiencyImprovement,
      algorithm: result.algorithm,
    },
  });

  res.json({ success: true, data: { ...result, id: saved.id, timestamp: saved.createdAt } });
});

const getHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const rows = await prisma.optimizationResult.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json({ success: true, data: rows });
});

module.exports = { optimizeCurrent, getHistory };
