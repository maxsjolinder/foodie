export interface Unit {
  id: number;
  name: string;
  displayName: string;
  unitType: string;
  conversionToBase: number;
  createdAt: string;
}

export interface Ingredient {
  id: number;
  name: string;
  defaultUnit: Unit;
  defaultUnitId: number;
  createdAt: string;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  ingredientId: number;
  ingredient: Ingredient;
  quantity: number;
  unit: Unit;
  unitId: number;
  createdAt: string;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  instructions?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface MealType {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface MealPlan {
  id: number;
  recipeId: number;
  recipe: Recipe;
  mealTypeId: number;
  mealType: MealType;
  plannedDate: string;
  weekNumber: number;
  year: number;
  isCooked: boolean;
  cookedAt?: string;
  createdAt: string;
}

export interface GroceryItem {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitDisplayName: string;
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  instructions?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings: number;
  ingredients: {
    ingredientId: number;
    quantity: number;
    unitId: number;
  }[];
}

export interface CreateMealPlanInput {
  recipeId: number;
  mealTypeId: number;
  plannedDate: string;
}

export interface CreateIngredientInput {
  name: string;
  defaultUnitId: number;
}
