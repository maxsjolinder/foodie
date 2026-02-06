import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/ingredients - List all ingredients
router.get('/', async (req: Request, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        defaultUnit: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// POST /api/ingredients - Create ingredient
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, defaultUnitId } = req.body;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        defaultUnitId,
      },
      include: {
        defaultUnit: true,
      },
    });

    res.status(201).json(ingredient);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// PUT /api/ingredients/:id - Update ingredient
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, defaultUnitId } = req.body;

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: {
        name,
        defaultUnitId,
      },
      include: {
        defaultUnit: true,
      },
    });

    res.json(ingredient);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// DELETE /api/ingredients/:id - Delete ingredient
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ingredient.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

export default router;
