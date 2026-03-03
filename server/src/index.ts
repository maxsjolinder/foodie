import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import recipesRouter from './routes/recipes';
import ingredientsRouter from './routes/ingredients';
import mealPlansRouter from './routes/mealPlans';
import groceryListRouter from './routes/groceryList';
import mealTypesRouter from './routes/mealTypes';
import unitsRouter from './routes/units';
import photoExtractionRouter from './routes/photoExtraction';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Foodie API is running' });
});

// API routes
app.use('/api/recipes', recipesRouter);
app.use('/api/recipes', photoExtractionRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/meal-plans', mealPlansRouter);
app.use('/api/grocery-list', groceryListRouter);
app.use('/api/meal-types', mealTypesRouter);
app.use('/api/units', unitsRouter);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../public');
  app.use(express.static(clientBuild));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
