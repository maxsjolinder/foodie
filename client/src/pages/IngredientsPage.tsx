import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getIngredients, getUnits, createIngredient, updateIngredient, deleteIngredient } from '../services/api';
import { Ingredient, Unit } from '../services/types';

function IngredientsPage() {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({ name: '', defaultUnitId: 0 });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, formData);
      } else {
        await createIngredient(formData);
      }
      setFormData({ name: '', defaultUnitId: 0 });
      setEditingIngredient(null);
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      defaultUnitId: ingredient.defaultUnitId,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIngredient(null);
    setFormData({ name: '', defaultUnitId: 0 });
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
          onClick={() => {
            if (showForm && !editingIngredient) {
              setShowForm(false);
            } else {
              setEditingIngredient(null);
              setFormData({ name: '', defaultUnitId: 0 });
              setShowForm(!showForm);
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm && !editingIngredient ? t('common.close') : t('ingredients.createNew')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingIngredient ? t('ingredients.edit') : t('ingredients.createNew')}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ingredients.name')}
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
                  {t('ingredients.defaultUnit')}
                </label>
                <select
                  value={formData.defaultUnitId}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultUnitId: parseInt(e.target.value) })
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
                onClick={handleCancel}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ingredient)}
                    className="text-green-600 hover:text-green-800 px-3 py-1 border border-green-300 rounded hover:bg-green-50"
                  >
                    {t('ingredients.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(ingredient.id)}
                    className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                  >
                    {t('ingredients.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IngredientsPage;
