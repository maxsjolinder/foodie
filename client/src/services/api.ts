import axios from 'axios';
import {
  Recipe,
  Ingredient,
  MealPlan,
  MealType,
  Unit,
  GroceryItem,
  CreateRecipeInput,
  CreateMealPlanInput,
  CreateIngredientInput,
} from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Recipes
export const getRecipes = async (): Promise<Recipe[]> => {
  const response = await api.get('/recipes');
  return response.data;
};

export const getRecipe = async (id: number): Promise<Recipe> => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (data: CreateRecipeInput): Promise<Recipe> => {
  const response = await api.post('/recipes', data);
  return response.data;
};

export const updateRecipe = async (id: number, data: CreateRecipeInput): Promise<Recipe> => {
  const response = await api.put(`/recipes/${id}`, data);
  return response.data;
};

export const deleteRecipe = async (id: number): Promise<void> => {
  await api.delete(`/recipes/${id}`);
};

// Ingredients
export const getIngredients = async (): Promise<Ingredient[]> => {
  const response = await api.get('/ingredients');
  return response.data;
};

export const createIngredient = async (data: CreateIngredientInput): Promise<Ingredient> => {
  const response = await api.post('/ingredients', data);
  return response.data;
};

export const updateIngredient = async (id: number, data: CreateIngredientInput): Promise<Ingredient> => {
  const response = await api.put(`/ingredients/${id}`, data);
  return response.data;
};

export const deleteIngredient = async (id: number): Promise<void> => {
  await api.delete(`/ingredients/${id}`);
};

// Meal Plans
export const getMealPlans = async (weekStart: string): Promise<MealPlan[]> => {
  const response = await api.get('/meal-plans', {
    params: { weekStart },
  });
  return response.data;
};

export const createMealPlan = async (data: CreateMealPlanInput): Promise<MealPlan> => {
  const response = await api.post('/meal-plans', data);
  return response.data;
};

export const updateMealPlan = async (id: number, data: CreateMealPlanInput): Promise<MealPlan> => {
  const response = await api.put(`/meal-plans/${id}`, data);
  return response.data;
};

export const markMealAsCooked = async (id: number, isCooked: boolean): Promise<MealPlan> => {
  const response = await api.patch(`/meal-plans/${id}/cooked`, { isCooked });
  return response.data;
};

export const deleteMealPlan = async (id: number): Promise<void> => {
  await api.delete(`/meal-plans/${id}`);
};

// Meal Types
export const getMealTypes = async (): Promise<MealType[]> => {
  const response = await api.get('/meal-types');
  return response.data;
};

// Units
export const getUnits = async (): Promise<Unit[]> => {
  const response = await api.get('/units');
  return response.data;
};

// Grocery List
export const getGroceryList = async (week: string): Promise<GroceryItem[]> => {
  const response = await api.get('/grocery-list', {
    params: { week },
  });
  return response.data;
};

export default api;
