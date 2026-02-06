import { Router, Request, Response } from 'express';
import { generateGroceryList } from '../services/groceryAggregator';

const router = Router();

// GET /api/grocery-list - Get aggregated grocery list for a week
// Query params: week (YYYY-MM-DD) - start date of the week
router.get('/', async (req: Request, res: Response) => {
  try {
    const { week } = req.query;

    if (!week || typeof week !== 'string') {
      return res.status(400).json({ error: 'week parameter is required (YYYY-MM-DD)' });
    }

    const weekStart = new Date(week);
    const groceryList = await generateGroceryList(weekStart);

    res.json(groceryList);
  } catch (error) {
    console.error('Error generating grocery list:', error);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
});

export default router;
