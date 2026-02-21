import { Router, Request, Response } from 'express';
import multer from 'multer';
import { OCRService } from '../services/ocrService';
import { RecipeParser } from '../services/recipeParser';
import { IngredientMatcher } from '../services/ingredientMatcher';
import { AIExtractor } from '../services/aiExtractor';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory, don't save to disk
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  },
});

const ocrService = new OCRService();
const recipeParser = new RecipeParser();
const ingredientMatcher = new IngredientMatcher();
let aiExtractor: AIExtractor | null = null;

// Initialize AI extractor only if API key is available
try {
  aiExtractor = new AIExtractor();
} catch (error) {
  console.warn('AI extraction not available (ANTHROPIC_API_KEY not set)');
}

// POST /api/recipes/extract-from-photo?method=ocr|ai
router.post('/extract-from-photo', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const method = (req.query.method as string) || 'ocr'; // Default to OCR
    console.log(`Processing image with ${method.toUpperCase()}:`, req.file.originalname, req.file.size, 'bytes');

    let parsedRecipe: any;

    if (method === 'ai') {
      // AI-based extraction using Claude
      if (!aiExtractor) {
        return res.status(503).json({
          error: 'AI extraction not available. ANTHROPIC_API_KEY environment variable is not set.',
        });
      }

      parsedRecipe = await aiExtractor.extractFromImage(req.file.buffer, req.file.mimetype);
      console.log('AI extracted recipe:', parsedRecipe);
    } else {
      // OCR-based extraction
      const extractedText = await ocrService.extractTextFromImage(req.file.buffer);
      console.log('OCR extracted text:', extractedText);

      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(400).json({ error: 'No readable text found in image' });
      }

      parsedRecipe = recipeParser.parseRecipeText(extractedText);
      console.log('Parsed recipe:', parsedRecipe);
    }

    if (!parsedRecipe.name || parsedRecipe.ingredients.length === 0) {
      return res.status(400).json({
        error: 'Could not identify recipe structure. Please ensure the image contains a clear recipe with ingredients.',
        rawText: parsedRecipe.rawText || '',
      });
    }

    // Match ingredients to database (but don't create new ones yet)
    const ingredients = await Promise.all(
      parsedRecipe.ingredients.map(async (ing) => {
        const { id: ingredientId, defaultUnitId, isNew, matchedName } = await ingredientMatcher.matchIngredient(ing.name);
        const unitId = await ingredientMatcher.matchUnit(ing.unit);

        return {
          ingredientId: ingredientId || 0, // 0 indicates ingredient needs to be created on save
          quantity: ing.quantity || 0,
          unitId,
          originalText: ing.name, // Keep for user review
          isNew, // Flag to indicate ingredient needs to be created
          matchedName, // The ingredient name that will be used
        };
      })
    );

    // Return structured data to frontend
    res.json({
      name: parsedRecipe.name,
      description: parsedRecipe.description || '',
      instructions: parsedRecipe.instructions || '',
      prepTimeMinutes: parsedRecipe.prepTimeMinutes || 0,
      cookTimeMinutes: parsedRecipe.cookTimeMinutes || 0,
      servings: parsedRecipe.servings || 2,
      ingredients,
      confidence: parsedRecipe.confidence,
      rawText: parsedRecipe.rawText || '', // For debugging/review
      method, // Include which method was used
    });

  } catch (error: any) {
    console.error('Error extracting recipe from photo:', error);
    res.status(500).json({
      error: 'Failed to process image',
      details: error.message,
    });
  }
});

// POST /api/recipes/extract-from-photos (multiple files) - for AI method only
router.post('/extract-from-photos', upload.array('photos', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const method = (req.query.method as string) || 'ai';
    console.log(`Processing ${files.length} images with ${method.toUpperCase()}`);

    if (method !== 'ai') {
      return res.status(400).json({
        error: 'Multiple file upload is only supported with AI extraction method',
      });
    }

    // AI-based extraction using Claude
    if (!aiExtractor) {
      return res.status(503).json({
        error: 'AI extraction not available. ANTHROPIC_API_KEY environment variable is not set.',
      });
    }

    // Prepare images for AI extraction
    const imageBuffers = files.map(file => ({
      buffer: file.buffer,
      mimeType: file.mimetype,
    }));

    const parsedRecipe = await aiExtractor.extractFromMultipleImages(imageBuffers);
    console.log('AI extracted recipe from multiple images:', parsedRecipe);

    if (!parsedRecipe.name || parsedRecipe.ingredients.length === 0) {
      return res.status(400).json({
        error: 'Could not identify recipe structure. Please ensure the images contain a clear recipe with ingredients.',
        rawText: parsedRecipe.rawText || '',
      });
    }

    // Match ingredients to database (but don't create new ones yet)
    const ingredients = await Promise.all(
      parsedRecipe.ingredients.map(async (ing) => {
        const { id: ingredientId, defaultUnitId, isNew, matchedName } = await ingredientMatcher.matchIngredient(ing.name);
        const unitId = await ingredientMatcher.matchUnit(ing.unit);

        return {
          ingredientId: ingredientId || 0,
          quantity: ing.quantity || 0,
          unitId,
          originalText: ing.name,
          isNew,
          matchedName,
        };
      })
    );

    // Return structured data to frontend
    res.json({
      name: parsedRecipe.name,
      description: parsedRecipe.description || '',
      instructions: parsedRecipe.instructions || '',
      prepTimeMinutes: parsedRecipe.prepTimeMinutes || 0,
      cookTimeMinutes: parsedRecipe.cookTimeMinutes || 0,
      servings: parsedRecipe.servings || 2,
      ingredients,
      confidence: parsedRecipe.confidence,
      rawText: parsedRecipe.rawText || '',
      method,
    });

  } catch (error: any) {
    console.error('Error extracting recipe from photos:', error);
    res.status(500).json({
      error: 'Failed to process images',
      details: error.message,
    });
  }
});

export default router;
