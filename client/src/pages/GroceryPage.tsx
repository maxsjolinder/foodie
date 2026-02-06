import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { getGroceryList } from '../services/api';
import { GroceryItem } from '../services/types';

function GroceryPage() {
  const { t } = useTranslation();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroceryList();
  }, [currentWeekStart]);

  const loadGroceryList = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const data = await getGroceryList(weekStartStr);
      setGroceryList(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading grocery list:', error);
      setLoading(false);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('grocery.title')}</h1>
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 print:hidden"
        >
          🖨️ {t('grocery.print')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← {t('planning.previousWeek')}
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('grocery.week')} {format(currentWeekStart, 'w', { locale: sv })}
            </h2>
            <p className="text-gray-600 text-sm">
              {format(currentWeekStart, 'd MMM', { locale: sv })} -{' '}
              {format(addWeeks(currentWeekStart, 1), 'd MMM yyyy', { locale: sv })}
            </p>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-green-600 hover:text-green-700 mt-1"
            >
              {t('planning.currentWeek')}
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t('planning.nextWeek')} →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 print:text-2xl">
          Inköpslista - Vecka {format(currentWeekStart, 'w', { locale: sv })}
        </h2>

        {groceryList.length === 0 ? (
          <div className="text-center text-gray-500 py-8">{t('grocery.noItems')}</div>
        ) : (
          <div className="space-y-3">
            {groceryList.map((item) => (
              <div
                key={item.ingredientId}
                className="flex justify-between items-center border-b pb-2 print:py-1"
              >
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 print:hidden"
                  />
                  <span className="text-gray-800">{item.ingredientName}</span>
                </label>
                <span className="font-medium text-gray-700">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.rounded-lg.shadow-md.p-6,
          .bg-white.rounded-lg.shadow-md.p-6 * {
            visibility: visible;
          }
          .bg-white.rounded-lg.shadow-md.p-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default GroceryPage;
