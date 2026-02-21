import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getIngredients, getUnits, createIngredient, deleteIngredient } from '../services/api';
import { Ingredient, Unit } from '../services/types';

function IngredientsPage() {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', defaultUnitId: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ingredientsData, unitsData] = await Promise.all([getIngredients(), getUnits()]);
      setIngredients(ingredientsData);
      setUnits(unitsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIngredient(newIngredient);
      setNewIngredient({ name: '', defaultUnitId: 0 });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating ingredient:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('ingredients.deleteConfirm'))) {
      try {
        await deleteIngredient(id);
        loadData();
      } catch (error: any) {
        console.error('Error deleting ingredient:', error);
        // Display error message to user
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ett fel uppstod vid borttagning av ingrediens';
        alert(errorMessage);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('ingredients.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm ? t('common.close') : t('ingredients.createNew')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ingredients.name')}
                </label>
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ingredients.defaultUnit')}
                </label>
                <select
                  value={newIngredient.defaultUnitId}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, defaultUnitId: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value={0}>Välj enhet</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.displayName} ({unit.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        {ingredients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('ingredients.noIngredients')}</div>
        ) : (
          <div className="divide-y">
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <h3 className="font-medium text-gray-800">{ingredient.name}</h3>
                  <p className="text-sm text-gray-500">
                    {ingredient.defaultUnit.displayName} ({ingredient.defaultUnit.name})
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(ingredient.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  {t('ingredients.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IngredientsPage;
