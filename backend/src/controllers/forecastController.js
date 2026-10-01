const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { buildForecastSeries } = require('../utils/demoData');

const getForecast = asyncHandler(async (req, res) => {
  const hours = Math.min(parseInt(req.query.hours) || 24, 168);
  const series = buildForecastSeries(hours);
  res.json({
    success: true,
    data: series.map((s) => ({
      timestamp: s.timestamp,
      solar: s.solar,
      wind: s.wind,
      totalGeneration: Math.round((s.solar + s.wind) * 100) / 100,
      demand: s.demand,
    })),
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [energyRows, h2Rows] = await Promise.all([
    prisma.energyReading.findMany({ where: { timestamp: { gte: since } }, orderBy: { timestamp: 'asc' } }),
    prisma.hydrogenProduction.findMany({ where: { timestamp: { gte: since } }, orderBy: { timestamp: 'asc' } }),
  ]);

  const totalGenerated = energyRows.reduce((sum, r) => sum + r.solarGeneration + r.windGeneration, 0);
  const totalDemand = energyRows.reduce((sum, r) => sum + r.demand, 0);
  const totalExported = energyRows.reduce((sum, r) => sum + r.gridExport, 0);
  const totalH2Produced = h2Rows.reduce((sum, r) => sum + r.productionRate, 0);

  const utilizationRate = totalGenerated > 0
    ? Math.round(((totalGenerated - totalExported) / totalGenerated) * 1000) / 10
    : 0;
  const wastageRate = totalGenerated > 0
    ? Math.round((totalExported / totalGenerated) * 1000) / 10
    : 0;

  const dailyMap = {};
  h2Rows.forEach((r) => {
    const day = r.timestamp.toISOString().slice(0, 10);
    dailyMap[day] = dailyMap[day] || { day, total: 0, count: 0 };
    dailyMap[day].total += r.productionRate;
    dailyMap[day].count += 1;
  });
  const hydrogenTrend = Object.values(dailyMap).map((d) => ({
    day: d.day,
    avgProductionRate: Math.round((d.total / d.count) * 100) / 100,
  }));

  res.json({
    success: true,
    data: {
      totalGenerated: Math.round(totalGenerated * 100) / 100,
      totalDemand: Math.round(totalDemand * 100) / 100,
      totalExported: Math.round(totalExported * 100) / 100,
      totalH2Produced: Math.round(totalH2Produced * 100) / 100,
      utilizationRate,
      wastageRate,
      hydrogenTrend,
      periodDays: days,
    },
  });
});

const exportCsv = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.energyReading.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });

  const header = 'timestamp,solar_kw,wind_kw,demand_kw,grid_export_kw\n';
  const body = rows
    .map((r) => `${r.timestamp.toISOString()},${r.solarGeneration},${r.windGeneration},${r.demand},${r.gridExport}`)
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="greenh2_export_${days}d.csv"`);
  res.send(header + body);
});

module.exports = { getForecast, getAnalytics, exportCsv };
