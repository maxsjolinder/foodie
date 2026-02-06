import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/units - List all units
router.get('/', async (req: Request, res: Response) => {
  try {
    const units = await prisma.unit.findMany({
      orderBy: [
        { unitType: 'asc' },
        { conversionToBase: 'desc' },
      ],
    });
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

export default router;
