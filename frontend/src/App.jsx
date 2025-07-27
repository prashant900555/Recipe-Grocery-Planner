import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./pages/HomePage";
import IngredientsPage from "./pages/IngredientsPage";
import RecipesPage from "./pages/RecipesPage";
import MealPlansPage from "./pages/MealPlansPage";
import GroceryListsPage from "./pages/GroceryListsPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-blue-700 text-white px-6 py-4 flex flex-wrap gap-4 shadow">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Home
        </NavLink>
        <NavLink
          to="/ingredients"
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Ingredients
        </NavLink>
        <NavLink
          to="/recipes"
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Recipes
        </NavLink>
        <NavLink
          to="/mealplans"
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Meal Plans
        </NavLink>
        <NavLink
          to="/grocerylists"
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Grocery Lists
        </NavLink>
      </nav>
      <main className="flex-1 bg-gray-50 p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ingredients/*" element={<IngredientsPage />} />
          <Route path="/recipes/*" element={<RecipesPage />} />
          <Route path="/mealplans/*" element={<MealPlansPage />} />
          <Route path="/grocerylists/*" element={<GroceryListsPage />} />
        </Routes>
      </main>
    </div>
  );
}
