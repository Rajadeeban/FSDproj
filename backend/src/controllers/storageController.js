const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const getCurrent = asyncHandler(async (req, res) => {
  const latest = await prisma.storageStatus.findFirst({ orderBy: { timestamp: 'desc' } });
  if (!latest) return res.json({ success: true, data: null });

  const alerts = [];
  if (latest.batteryLevel < 15) alerts.push({ level: 'critical', message: 'Battery level critically low' });
  if (latest.batteryLevel > 95) alerts.push({ level: 'info', message: 'Battery nearly full' });
  if (latest.hydrogenLevel < 15) alerts.push({ level: 'warning', message: 'Hydrogen storage running low' });
  if (latest.hydrogenLevel > 95) alerts.push({ level: 'warning', message: 'Hydrogen storage near capacity' });

  res.json({ success: true, data: { ...latest, alerts } });
});

const getHistory = asyncHandler(async (req, res) => {
  const hours = Math.min(parseInt(req.query.hours) || 24, 168);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await prisma.storageStatus.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });

  res.json({ success: true, data: rows });
});

module.exports = { getCurrent, getHistory };
