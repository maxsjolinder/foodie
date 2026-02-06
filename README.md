# Foodie - Family Meal Planning Application

En webbapplikation för att planera familjemåltider och generera inköpslistor.

## Funktioner

- 📝 Hantera recept med ingredienser
- 📅 Planera måltider för 3 veckor i taget
- 🛒 Automatisk generering av inköpslistor
- ✅ Markera måltider som lagade
- 🇸🇪 Svenskt gränssnitt
- ⚖️ Intelligent enhetskonvertering

## Teknisk stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Databas:** PostgreSQL
- **ORM:** Prisma

## Förutsättningar

- Node.js 18+
- PostgreSQL 14+
- npm eller yarn

## Installation

1. Klona repositoryt
```bash
git clone <repository-url>
cd foodie
```

2. Installera beroenden
```bash
npm install
```

3. Konfigurera databas
Skapa en PostgreSQL-databas och konfigurera miljövariabler:
```bash
cp server/.env.example server/.env
# Redigera server/.env och lägg till din DATABASE_URL
```

4. Kör migreringar och seeda data
```bash
npm run db:migrate
npm run db:seed
```

5. Starta applikationen
```bash
npm run dev
```

Frontend kommer vara tillgänglig på: http://localhost:5173
Backend API på: http://localhost:3000

## Utveckling

### Köra endast backend
```bash
npm run dev:server
```

### Köra endast frontend
```bash
npm run dev:client
```

### Databas-kommandon
```bash
# Skapa ny migration
npm run db:migrate

# Seeda initial data
npm run db:seed

# Öppna Prisma Studio (GUI för databas)
npm run db:studio
```

## Projektstruktur

```
foodie/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── i18n/
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── package.json     # Root workspace
```

## API Dokumentation

### Recipes
- `GET /api/recipes` - Lista alla recept
- `GET /api/recipes/:id` - Hämta ett recept
- `POST /api/recipes` - Skapa nytt recept
- `PUT /api/recipes/:id` - Uppdatera recept
- `DELETE /api/recipes/:id` - Ta bort recept

### Meal Plans
- `GET /api/meal-plans?weekStart=YYYY-MM-DD` - Hämta måltidsplan
- `POST /api/meal-plans` - Lägg till måltid i planen
- `PUT /api/meal-plans/:id` - Uppdatera måltid
- `DELETE /api/meal-plans/:id` - Ta bort måltid från plan
- `PATCH /api/meal-plans/:id/cooked` - Markera som lagad

### Grocery List
- `GET /api/grocery-list?week=YYYY-MM-DD` - Hämta inköpslista för vecka

## Licens

Private - For personal use only
