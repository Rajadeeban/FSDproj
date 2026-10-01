const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { evaluateAlerts } = require('../services/optimizationService');

const getAlerts = asyncHandler(async (req, res) => {
  const resolved = req.query.resolved;
  const where = resolved === undefined ? {} : { resolved: resolved === 'true' };

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ success: true, data: alerts });
});

const refreshAlerts = asyncHandler(async (req, res) => {
  const [latestEnergy, latestStorage] = await Promise.all([
    prisma.energyReading.findFirst({ orderBy: { timestamp: 'desc' } }),
    prisma.storageStatus.findFirst({ orderBy: { timestamp: 'desc' } }),
  ]);

  if (!latestEnergy || !latestStorage) {
    return res.json({ success: true, data: [] });
  }

  const candidates = evaluateAlerts({
    solar: latestEnergy.solarGeneration,
    wind: latestEnergy.windGeneration,
    demand: latestEnergy.demand,
    batteryLevel: latestStorage.batteryLevel,
    hydrogenLevel: latestStorage.hydrogenLevel,
  });

  const created = [];
  for (const c of candidates) {
    const existing = await prisma.alert.findFirst({ where: { type: c.type, resolved: false } });
    if (!existing) {
      const row = await prisma.alert.create({ data: c });
      created.push(row);
    }
  }

  res.json({ success: true, data: created });
});

const resolveAlert = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const updated = await prisma.alert.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date() },
  });
  res.json({ success: true, data: updated });
});

module.exports = { getAlerts, refreshAlerts, resolveAlert };
