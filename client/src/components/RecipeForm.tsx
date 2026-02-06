import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ingredient, Unit, Recipe } from '../services/types';

interface RecipeIngredientInput {
  ingredientId: number;
  quantity: number;
  unitId: number;
}

interface RecipeFormProps {
  ingredients: Ingredient[];
  units: Unit[];
  recipe?: Recipe;
  onSubmit: (data: {
    name: string;
    description: string;
    instructions: string;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    ingredients: RecipeIngredientInput[];
  }) => Promise<void>;
  onCancel: () => void;
}

function RecipeForm({ ingredients, units, recipe, onSubmit, onCancel }: RecipeFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    description: recipe?.description || '',
    instructions: recipe?.instructions || '',
    prepTimeMinutes: recipe?.prepTimeMinutes || 0,
    cookTimeMinutes: recipe?.cookTimeMinutes || 0,
    servings: recipe?.servings || 2,
  });

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientInput[]>(
    recipe?.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      quantity: ri.quantity,
      unitId: ri.unitId,
    })) || []
  );

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: 0, quantity: 0, unitId: 0 }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredientInput, value: number) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      ingredients: recipeIngredients,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('recipes.name')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('recipes.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('recipes.prepTime')}
            </label>
            <input
              type="number"
              value={formData.prepTimeMinutes}
              onChange={(e) => setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('recipes.cookTime')}
            </label>
            <input
              type="number"
              value={formData.cookTimeMinutes}
              onChange={(e) => setFormData({ ...formData, cookTimeMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('recipes.servings')}
            </label>
            <input
              type="number"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('recipes.instructions')}
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={5}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('recipes.ingredients')}
            </label>
            <button
              type="button"
              onClick={addIngredient}
              className="text-sm text-green-600 hover:text-green-700"
            >
              + {t('recipes.addIngredient')}
            </button>
          </div>

          <div className="space-y-2">
            {recipeIngredients.map((ri, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={ri.ingredientId}
                  onChange={(e) => updateIngredient(index, 'ingredientId', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value={0}>Välj ingrediens</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={ri.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                  placeholder={t('recipes.quantity')}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <select
                  value={ri.unitId}
                  onChange={(e) => updateIngredient(index, 'unitId', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value={0}>Enhet</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </form>
  );
}

export default RecipeForm;
