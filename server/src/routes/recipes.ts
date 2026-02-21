import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { IngredientMatcher } from '../services/ingredientMatcher';

const router = Router();
const prisma = new PrismaClient();
const ingredientMatcher = new IngredientMatcher();

// GET /api/recipes - List all recipes
router.get('/', async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET /api/recipes/:id - Get single recipe
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST /api/recipes - Create new recipe
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, instructions, prepTimeMinutes, cookTimeMinutes, servings, ingredients } = req.body;

    // Create any new ingredients first (those with ingredientId === 0)
    const processedIngredients = await Promise.all(
      ingredients.map(async (ing: any) => {
        if (ing.ingredientId === 0 && ing.isNew && ing.matchedName) {
          // Create the new ingredient
          const newIngredientId = await ingredientMatcher.createIngredient(ing.matchedName, ing.unitId);
          return {
            ingredientId: newIngredientId,
            quantity: ing.quantity,
            unitId: ing.unitId,
          };
        }
        // Existing ingredient, use as-is
        return {
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unitId: ing.unitId,
        };
      })
    );

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        instructions,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        ingredients: {
          create: processedIngredients,
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
      },
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// PUT /api/recipes/:id - Update recipe
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, instructions, prepTimeMinutes, cookTimeMinutes, servings, ingredients } = req.body;

    // Create any new ingredients first (those with ingredientId === 0)
    const processedIngredients = await Promise.all(
      ingredients.map(async (ing: any) => {
        if (ing.ingredientId === 0 && ing.isNew && ing.matchedName) {
          // Create the new ingredient
          const newIngredientId = await ingredientMatcher.createIngredient(ing.matchedName, ing.unitId);
          return {
            ingredientId: newIngredientId,
            quantity: ing.quantity,
            unitId: ing.unitId,
          };
        }
        // Existing ingredient, use as-is
        return {
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unitId: ing.unitId,
        };
      })
    );

    // Delete existing ingredients
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: parseInt(id) },
    });

    // Update recipe with new ingredients
    const recipe = await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        instructions,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        ingredients: {
          create: processedIngredients,
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
      },
    });

    res.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE /api/recipes/:id - Delete recipe
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.recipe.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;
