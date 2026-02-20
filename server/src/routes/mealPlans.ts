import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Normalize a meal plan from Prisma so plannedDate is always "YYYY-MM-DD"
// Prisma returns DateTime fields as JS Date objects which serialize to full ISO
// strings (e.g. "2026-02-06T00:00:00.000Z"), breaking simple string comparisons
// on the frontend.
function normalizeMealPlan(mp: any) {
  return {
    ...mp,
    plannedDate: (mp.plannedDate as Date).toISOString().split('T')[0],
  };
}

// Helper to get week number and year from a date
function getWeekData(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return { weekNumber, year: date.getFullYear() };
}

// GET /api/meal-plans - Get meal plans for a date range
// Query params: weekStart (YYYY-MM-DD)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { weekStart } = req.query;

    if (!weekStart || typeof weekStart !== 'string') {
      return res.status(400).json({ error: 'weekStart parameter is required (YYYY-MM-DD)' });
    }

    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 21); // 3 weeks

    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        plannedDate: {
          gte: startDate,
          lt: endDate,
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
        mealType: true,
      },
      orderBy: [
        { plannedDate: 'asc' },
        { mealType: { sortOrder: 'asc' } },
      ],
    });

    res.json(mealPlans.map(normalizeMealPlan));
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// POST /api/meal-plans - Create meal plan entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const { recipeId, mealTypeId, plannedDate, portions } = req.body;

    const date = new Date(plannedDate);
    const { weekNumber, year } = getWeekData(date);

    const mealPlan = await prisma.mealPlan.create({
      data: {
        recipeId,
        mealTypeId,
        plannedDate: date,
        weekNumber,
        year,
        portions: portions ?? 2,
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
        mealType: true,
      },
    });

    res.status(201).json(normalizeMealPlan(mealPlan));
  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({ error: 'Failed to create meal plan' });
  }
});

// PUT /api/meal-plans/:id - Update meal plan
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { recipeId, mealTypeId, plannedDate, portions } = req.body;

    const date = new Date(plannedDate);
    const { weekNumber, year } = getWeekData(date);

    const mealPlan = await prisma.mealPlan.update({
      where: { id: parseInt(id) },
      data: {
        recipeId,
        mealTypeId,
        plannedDate: date,
        weekNumber,
        year,
        portions: portions ?? 2,
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
        mealType: true,
      },
    });

    res.json(normalizeMealPlan(mealPlan));
  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({ error: 'Failed to update meal plan' });
  }
});

// PATCH /api/meal-plans/:id/cooked - Mark meal as cooked
router.patch('/:id/cooked', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isCooked } = req.body;

    const mealPlan = await prisma.mealPlan.update({
      where: { id: parseInt(id) },
      data: {
        isCooked,
        cookedAt: isCooked ? new Date() : null,
      },
      include: {
        recipe: true,
        mealType: true,
      },
    });

    res.json(mealPlan);
  } catch (error) {
    console.error('Error marking meal as cooked:', error);
    res.status(500).json({ error: 'Failed to update meal status' });
  }
});

// DELETE /api/meal-plans/:id - Delete meal plan
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.mealPlan.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
});

export default router;
