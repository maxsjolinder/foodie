import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addDays, addWeeks, isSameWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  getMealPlans,
  getRecipes,
  getMealTypes,
  createMealPlan,
  deleteMealPlan,
  markMealAsCooked,
} from '../services/api';
import { MealPlan, Recipe, MealType } from '../services/types';

function PlanningPage() {
  const { t } = useTranslation();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; mealTypeId: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const [mealPlansData, recipesData, mealTypesData] = await Promise.all([
        getMealPlans(weekStartStr),
        getRecipes(),
        getMealTypes(),
      ]);
      setMealPlans(mealPlansData);
      setRecipes(recipesData);
      setMealTypes(mealTypesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const getMealForSlot = (date: Date, mealTypeId: number): MealPlan | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mealPlans.find(
      (mp) => mp.plannedDate === dateStr && mp.mealTypeId === mealTypeId
    );
  };

  const handleAddMeal = (date: Date, mealTypeId: number) => {
    setSelectedSlot({ date, mealTypeId });
    setShowRecipeSelector(true);
  };

  const handleSelectRecipe = async (recipeId: number) => {
    if (!selectedSlot) return;

    try {
      await createMealPlan({
        recipeId,
        mealTypeId: selectedSlot.mealTypeId,
        plannedDate: format(selectedSlot.date, 'yyyy-MM-dd'),
      });
      setShowRecipeSelector(false);
      setSelectedSlot(null);
      loadData();
    } catch (error) {
      console.error('Error creating meal plan:', error);
    }
  };

  const handleRemoveMeal = async (mealPlanId: number) => {
    try {
      await deleteMealPlan(mealPlanId);
      loadData();
    } catch (error) {
      console.error('Error removing meal:', error);
    }
  };

  const handleToggleCooked = async (mealPlan: MealPlan) => {
    try {
      await markMealAsCooked(mealPlan.id, !mealPlan.isCooked);
      loadData();
    } catch (error) {
      console.error('Error toggling cooked status:', error);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getDayName = (dayIndex: number): string => {
    const days = [
      t('planning.monday'),
      t('planning.tuesday'),
      t('planning.wednesday'),
      t('planning.thursday'),
      t('planning.friday'),
      t('planning.saturday'),
      t('planning.sunday'),
    ];
    return days[dayIndex];
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  // Generate 3 weeks of dates
  const weeks = [0, 1, 2].map((weekOffset) => {
    const weekStart = addWeeks(currentWeekStart, weekOffset);
    return Array.from({ length: 7 }, (_, dayIndex) => addDays(weekStart, dayIndex));
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('planning.title')}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← {t('planning.previousWeek')}
          </button>

          <button
            onClick={goToCurrentWeek}
            className="px-4 py-2 text-green-600 hover:text-green-700"
          >
            {t('planning.currentWeek')}
          </button>

          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t('planning.nextWeek')} →
          </button>
        </div>
      </div>

      {/* 3-Week Calendar */}
      <div className="space-y-8">
        {weeks.map((weekDays, weekIndex) => {
          const weekStart = weekDays[0];
          const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });

          return (
            <div key={weekIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div
                className={`px-4 py-2 font-semibold ${
                  isCurrentWeek ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {t('planning.week')} {format(weekStart, 'w', { locale: sv })} -{' '}
                {format(weekStart, 'd MMM', { locale: sv })} -{' '}
                {format(addDays(weekStart, 6), 'd MMM', { locale: sv })}
              </div>

              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((date, dayIndex) => (
                  <div key={dayIndex} className="min-h-[200px]">
                    <div className="p-2 bg-gray-50 border-b">
                      <div className="text-sm font-medium text-gray-700">
                        {getDayName(dayIndex)}
                      </div>
                      <div className="text-xs text-gray-500">{format(date, 'd/M')}</div>
                    </div>

                    <div className="p-2 space-y-2">
                      {mealTypes.map((mealType) => {
                        const meal = getMealForSlot(date, mealType.id);

                        return (
                          <div
                            key={mealType.id}
                            className="border rounded p-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="text-xs text-gray-500 mb-1">{mealType.name}</div>

                            {meal ? (
                              <div>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">
                                      {meal.recipe.name}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <button
                                        onClick={() => handleToggleCooked(meal)}
                                        className={`text-xs px-2 py-1 rounded ${
                                          meal.isCooked
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {meal.isCooked ? '✓ ' + t('planning.cooked') : t('planning.markCooked')}
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveMeal(meal.id)}
                                    className="text-red-500 hover:text-red-700 text-xs ml-2"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddMeal(date, mealType.id)}
                                className="text-xs text-green-600 hover:text-green-700"
                              >
                                + {t('planning.addMeal')}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Selector Modal */}
      {showRecipeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('planning.selectRecipe')}</h2>
              <button
                onClick={() => {
                  setShowRecipeSelector(false);
                  setSelectedSlot(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe.id)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-800">{recipe.name}</div>
                  {recipe.description && (
                    <div className="text-sm text-gray-600 mt-1">{recipe.description}</div>
                  )}
                  <div className="flex gap-2 text-xs text-gray-500 mt-2">
                    {recipe.prepTimeMinutes && <span>⏱️ {recipe.prepTimeMinutes}min</span>}
                    {recipe.cookTimeMinutes && <span>🔥 {recipe.cookTimeMinutes}min</span>}
                    <span>👥 {recipe.servings}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanningPage;
