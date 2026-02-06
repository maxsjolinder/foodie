import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RecipesPage from './pages/RecipesPage';
import PlanningPage from './pages/PlanningPage';
import GroceryPage from './pages/GroceryPage';
import IngredientsPage from './pages/IngredientsPage';

function App() {
  const { t } = useTranslation();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-green-600">🍽️ {t('app.title')}</h1>
              </div>
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-100"
                >
                  {t('nav.planning')}
                </Link>
                <Link
                  to="/recipes"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-100"
                >
                  {t('nav.recipes')}
                </Link>
                <Link
                  to="/grocery"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-100"
                >
                  {t('nav.grocery')}
                </Link>
                <Link
                  to="/ingredients"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-100"
                >
                  {t('nav.ingredients')}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<PlanningPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/grocery" element={<GroceryPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
