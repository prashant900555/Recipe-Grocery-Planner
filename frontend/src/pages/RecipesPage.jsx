import React, { useEffect, useState } from "react";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../services/recipeService";
import RecipeForm from "../components/RecipeForm";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [error, setError] = useState();

  const fetchAll = async () => {
    setLoading(true);
    try {
      setRecipes(await getRecipes());
      setError();
    } catch {
      setError("Failed to fetch recipes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleCreate(data) {
    try {
      await createRecipe(data);
      setShowForm(false);
      fetchAll();
    } catch {
      setError("Failed to create recipe.");
    }
  }

  async function handleUpdate(data) {
    try {
      await updateRecipe(data.id, data);
      setShowForm(false);
      setEditRecipe(null);
      fetchAll();
    } catch {
      setError("Failed to update recipe.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this recipe?")) return;
    try {
      await deleteRecipe(id);
      fetchAll();
    } catch {
      setError("Failed to delete recipe.");
    }
  }

  return (
    <section className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-blue-800">Recipes</h2>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
          onClick={() => {
            setShowForm(true);
            setEditRecipe(null);
          }}
        >
          + Add Recipe
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-10">
          <RecipeForm
            initialData={editRecipe}
            onSubmit={editRecipe ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditRecipe(null);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm rounded-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left font-bold">#</th>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4 text-left font-bold">Description</th>
              <th className="py-3 px-4 text-left font-bold">Ingredients</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : recipes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No recipes found.
                </td>
              </tr>
            ) : (
              recipes.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-blue-50 transition">
                  <td className="py-2 px-4">{idx + 1}</td>
                  <td className="py-2 px-4 capitalize">{rec.name}</td>
                  <td className="py-2 px-4">{rec.description}</td>
                  <td className="py-2 px-4">
                    {rec.ingredients && rec.ingredients.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {rec.ingredients.map((ri) =>
                          ri.ingredient ? (
                            <li key={ri.id || ri.ingredient.id}>
                              {ri.quantity} {ri.ingredient.unit}{" "}
                              {ri.ingredient.name}
                              {ri.note ? ` (${ri.note})` : ""}
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        setEditRecipe(rec);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(rec.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
