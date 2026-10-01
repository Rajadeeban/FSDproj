const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const getCurrent = asyncHandler(async (req, res) => {
  const latest = await prisma.energyReading.findFirst({ orderBy: { timestamp: 'desc' } });
  if (!latest) return res.json({ success: true, data: null });

  const solarEfficiency = Math.round((latest.solarGeneration / latest.solarCapacity) * 1000) / 10;
  const windEfficiency = Math.round((latest.windGeneration / latest.windCapacity) * 1000) / 10;

  res.json({
    success: true,
    data: {
      solar: { generation: latest.solarGeneration, capacity: latest.solarCapacity, efficiency: solarEfficiency },
      wind: { generation: latest.windGeneration, capacity: latest.windCapacity, efficiency: windEfficiency },
      demand: latest.demand,
      gridExport: latest.gridExport,
      timestamp: latest.timestamp,
    },
  });
});

const getHistory = asyncHandler(async (req, res) => {
  const hours = Math.min(parseInt(req.query.hours) || 24, 168);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const readings = await prisma.energyReading.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });

  res.json({
    success: true,
    data: readings.map((r) => ({
      timestamp: r.timestamp,
      solar: r.solarGeneration,
      wind: r.windGeneration,
      demand: r.demand,
      gridExport: r.gridExport,
    })),
  });
});

module.exports = { getCurrent, getHistory };
