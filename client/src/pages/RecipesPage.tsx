import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getRecipes, getIngredients, getUnits, createRecipe, updateRecipe, deleteRecipe } from '../services/api';
import { Recipe, Ingredient, Unit } from '../services/types';
import RecipeForm from '../components/RecipeForm';
import PhotoRecipeUpload from '../components/PhotoRecipeUpload';

function RecipesPage() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipesData, ingredientsData, unitsData] = await Promise.all([
        getRecipes(),
        getIngredients(),
        getUnits(),
      ]);
      setRecipes(recipesData);
      setIngredients(ingredientsData);
      setUnits(unitsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedRecipe) {
        await updateRecipe(selectedRecipe.id, data);
      } else {
        await createRecipe(data);
      }
      setShowForm(false);
      setSelectedRecipe(null);
      setExtractedData(null);
      loadData(); // This will reload both recipes AND ingredients
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('recipes.deleteConfirm'))) {
      try {
        await deleteRecipe(id);
        loadData();
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  const handlePhotoExtracted = async (data: any) => {
    setShowPhotoUpload(false);
    setExtractedData(data);
    setSelectedRecipe(null);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('recipes.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setExtractedData(null);
              setSelectedRecipe(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {t('recipes.createNew')}
          </button>
          <button
            onClick={() => setShowPhotoUpload(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            📷 Skapa från foto
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedRecipe ? t('recipes.edit') : t('recipes.createNew')}
          </h2>
          <RecipeForm
            ingredients={ingredients}
            units={units}
            recipe={selectedRecipe || undefined}
            initialData={extractedData}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedRecipe(null);
              setExtractedData(null);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            {t('recipes.noRecipes')}
          </div>
        ) : (
          recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{recipe.name}</h3>
                {recipe.description && (
                  <p className="text-gray-600 text-sm mb-3">{recipe.description}</p>
                )}

                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  {recipe.prepTimeMinutes && (
                    <span>⏱️ {recipe.prepTimeMinutes} min</span>
                  )}
                  {recipe.cookTimeMinutes && (
                    <span>🔥 {recipe.cookTimeMinutes} min</span>
                  )}
                  <span>👥 {recipe.servings}</span>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {t('recipes.ingredients')}:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {recipe.ingredients.slice(0, 3).map((ri) => (
                      <li key={ri.id}>
                        {ri.quantity} {ri.unit.name} {ri.ingredient.name}
                      </li>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <li className="text-gray-400">+ {recipe.ingredients.length - 3} till</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(recipe)}
                    className="flex-1 text-center text-green-600 hover:text-green-800 text-sm py-2 border border-green-300 rounded hover:bg-green-50"
                  >
                    {t('recipes.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="flex-1 text-center text-red-600 hover:text-red-800 text-sm py-2 border border-red-300 rounded hover:bg-red-50"
                  >
                    {t('recipes.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showPhotoUpload && (
        <PhotoRecipeUpload
          onExtracted={handlePhotoExtracted}
          onCancel={() => setShowPhotoUpload(false)}
        />
      )}
    </div>
  );
}

export default RecipesPage;
