import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Units
  console.log('Creating units...');
  const units = [
    // Weight units (base: grams)
    { name: 'g', displayName: 'gram', unitType: 'weight', conversionToBase: 1 },
    { name: 'kg', displayName: 'kilogram', unitType: 'weight', conversionToBase: 1000 },
    { name: 'hg', displayName: 'hektogram', unitType: 'weight', conversionToBase: 100 },

    // Volume units (base: milliliters)
    { name: 'ml', displayName: 'milliliter', unitType: 'volume', conversionToBase: 1 },
    { name: 'dl', displayName: 'deciliter', unitType: 'volume', conversionToBase: 100 },
    { name: 'l', displayName: 'liter', unitType: 'volume', conversionToBase: 1000 },
    { name: 'msk', displayName: 'matsked', unitType: 'volume', conversionToBase: 15 },
    { name: 'tsk', displayName: 'tesked', unitType: 'volume', conversionToBase: 5 },
    { name: 'krm', displayName: 'kryddmått', unitType: 'volume', conversionToBase: 1 },

    // Count units
    { name: 'st', displayName: 'styck', unitType: 'count', conversionToBase: 1 },
    { name: 'förp', displayName: 'förpackning', unitType: 'count', conversionToBase: 1 },
    { name: 'burk', displayName: 'burk', unitType: 'count', conversionToBase: 1 },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }
  console.log(`✅ Created ${units.length} units`);

  // Seed Meal Types
  console.log('Creating meal types...');
  const mealTypes = [
    { name: 'Lunch', sortOrder: 1 },
    { name: 'Middag', sortOrder: 2 },
  ];

  for (const mealType of mealTypes) {
    await prisma.mealType.upsert({
      where: { name: mealType.name },
      update: {},
      create: mealType,
    });
  }
  console.log(`✅ Created ${mealTypes.length} meal types`);

  // Seed some common ingredients
  console.log('Creating common ingredients...');
  const gramsUnit = await prisma.unit.findUnique({ where: { name: 'g' } });
  const mlUnit = await prisma.unit.findUnique({ where: { name: 'ml' } });
  const stUnit = await prisma.unit.findUnique({ where: { name: 'st' } });

  if (!gramsUnit || !mlUnit || !stUnit) {
    throw new Error('Units not found');
  }

  const ingredients = [
    { name: 'Pasta', defaultUnitId: gramsUnit.id },
    { name: 'Ris', defaultUnitId: gramsUnit.id },
    { name: 'Potatis', defaultUnitId: gramsUnit.id },
    { name: 'Kycklingfilé', defaultUnitId: gramsUnit.id },
    { name: 'Lök', defaultUnitId: stUnit.id },
    { name: 'Vitlök', defaultUnitId: stUnit.id },
    { name: 'Tomater', defaultUnitId: gramsUnit.id },
    { name: 'Mjölk', defaultUnitId: mlUnit.id },
    { name: 'Grädde', defaultUnitId: mlUnit.id },
    { name: 'Smör', defaultUnitId: gramsUnit.id },
    { name: 'Ägg', defaultUnitId: stUnit.id },
    { name: 'Salt', defaultUnitId: gramsUnit.id },
    { name: 'Peppar', defaultUnitId: gramsUnit.id },
    { name: 'Olivolja', defaultUnitId: mlUnit.id },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient,
    });
  }
  console.log(`✅ Created ${ingredients.length} common ingredients`);

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
