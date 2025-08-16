import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import LoadingPage from "./pages/LoadingPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import IngredientsPage from "./pages/IngredientsPage";
import RecipesPage from "./pages/RecipesPage";
import MealPlansPage from "./pages/MealPlansPage";
import GroceryListsPage from "./pages/GroceryListsPage";

function AppContent() {
  const { user, loading, isAuthenticated, logout } = useUser();

  // Show loading screen
  if (loading) {
    return <LoadingPage />;
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Main authenticated app
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-blue-700 text-white px-6 py-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "font-bold underline"
                  : "hover:underline transition-all"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/ingredients"
              className={({ isActive }) =>
                isActive
                  ? "font-bold underline"
                  : "hover:underline transition-all"
              }
            >
              Ingredients
            </NavLink>
            <NavLink
              to="/recipes"
              className={({ isActive }) =>
                isActive
                  ? "font-bold underline"
                  : "hover:underline transition-all"
              }
            >
              Recipes
            </NavLink>
            <NavLink
              to="/mealplans"
              className={({ isActive }) =>
                isActive
                  ? "font-bold underline"
                  : "hover:underline transition-all"
              }
            >
              Meal Plans
            </NavLink>
            <NavLink
              to="/grocerylists"
              className={({ isActive }) =>
                isActive
                  ? "font-bold underline"
                  : "hover:underline transition-all"
              }
            >
              Grocery Lists
            </NavLink>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="opacity-75">Welcome,</span>
              <span className="font-semibold ml-1">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 bg-blue-800 hover:bg-blue-900 rounded transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/mealplans" element={<MealPlansPage />} />
          <Route path="/grocerylists" element={<GroceryListsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
