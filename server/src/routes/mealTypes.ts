import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/meal-types - List all meal types
router.get('/', async (req: Request, res: Response) => {
  try {
    const mealTypes = await prisma.mealType.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
    res.json(mealTypes);
  } catch (error) {
    console.error('Error fetching meal types:', error);
    res.status(500).json({ error: 'Failed to fetch meal types' });
  }
});

export default router;
