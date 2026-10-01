const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { evaluateAlerts } = require('../services/optimizationService');

const getOverview = asyncHandler(async (req, res) => {
  const [latestEnergy, latestH2, latestStorage, recentEnergy, recentH2] = await Promise.all([
    prisma.energyReading.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.hydrogenProduction.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.storageStatus.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.energyReading.findMany({ orderBy: { timestamp: 'desc' }, take: 12 }),
    prisma.hydrogenProduction.findMany({ orderBy: { timestamp: 'desc' }, take: 12 }),
  ]);

  const totalGeneration = (latestEnergy?.solarGeneration || 0) + (latestEnergy?.windGeneration || 0);
  const totalCapacity = (latestEnergy?.solarCapacity || 500) + (latestEnergy?.windCapacity || 400);
  const systemEfficiency = totalCapacity > 0 ? Math.round((totalGeneration / totalCapacity) * 1000) / 10 : 0;

  const activeAlertsCount = await prisma.alert.count({ where: { resolved: false } });

  let systemStatus = 'HEALTHY';
  if (activeAlertsCount > 0) {
    const hasCritical = await prisma.alert.findFirst({ where: { resolved: false, severity: 'CRITICAL' } });
    systemStatus = hasCritical ? 'CRITICAL' : 'WARNING';
  }

  const liveAlerts = latestEnergy && latestStorage
    ? evaluateAlerts({
        solar: latestEnergy.solarGeneration,
        wind: latestEnergy.windGeneration,
        demand: latestEnergy.demand,
        batteryLevel: latestStorage.batteryLevel,
        hydrogenLevel: latestStorage.hydrogenLevel,
      })
    : [];

  res.json({
    success: true,
    data: {
      generation: {
        solar: latestEnergy?.solarGeneration || 0,
        wind: latestEnergy?.windGeneration || 0,
        total: Math.round(totalGeneration * 100) / 100,
        demand: latestEnergy?.demand || 0,
      },
      hydrogen: {
        productionRate: latestH2?.productionRate || 0,
        targetRate: latestH2?.targetRate || 0,
        electrolyzerStatus: latestH2?.electrolyzerStatus || 'IDLE',
        efficiency: latestH2?.efficiency || 0,
      },
      storage: {
        batteryLevel: latestStorage?.batteryLevel || 0,
        batteryCapacity: latestStorage?.batteryCapacity || 1000,
        hydrogenLevel: latestStorage?.hydrogenLevel || 0,
        hydrogenCapacity: latestStorage?.hydrogenCapacity || 500,
        chargingStatus: latestStorage?.chargingStatus || 'IDLE',
      },
      systemEfficiency,
      systemStatus,
      activeAlertsCount,
      liveAlertsPreview: liveAlerts.slice(0, 3),
      trend: {
        energy: recentEnergy.reverse().map((e) => ({
          time: e.timestamp,
          solar: e.solarGeneration,
          wind: e.windGeneration,
          demand: e.demand,
        })),
        hydrogen: recentH2.reverse().map((h) => ({
          time: h.timestamp,
          rate: h.productionRate,
          target: h.targetRate,
        })),
      },
    },
  });
});

module.exports = { getOverview };
