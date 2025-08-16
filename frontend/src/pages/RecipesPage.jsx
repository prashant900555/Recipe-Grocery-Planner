import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeServings,
  setAllRecipesDefaultServings,
} from "../services/recipeService";
import { generateFromRecipes } from "../services/groceryListService";
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
  if (isNaN(num) || num <= 0) return `${quantity} ${unit}`;

  const formatNumber = (value) => {
    if (value < 1 && value > 0) return value;
    return Number(value.toFixed(2)).toString();
  };

  if (unit === "g" && num >= 1000) return `${formatNumber(num / 1000)} kg`;
  if (unit === "kg" && num < 1) return `${formatNumber(num * 1000)} g`;
  if (unit === "ml" && num >= 1000) return `${formatNumber(num / 1000)} l`;
  if (unit === "l" && num < 1) return `${formatNumber(num * 1000)} ml`;
  if (unit === "oz" && num >= 16) return `${formatNumber(num / 16)} lb`;
  if (unit === "tsp" && num >= 3) return `${formatNumber(num / 3)} tbsp`;
  if (unit === "tbsp" && num >= 16) return `${formatNumber(num / 16)} cup`;

  return `${formatNumber(num)} ${unit}`;
};

export default function RecipesPage() {
  // Initialize all state properly to avoid undefined errors
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [servingsUpdateQueue, setServingsUpdateQueue] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [settingDefaultServings, setSettingDefaultServings] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchAllRecipes = async () => {
    setLoading(true);
    try {
      const fetchedRecipes = await getRecipes();
      // Ensure we always set an array, even if API returns null/undefined
      setRecipes(Array.isArray(fetchedRecipes) ? fetchedRecipes : []);
      setError("");
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("Failed to fetch recipes.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced function to update servings and scale quantities in backend
  const debouncedUpdateServings = useCallback(
    debounce(async (recipeId, servings) => {
      try {
        await updateRecipeServings(recipeId, servings);
        const updatedRecipes = await getRecipes();
        const updatedRecipe = updatedRecipes.find((r) => r.id === recipeId);
        if (updatedRecipe) {
          setRecipes((prev) =>
            prev.map((recipe) =>
              recipe.id === recipeId ? updatedRecipe : recipe
            )
          );
        }
        setServingsUpdateQueue((prev) => {
          const newQueue = { ...prev };
          delete newQueue[recipeId];
          return newQueue;
        });
      } catch (error) {
        console.error("Error updating servings:", error);
        setError(`Failed to save servings update for recipe ${recipeId}`);
        setServingsUpdateQueue((prev) => {
          const newQueue = { ...prev };
          delete newQueue[recipeId];
          return newQueue;
        });
      }
    }, 2000),
    []
  );

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  // Debounced search - filter recipes by name
  const debouncedSearch = useCallback(
    debounce((term, recipesData) => {
      const f = !term
        ? recipesData
        : recipesData.filter((r) =>
            r.name.toLowerCase().includes(term.toLowerCase())
          );
      setFilteredRecipes(Array.isArray(f) ? f : []);
    }, 250),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm, recipes);
  }, [searchTerm, recipes, debouncedSearch]);

  useEffect(() => {
    setFilteredRecipes(Array.isArray(recipes) ? recipes : []);
  }, [recipes]);

  async function handleCreate(data) {
    try {
      const newRecipe = await createRecipe(data);
      setRecipes((prev) => [...prev, newRecipe]);
      setShowForm(false);
    } catch (err) {
      console.error("Error creating recipe:", err);
      setError("Failed to create recipe.");
    }
  }

  async function handleUpdate(data) {
    try {
      const updatedRecipe = await updateRecipe(data.id, data);
      setRecipes((prev) =>
        prev.map((recipe) => (recipe.id === data.id ? updatedRecipe : recipe))
      );
      setShowForm(false);
      setEditRecipe(null);
    } catch (err) {
      console.error("Error updating recipe:", err);
      setError("Failed to update recipe.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this recipe?")) return;
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
    } catch (err) {
      console.error("Error deleting recipe:", err);
      setError("Failed to delete recipe.");
    }
  }

  async function handleDeleteSelected() {
    if (!selected.length) {
      setError("Select recipes to delete.");
      return;
    }

    if (!window.confirm(`Delete ${selected.length} selected recipes?`)) return;

    setDeleting(true);
    try {
      for (const id of selected) {
        await deleteRecipe(id);
      }
      setRecipes((prev) =>
        prev.filter((recipe) => !selected.includes(recipe.id))
      );
      setSelected([]);
      setError("");
    } catch (err) {
      console.error("Error deleting selected recipes:", err);
      setError("Failed to delete selected recipes.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (!Array.isArray(filteredRecipes)) return;

    if (
      filteredRecipes.every((r) => selected.includes(r.id)) &&
      filteredRecipes.length > 0
    ) {
      setSelected((prev) =>
        prev.filter((id) => !filteredRecipes.some((r) => r.id === id))
      );
    } else {
      setSelected((prev) => [
        ...prev,
        ...filteredRecipes.map((r) => r.id).filter((id) => !prev.includes(id)),
      ]);
    }
  }

  function handleServingsChange(recipeId, newServings) {
    const parsedServings = parseInt(newServings) || 1;
    setServingsUpdateQueue((prev) => ({
      ...prev,
      [recipeId]: parsedServings,
    }));
    debouncedUpdateServings(recipeId, parsedServings);
  }

  async function handleSetDefaultServings(recipeId) {
    try {
      await updateRecipeServings(recipeId, 2);
      const updatedRecipes = await getRecipes();
      const updatedRecipe = updatedRecipes.find((r) => r.id === recipeId);
      if (updatedRecipe) {
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === recipeId ? updatedRecipe : recipe
          )
        );
      }
    } catch (err) {
      console.error("Error setting default servings:", err);
      setError(`Failed to set default servings for recipe ${recipeId}`);
    }
  }

  async function handleSetAllDefaultServings() {
    if (
      !window.confirm(
        "Set all recipes to 2 servings? This will update ingredient quantities accordingly."
      )
    ) {
      return;
    }

    setSettingDefaultServings(true);
    setError("");
    try {
      await setAllRecipesDefaultServings();
      await fetchAllRecipes();
    } catch (e) {
      console.error("Error setting default servings for all recipes:", e);
      let message = "Failed to set default servings for all recipes.";
      if (e.response?.data) {
        if (typeof e.response.data === "string") message = e.response.data;
        else if (e.response.data.message) message = e.response.data.message;
        else message = JSON.stringify(e.response.data);
      } else if (e.message) {
        message = e.message;
      }
      setError(message);
    } finally {
      setSettingDefaultServings(false);
    }
  }

  async function handleGenerateList() {
    if (!selected.length) {
      setError("Select at least one recipe to generate the grocery list.");
      return;
    }

    setGenerating(true);
    setError("");
    try {
      const dateStr = todayDDMMYYYY();
      const firstId = selected[0];
      const dynamicName = `Recipe-${dateStr}-${firstId}`;
      await generateFromRecipes(selected, dynamicName, dateStr);
      setGenerating(false);
      navigate("/grocerylists");
    } catch (e) {
      console.error("Error generating grocery list:", e);
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

  function handleRowClick(rec, evt) {
    if (
      evt.target.closest(".ingredients-cell") ||
      evt.target.closest(".actions-cell") ||
      evt.target.tagName === "INPUT" ||
      evt.target.tagName === "BUTTON" ||
      evt.target.tagName === "SELECT"
    ) {
      return;
    }
    toggleSelect(rec.id);
  }

  return (
    <section className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        onClick={() => navigate("/")}
      >
        ← Back to Home
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
          + Add Recipe
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex mb-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-base mr-2"
          placeholder="Search recipe name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Selection and Generate */}
      <div className="mb-6 border p-4 rounded bg-blue-50 flex flex-wrap items-center gap-3">
        <span className="font-semibold mr-2">
          Select recipes to generate a grocery list:
        </span>
        <button
          className="px-3 py-1 bg-green-700 text-white rounded"
          onClick={handleGenerateList}
          disabled={generating || selected.length === 0}
        >
          {generating ? "Generating..." : "Generate Grocery List"}
        </button>
        <button
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
          onClick={handleSetAllDefaultServings}
          disabled={settingDefaultServings}
        >
          {settingDefaultServings
            ? "Setting..."
            : "Set All to Default Servings"}
        </button>
        <button
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleDeleteSelected}
          disabled={deleting || selected.length === 0}
        >
          {deleting ? "Deleting..." : "Delete Selected Recipes"}
        </button>
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
              <th className="py-3 px-4 text-left font-bold">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(filteredRecipes) &&
                    filteredRecipes.length > 0 &&
                    filteredRecipes.every((r) => selected.includes(r.id))
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  title="Select all"
                />
              </th>
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
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : !Array.isArray(filteredRecipes) ||
              filteredRecipes.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No recipes found.
                </td>
              </tr>
            ) : (
              filteredRecipes.map((rec) => {
                const hasPendingUpdate = servingsUpdateQueue[rec.id];
                const displayServings = hasPendingUpdate || rec.servings || 1;
                return (
                  <tr
                    key={rec.id} // FIXED: Unique key prop
                    className="hover:bg-blue-50 transition cursor-pointer"
                    onClick={(evt) => handleRowClick(rec, evt)}
                  >
                    <td className="py-2 px-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(rec.id)}
                        onChange={() => toggleSelect(rec.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-2 px-4 font-medium">{rec.name}</td>
                    <td className="py-2 px-4 text-gray-600">
                      {rec.description || "-"}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="border border-gray-300 rounded px-2 py-1 w-16"
                          value={displayServings}
                          onChange={(e) =>
                            handleServingsChange(rec.id, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleSetDefaultServings(rec.id);
                          }}
                          title="Set to 2 servings"
                        >
                          Default
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-4 ingredients-cell">
                      {rec.ingredients && rec.ingredients.length > 0 ? (
                        <div className="max-w-xs overflow-hidden">
                          <table className="w-full text-xs">
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
                                    key={`${rec.id}-${ri.id || Math.random()}`} // FIXED: Unique key for nested ingredients
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
                                      {ri.note || "-"}
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
                    <td className="py-2 px-4 flex gap-2 actions-cell">
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          setEditRecipe(rec);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          handleDelete(rec.id);
                        }}
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
