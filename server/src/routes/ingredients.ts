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
    const ingredientId = parseInt(id);

    // Check if ingredient is used in any recipes
    const recipesUsingIngredient = await prisma.recipeIngredient.findMany({
      where: { ingredientId },
      include: {
        recipe: {
          select: {
            name: true,
          },
        },
      },
      take: 2, // Only fetch first 2 recipes for performance
    });

    if (recipesUsingIngredient.length > 0) {
      const usageCount = await prisma.recipeIngredient.count({
        where: { ingredientId },
      });

      let message: string;
      if (usageCount === 1) {
        // Single recipe: show the recipe name
        message = `Denna ingrediens används i receptet "${recipesUsingIngredient[0].recipe.name}". Ta bort receptet först eller välj en annan ingrediens.`;
      } else {
        // Multiple recipes: show first recipe name and indicate there are more
        message = `Denna ingrediens används i bland annat "${recipesUsingIngredient[0].recipe.name}" (${usageCount} recept totalt). Ta bort recepten först eller välj en annan ingrediens.`;
      }

      return res.status(400).json({
        error: 'Kan inte ta bort ingrediens som används i recept',
        message,
        usageCount,
      });
    }

    // Safe to delete
    await prisma.ingredient.delete({
      where: { id: ingredientId },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

export default router;
