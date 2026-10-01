const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { role } = req.body;
  if (!['ADMIN', 'USER'].includes(role)) {
    return res.status(422).json({ success: false, message: 'Role must be ADMIN or USER' });
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json({ success: true, data: updated });
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ success: true, message: 'User deleted' });
});

const getConfig = asyncHandler(async (req, res) => {
  const configs = await prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  res.json({ success: true, data: configs });
});

const upsertConfig = asyncHandler(async (req, res) => {
  const { key, value, label } = req.body;
  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value: String(value), label: label || undefined },
    create: { key, value: String(value), label: label || key },
  });
  res.json({ success: true, data: config });
});

const getSystemStats = asyncHandler(async (req, res) => {
  const [userCount, alertCount, energyCount, h2Count] = await Promise.all([
    prisma.user.count(),
    prisma.alert.count({ where: { resolved: false } }),
    prisma.energyReading.count(),
    prisma.hydrogenProduction.count(),
  ]);
  res.json({ success: true, data: { userCount, activeAlerts: alertCount, energyRecords: energyCount, hydrogenRecords: h2Count } });
});

module.exports = { getUsers, updateUserRole, deleteUser, getConfig, upsertConfig, getSystemStats };
