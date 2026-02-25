# Foodie - Family Meal Planning Application

A web application for Swedish-speaking families to plan meals for 3 weeks and generate grocery shopping lists.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + React Router + i18next
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 14+ with Prisma ORM
- **AI Integration:** Anthropic Claude API (optional, for recipe photo extraction)

## Commands

```bash
# Install dependencies
npm install

# Development (runs both frontend and backend)
npm run dev

# Run only backend (port 3000)
npm run dev:server

# Run only frontend (port 5173)
npm run dev:client

# Build
npm run build

# Database migrations
npm run db:migrate

# Seed database (units, meal types, ingredients)
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run generate
```

## Project Structure

```
foodie/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── services/       # API client and types
│       └── i18n/           # Swedish translations
├── server/                 # Express backend
│   └── src/
│       ├── routes/         # API endpoints
│       ├── services/       # Business logic
│       └── prisma/         # Database schema and migrations
```

## Key Patterns

- **Monorepo:** npm workspaces with `server/` and `client/`
- **API Proxy:** Frontend dev server proxies `/api` to backend on port 3000
- **Unit Conversion:** Only converts within same unit type (weight↔weight, volume↔volume)
- **Ingredient Matching:** Fuzzy matching with deferred creation until recipe save
- **Photo Extraction:** Supports OCR (Tesseract) or AI (Claude) methods
- **Localization:** Swedish is the primary language

## Database Models

- **Unit** - Measurement units with conversion factors (g, kg, ml, dl, msk, tsk, st)
- **Ingredient** - Food items with default unit
- **Recipe** - Recipes with ingredients, times, servings
- **RecipeIngredient** - Join table for recipe ingredients
- **MealType** - Frukost, Lunch, Middag, Mellanmål
- **MealPlan** - Scheduled meals with date, portions, cooked status

## API Endpoints

- `GET/POST /api/recipes` - Recipe CRUD
- `POST /api/recipes/extract-from-photo?method=ocr|ai` - Photo extraction
- `POST /api/recipes/extract-from-photos` - Multi-photo extraction
- `GET/POST /api/meal-plans` - Meal planning
- `GET /api/grocery-list?week=YYYY-MM-DD` - Shopping list generation
- `GET/POST /api/ingredients` - Ingredient management
- `GET /api/units`, `GET /api/meal-types` - Reference data

## Environment Variables

Required in `server/.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/foodie
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Optional, for AI extraction
```
