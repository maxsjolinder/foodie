import { PrismaClient } from '@prisma/client';
import { aggregateQuantities } from './unitConverter';

const prisma = new PrismaClient();

export interface GroceryItem {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitDisplayName: string;
}

/**
 * Generate aggregated grocery list for a specific week
 * @param weekStart - Start date of the week (YYYY-MM-DD)
 */
export async function generateGroceryList(weekStart: Date): Promise<GroceryItem[]> {
  // Calculate week end (7 days from start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get all meal plans for the week with their recipes and ingredients
  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      plannedDate: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: {
              ingredient: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  // Get all units for conversion
  const allUnits = await prisma.unit.findMany();

  // Group ingredients by ingredient ID
  const ingredientMap = new Map<
    number,
    {
      name: string;
      items: Array<{ quantity: number; unit: any }>;
    }
  >();

  for (const mealPlan of mealPlans) {
    for (const recipeIngredient of mealPlan.recipe.ingredients) {
      const ingredientId = recipeIngredient.ingredientId;
      const ingredientName = recipeIngredient.ingredient.name;

      if (!ingredientMap.has(ingredientId)) {
        ingredientMap.set(ingredientId, {
          name: ingredientName,
          items: [],
        });
      }

      ingredientMap.get(ingredientId)!.items.push({
        quantity: recipeIngredient.quantity,
        unit: recipeIngredient.unit,
      });
    }
  }

  // Aggregate quantities for each ingredient
  const groceryList: GroceryItem[] = [];

  for (const [ingredientId, data] of ingredientMap.entries()) {
    try {
      const aggregated = aggregateQuantities(data.items, allUnits);

      groceryList.push({
        ingredientId,
        ingredientName: data.name,
        quantity: aggregated.quantity,
        unit: aggregated.unit.name,
        unitDisplayName: aggregated.unit.displayName,
      });
    } catch (error) {
      console.error(`Error aggregating ingredient ${ingredientId}:`, error);
      // If aggregation fails, sum quantities without conversion
      const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
      groceryList.push({
        ingredientId,
        ingredientName: data.name,
        quantity: totalQuantity,
        unit: data.items[0].unit.name,
        unitDisplayName: data.items[0].unit.displayName,
      });
    }
  }

  // Sort by ingredient name
  groceryList.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, 'sv'));

  return groceryList;
}
