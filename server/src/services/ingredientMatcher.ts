import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class IngredientMatcher {
  async matchIngredient(name: string): Promise<{ id: number; defaultUnitId: number }> {
    // Normalize name (lowercase, trim)
    const normalized = name.toLowerCase().trim();

    // Try exact match
    let ingredient = await prisma.ingredient.findFirst({
      where: { name: { equals: normalized, mode: 'insensitive' } },
      include: { defaultUnit: true },
    });

    // Try partial match (contains)
    if (!ingredient) {
      ingredient = await prisma.ingredient.findFirst({
        where: { name: { contains: normalized, mode: 'insensitive' } },
        include: { defaultUnit: true },
      });
    }

    // Create new ingredient if not found
    if (!ingredient) {
      const defaultUnit = await prisma.unit.findFirst({ where: { name: 'st' } });
      ingredient = await prisma.ingredient.create({
        data: {
          name: normalized,
          defaultUnitId: defaultUnit!.id,
        },
        include: { defaultUnit: true },
      });
    }

    return { id: ingredient.id, defaultUnitId: ingredient.defaultUnitId };
  }

  async matchUnit(unitName: string | undefined): Promise<number> {
    if (!unitName) {
      const defaultUnit = await prisma.unit.findFirst({ where: { name: 'st' } });
      return defaultUnit!.id;
    }

    const normalized = unitName.toLowerCase();

    // Unit aliases for common variations
    const unitMap: Record<string, string> = {
      'cup': 'cup', 'cups': 'cup',
      'tsp': 'tsk', 'teaspoon': 'tsk',
      'tbsp': 'msk', 'tablespoon': 'msk',
      'g': 'g', 'gram': 'g', 'grams': 'g',
      'kg': 'kg', 'kilogram': 'kg',
      'ml': 'ml', 'milliliter': 'ml',
      'l': 'l', 'liter': 'l',
      'dl': 'dl',
      'st': 'st', 'piece': 'st', 'pieces': 'st',
    };

    const mappedUnit = unitMap[normalized] || normalized;

    const unit = await prisma.unit.findFirst({
      where: { name: { equals: mappedUnit, mode: 'insensitive' } },
    });

    if (unit) {
      return unit.id;
    }

    // Fallback to 'st'
    const defaultUnit = await prisma.unit.findFirst({ where: { name: 'st' } });
    return defaultUnit!.id;
  }
}
