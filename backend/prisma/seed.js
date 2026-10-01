const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { round2, randomBetween, clamp } = require('../src/utils/demoData');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GreenH2 database...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@greenh2.com' },
    update: {},
    create: { name: 'Plant Administrator', email: 'admin@greenh2.com', password: adminPassword, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'user@greenh2.com' },
    update: {},
    create: { name: 'Demo Operator', email: 'user@greenh2.com', password: userPassword, role: 'USER' },
  });

  const configs = [
    { key: 'solarCapacity', value: '500', label: 'Solar Farm Capacity (kW)' },
    { key: 'windCapacity', value: '400', label: 'Wind Farm Capacity (kW)' },
    { key: 'electrolyzerCapacity', value: '600', label: 'Electrolyzer Max Draw (kW)' },
    { key: 'batteryCapacity', value: '1000', label: 'Battery Storage Capacity (kWh)' },
    { key: 'hydrogenCapacity', value: '500', label: 'Hydrogen Storage Capacity (kg)' },
    { key: 'targetProductionRate', value: '9', label: 'Target Hydrogen Production Rate (kg/h)' },
  ];
  for (const c of configs) {
    await prisma.systemConfig.upsert({ where: { key: c.key }, update: {}, create: c });
  }

  console.log('Generating 7 days of historical energy data...');
  await prisma.energyReading.deleteMany();
  await prisma.hydrogenProduction.deleteMany();
  await prisma.storageStatus.deleteMany();
  await prisma.optimizationResult.deleteMany();
  await prisma.alert.deleteMany();

  const now = new Date();
  let batteryLevel = 55;
  let hydrogenLevel = 40;

  const totalHours = 24 * 7;
  for (let i = totalHours - 1; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = ts.getHours();

    const solarPeak = Math.exp(-Math.pow(hour - 13, 2) / (2 * 4.2 * 4.2));
    const solar = hour >= 6 && hour <= 19 ? round2(500 * solarPeak * randomBetween(0.85, 1.05)) : round2(randomBetween(0, 5));
    const windBase = 0.45 + 0.25 * Math.sin((hour / 24) * Math.PI * 2 + 1.2);
    const wind = round2(clamp(400 * windBase * randomBetween(0.75, 1.15), 20, 380));

    const morning = Math.exp(-Math.pow(hour - 9, 2) / (2 * 2.5 * 2.5));
    const evening = Math.exp(-Math.pow(hour - 19, 2) / (2 * 3 * 3));
    const demandFactor = 0.55 + 0.45 * Math.max(morning, evening);
    const demand = round2(350 * demandFactor * randomBetween(0.9, 1.1));

    const totalGen = solar + wind;
    const gridExport = round2(Math.max(0, totalGen - demand) * 0.15);

    await prisma.energyReading.create({
      data: {
        timestamp: ts,
        solarGeneration: solar,
        windGeneration: wind,
        demand,
        gridExport,
        solarCapacity: 500,
        windCapacity: 400,
      },
    });

    const surplus = Math.max(0, totalGen - demand);
    const energyToH2 = Math.min(600, surplus * 0.6 + 50);
    const productionRate = round2(energyToH2 / 55);
    const targetRate = 9;
    const status = productionRate < 1 ? 'IDLE' : 'RUNNING';

    await prisma.hydrogenProduction.create({
      data: {
        timestamp: ts,
        productionRate,
        targetRate,
        electrolyzerStatus: status,
        energyConsumed: round2(energyToH2),
        efficiency: round2(clamp(randomBetween(60, 78), 55, 85)),
      },
    });

    const batteryDelta = (surplus > 0 ? Math.min(surplus * 0.2, 40) : -Math.min(Math.abs(surplus) * 0.15, 25)) / 10;
    batteryLevel = clamp(batteryLevel + batteryDelta, 5, 98);
    const hydrogenDelta = productionRate * 0.4 - randomBetween(0.5, 2.5);
    hydrogenLevel = clamp(hydrogenLevel + hydrogenDelta, 5, 98);

    await prisma.storageStatus.create({
      data: {
        timestamp: ts,
        batteryLevel: round2(batteryLevel),
        batteryCapacity: 1000,
        hydrogenLevel: round2(hydrogenLevel),
        hydrogenCapacity: 500,
        chargingStatus: batteryDelta > 0.5 ? 'CHARGING' : batteryDelta < -0.5 ? 'DISCHARGING' : 'IDLE',
      },
    });
  }

  await prisma.alert.create({
    data: {
      type: 'SYSTEM',
      severity: 'INFO',
      message: 'GreenH2 platform initialized with demo data.',
      resolved: true,
      resolvedAt: new Date(),
    },
  });

  console.log('Seeding complete.');
  console.log('----------------------------------------');
  console.log('Demo login credentials:');
  console.log('  Admin -> admin@greenh2.com / Admin@123');
  console.log('  User  -> user@greenh2.com  / User@123');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
