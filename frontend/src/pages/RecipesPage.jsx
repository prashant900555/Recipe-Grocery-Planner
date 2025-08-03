import React, { useEffect, useState, useCallback } from "react";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeServings, // NEW import
} from "../services/recipeService";
import {
  generateFromRecipes,
  getGroceryLists,
} from "../services/groceryListService";
import RecipeForm from "../components/RecipeForm";
import { useNavigate } from "react-router-dom";

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Unit conversion utility functions
const convertUnits = (quantity, unit) => {
  const num = parseFloat(quantity);
  if (isNaN(num) || num === 0) return `${quantity} ${unit}`;

  // Weight conversions
  if (unit === "g" && num >= 1000) {
    return `${(num / 1000).toFixed(2)} kg`;
  }
  if (unit === "kg" && num < 1) {
    return `${(num * 1000).toFixed(2)} g`;
  }

  // Volume conversions
  if (unit === "ml" && num >= 1000) {
    return `${(num / 1000).toFixed(2)} l`;
  }
  if (unit === "l" && num < 1) {
    return `${(num * 1000).toFixed(2)} ml`;
  }

  // Other conversions
  if (unit === "oz" && num >= 16) {
    return `${(num / 16).toFixed(2)} lb`;
  }
  if (unit === "tsp" && num >= 3) {
    return `${(num / 3).toFixed(2)} tbsp`;
  }
  if (unit === "tbsp" && num >= 16) {
    return `${(num / 16).toFixed(2)} cup`;
  }

  return `${num.toFixed(2)} ${unit}`;
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [error, setError] = useState();
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [hasActiveGroceryList, setHasActiveGroceryList] = useState(false);
  const [servingsUpdateQueue, setServingsUpdateQueue] = useState({}); // Track pending updates
  const navigate = useNavigate();

  const fetchAllRecipes = async () => {
    setLoading(true);
    try {
      const fetchedRecipes = await getRecipes();
      setRecipes(fetchedRecipes);
      setError();
    } catch {
      setError("Failed to fetch recipes.");
    } finally {
      setLoading(false);
    }
  };

  // Check for any active (not purchased) grocery list
  const checkActiveGroceryList = async () => {
    try {
      const lists = await getGroceryLists();
      setHasActiveGroceryList(lists.some((l) => !l.completed));
    } catch {
      setHasActiveGroceryList(false);
    }
  };

  // Debounced function to update servings and scale quantities in backend
  const debouncedUpdateServings = useCallback(
    debounce(async (recipeId, servings) => {
      try {
        await updateRecipeServings(recipeId, servings);

        // Refresh recipes to get updated quantities from database
        await fetchAllRecipes();

        // Remove from pending updates queue
        setServingsUpdateQueue((prev) => {
          const newQueue = { ...prev };
          delete newQueue[recipeId];
          return newQueue;
        });

        console.log(
          `Successfully updated servings and quantities for recipe ${recipeId} to ${servings}`
        );
      } catch (error) {
        console.error("Failed to update servings:", error);
        setError(`Failed to save servings update for recipe ${recipeId}`);

        // Remove from pending updates queue on error too
        setServingsUpdateQueue((prev) => {
          const newQueue = { ...prev };
          delete newQueue[recipeId];
          return newQueue;
        });
      }
    }, 2000), // 2-second delay
    []
  );

  useEffect(() => {
    fetchAllRecipes();
    checkActiveGroceryList();
  }, []);

  async function handleCreate(data) {
    try {
      await createRecipe(data);
      setShowForm(false);
      fetchAllRecipes();
    } catch {
      setError("Failed to create recipe.");
    }
  }

  async function handleUpdate(data) {
    try {
      await updateRecipe(data.id, data);
      setShowForm(false);
      setEditRecipe(null);
      fetchAllRecipes();
    } catch {
      setError("Failed to update recipe.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this recipe?")) return;
    try {
      await deleteRecipe(id);
      fetchAllRecipes();
    } catch {
      setError("Failed to delete recipe.");
    }
  }

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleServingsChange(recipeId, newServings) {
    const parsedServings = parseInt(newServings) || 1;

    // Track pending update
    setServingsUpdateQueue((prev) => ({
      ...prev,
      [recipeId]: parsedServings,
    }));

    // Debounced backend update (this will scale quantities in database)
    debouncedUpdateServings(recipeId, parsedServings);
  }

  async function handleGenerateList() {
    if (!selected.length) {
      setError("Select at least one recipe to generate the grocery list.");
      return;
    }
    setGenerating(true);
    setError();
    try {
      // Use today's date in DD-MM-YYYY
      const dateStr = todayDDMMYYYY();
      const firstId = selected[0];
      const dynamicName = `Recipe_${dateStr}_${firstId}`;
      await generateFromRecipes(selected, dynamicName, dateStr);
      setGenerating(false);
      navigate("/grocerylists");
    } catch (e) {
      let message = "Failed to generate grocery list.";
      if (e.response?.data) {
        if (typeof e.response.data === "string") message = e.response.data;
        else if (e.response.data.message) message = e.response.data.message;
        else message = JSON.stringify(e.response.data);
      } else if (e.message) {
        message = e.message;
      }
      setError(message);
      setGenerating(false);
    }
  }

  function todayDDMMYYYY() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  // Re-check for an active grocery list whenever selection or form opens
  useEffect(() => {
    checkActiveGroceryList();
  }, [selected, showForm]);

  return (
    <section className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        onClick={() => navigate("/")}
      >
        Back to Home
      </button>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-blue-800">Recipes</h2>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
          onClick={() => {
            setShowForm(true);
            setEditRecipe(null);
          }}
        >
          Add Recipe
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {/* Selection and Generate */}
      <div className="mb-6 border p-4 rounded bg-blue-50 flex flex-wrap items-center gap-3">
        <span className="font-semibold mr-2">
          Select recipes to generate a grocery list
        </span>
        <button
          className="px-3 py-1 bg-green-700 text-white rounded"
          onClick={handleGenerateList}
          disabled={generating || selected.length === 0 || hasActiveGroceryList}
        >
          {generating ? "Generating..." : "Generate Grocery List"}
        </button>
        {hasActiveGroceryList && (
          <span className="ml-2 px-2 py-1 text-sm bg-red-100 text-red-700 rounded">
            You must first mark your current active grocery list as purchased
            before creating another.
          </span>
        )}
      </div>
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
              <th className="py-3 px-4 text-left font-bold">Select</th>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4 text-left font-bold">Description</th>
              <th className="py-3 px-4 text-left font-bold">Servings</th>
              <th className="py-3 px-4 text-left font-bold">Ingredients</th>
              <th className="py-3 px-4 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : recipes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No recipes found.
                </td>
              </tr>
            ) : (
              recipes.map((rec, idx) => {
                const hasPendingUpdate = servingsUpdateQueue[rec.id];
                const displayServings = hasPendingUpdate || rec.servings || 1;

                return (
                  <tr key={rec.id} className="hover:bg-blue-50 transition">
                    <td className="py-2 px-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(rec.id)}
                        onChange={() => toggleSelect(rec.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-2 px-4 capitalize font-medium">
                      {rec.name}
                    </td>
                    <td className="py-2 px-4">{rec.description}</td>
                    <td className="py-2 px-4 relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className={`border border-gray-300 rounded px-2 py-1 w-16 text-center ${
                          hasPendingUpdate
                            ? "bg-yellow-50 border-yellow-300"
                            : ""
                        }`}
                        value={displayServings}
                        onChange={(e) =>
                          handleServingsChange(rec.id, e.target.value)
                        }
                        title={
                          hasPendingUpdate
                            ? "Updating quantities..."
                            : "Change servings"
                        }
                      />
                      {hasPendingUpdate && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {rec.ingredients && rec.ingredients.length > 0 ? (
                        <div className="space-y-2">
                          <table className="min-w-full text-xs border border-gray-200 rounded">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-2 py-1 text-left font-semibold">
                                  Ingredient
                                </th>
                                <th className="px-2 py-1 text-left font-semibold">
                                  Qty
                                </th>
                                <th className="px-2 py-1 text-left font-semibold">
                                  Unit
                                </th>
                                <th className="px-2 py-1 text-left font-semibold">
                                  Note
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {rec.ingredients.map((ri) =>
                                ri.ingredient ? (
                                  <tr
                                    key={ri.id + Math.random()}
                                    className="border-t border-gray-100"
                                  >
                                    <td className="px-2 py-1 font-medium">
                                      {ri.ingredient.name}
                                    </td>
                                    <td className="px-2 py-1">
                                      {
                                        convertUnits(
                                          ri.quantity,
                                          ri.unit
                                        ).split(" ")[0]
                                      }
                                    </td>
                                    <td className="px-2 py-1">
                                      {convertUnits(ri.quantity, ri.unit)
                                        .split(" ")
                                        .slice(1)
                                        .join(" ")}
                                    </td>
                                    <td className="px-2 py-1 text-gray-600">
                                      {ri.note ? `(${ri.note})` : "-"}
                                    </td>
                                  </tr>
                                ) : null
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="text-gray-400">No ingredients</span>
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
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                        onClick={() => handleDelete(rec.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
