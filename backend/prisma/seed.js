const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Users ---
  const salt = await bcrypt.genSalt(10);

  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      password: await bcrypt.hash('manager123', salt),
      role: 'OFFICE_MANAGER',
    },
  });

  const operator = await prisma.user.upsert({
    where: { username: 'operator1' },
    update: {},
    create: {
      username: 'operator1',
      password: await bcrypt.hash('operator123', salt),
      role: 'CENTER_OPERATOR',
      centerName: 'Nashik Center A',
    },
  });

  console.log(`✅ Users created: ${manager.username}, ${operator.username}`);

  // --- Crops ---
  const cropNames = ['Soybean', 'Tur Dal', 'Wheat', 'Onion', 'Cotton'];
  const crops = [];
  for (const name of cropNames) {
    const crop = await prisma.crop.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    crops.push(crop);
  }
  console.log(`✅ Crops created: ${crops.map(c => c.name).join(', ')}`);

  // --- Today's Prices ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grades = ['A', 'B', 'C'];
  const basePrices = { 'Soybean': 4800, 'Tur Dal': 7200, 'Wheat': 2300, 'Onion': 1500, 'Cotton': 6500 };

  for (const crop of crops) {
    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i];
      const rate = basePrices[crop.name] - (i * 200); // A > B > C pricing
      await prisma.priceBoard.upsert({
        where: { date_cropId_grade: { date: today, cropId: crop.id, grade } },
        update: { ratePerQuintal: rate },
        create: { date: today, cropId: crop.id, grade, ratePerQuintal: rate },
      });
    }
  }
  console.log(`✅ Today's prices seeded for all crops (Grades A/B/C)`);

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Manager  → username: manager   | password: manager123');
  console.log('   Operator → username: operator1 | password: operator123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

