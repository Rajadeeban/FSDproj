const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { ENERGY_PER_KG_H2 } = require('../services/optimizationService');

const getCurrent = asyncHandler(async (req, res) => {
  const latest = await prisma.hydrogenProduction.findFirst({ orderBy: { timestamp: 'desc' } });
  res.json({ success: true, data: latest });
});

const getHistory = asyncHandler(async (req, res) => {
  const hours = Math.min(parseInt(req.query.hours) || 24, 168);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await prisma.hydrogenProduction.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });

  res.json({ success: true, data: rows });
});

const getSchedule = asyncHandler(async (req, res) => {
  const { buildForecastSeries } = require('../utils/demoData');
  const forecast = buildForecastSeries(24);
  const latestConfig = await prisma.systemConfig.findMany();
  const configMap = Object.fromEntries(latestConfig.map((c) => [c.key, c.value]));
  const electrolyzerCapacity = parseFloat(configMap.electrolyzerCapacity || 600);

  const schedule = forecast.map((f) => {
    const available = f.solar + f.wind;
    const recommendedEnergy = Math.min(available * 0.6, electrolyzerCapacity);
    const recommendedRate = Math.round((recommendedEnergy / ENERGY_PER_KG_H2) * 100) / 100;
    return {
      time: f.timestamp,
      forecastGeneration: Math.round(available * 100) / 100,
      recommendedProductionRate: Math.max(0, recommendedRate),
      recommendedEnergyAllocation: Math.round(recommendedEnergy * 100) / 100,
    };
  });

  res.json({ success: true, data: schedule });
});

module.exports = { getCurrent, getHistory, getSchedule };
