import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class IngredientMatcher {
  async matchIngredient(name: string): Promise<{ id: number | null; defaultUnitId: number; isNew: boolean; matchedName: string }> {
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

    // If not found, return placeholder info (don't create yet)
    if (!ingredient) {
      const defaultUnit = await prisma.unit.findFirst({ where: { name: 'st' } });
      return {
        id: null, // null indicates this ingredient doesn't exist yet
        defaultUnitId: defaultUnit!.id,
        isNew: true,
        matchedName: normalized
      };
    }

    return {
      id: ingredient.id,
      defaultUnitId: ingredient.defaultUnitId,
      isNew: false,
      matchedName: ingredient.name
    };
  }

  async createIngredient(name: string, defaultUnitId?: number): Promise<number> {
    const normalized = name.toLowerCase().trim();

    // Check if it already exists (in case of race condition)
    const existing = await prisma.ingredient.findFirst({
      where: { name: { equals: normalized, mode: 'insensitive' } },
    });

    if (existing) {
      return existing.id;
    }

    // Create new ingredient
    const unitId = defaultUnitId || (await prisma.unit.findFirst({ where: { name: 'st' } }))!.id;
    const ingredient = await prisma.ingredient.create({
      data: {
        name: normalized,
        defaultUnitId: unitId,
      },
    });

    return ingredient.id;
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
