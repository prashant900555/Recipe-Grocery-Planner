import React, { useState, useEffect } from "react";
import { getIngredients } from "../services/ingredientService";

const UNIT_OPTIONS = [
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "slice",
  "can",
  "oz",
];

export default function RecipeForm({ initialData, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    getIngredients()
      .then(setAllIngredients)
      .catch(() => setError("Failed to load ingredients."));
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIngredients(
        (initialData.ingredients || []).map((ri) => ({
          ingredientId: ri.ingredient ? ri.ingredient.id : "",
          quantity: ri.quantity || "",
          unit: ri.unit || UNIT_OPTIONS[0],
          note: ri.note || "",
          id: ri.id || Math.random(), // for stable keys if available
        }))
      );
    } else {
      setName("");
      setDescription("");
      setIngredients([]);
    }
    setError();
  }, [initialData]);

  function handleAddIngredient() {
    setIngredients([
      ...ingredients,
      {
        ingredientId: "",
        quantity: "",
        unit: UNIT_OPTIONS[0],
        note: "",
        id: Math.random(),
      },
    ]);
  }

  function handleIngredientFieldChange(idx, field, value) {
    setIngredients(
      ingredients.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  }

  function handleRemoveIngredient(idx) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }
    if (
      ingredients.length === 0 ||
      ingredients.some(
        (row) =>
          !row.ingredientId ||
          !row.unit ||
          !row.quantity ||
          isNaN(Number(row.quantity)) ||
          Number(row.quantity) <= 0
      )
    ) {
      setError(
        "All ingredient rows must have an ingredient, unit, and a positive quantity."
      );
      return;
    }
    setError();
    // Build payload with per-row units
    onSubmit({
      ...initialData,
      name: name.trim(),
      description: description.trim(),
      ingredients: ingredients.map((row) => ({
        ingredient: allIngredients.find(
          (a) => String(a.id) === String(row.ingredientId)
        ),
        quantity: Number(row.quantity),
        unit: row.unit,
        note: row.note,
        id: row.id,
      })),
    });
  }

  return (
    <form
      className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-2xl mx-auto flex flex-col gap-6"
      onSubmit={handleFormSubmit}
    >
      <div>
        <label className="block mb-1 font-semibold text-blue-700">
          Recipe Name
        </label>
        <input
          type="text"
          className="w-full border border-blue-300 rounded px-3 py-2"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-blue-700">
          Description
        </label>
        <textarea
          className="w-full border border-blue-300 rounded px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-blue-700">Ingredients</label>
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleAddIngredient}
          >
            Add Ingredient
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Ingredient</th>
              <th className="px-2 py-1">Quantity</th>
              <th className="px-2 py-1">Unit</th>
              <th className="px-2 py-1">Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ingredients.map((row, idx) => (
              <tr key={row.id || idx}>
                <td>
                  <select
                    required
                    className="border border-gray-300 rounded px-2 py-1"
                    value={row.ingredientId}
                    onChange={(e) =>
                      handleIngredientFieldChange(
                        idx,
                        "ingredientId",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    {allIngredients.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    className="border border-gray-300 rounded px-2 py-1 w-20"
                    value={row.quantity}
                    onChange={(e) =>
                      handleIngredientFieldChange(
                        idx,
                        "quantity",
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    required
                    className="border border-gray-300 rounded px-2 py-1"
                    value={row.unit}
                    onChange={(e) =>
                      handleIngredientFieldChange(idx, "unit", e.target.value)
                    }
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={row.note}
                    onChange={(e) =>
                      handleIngredientFieldChange(idx, "note", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="text-red-600 px-2"
                    title="Remove"
                    onClick={() => handleRemoveIngredient(idx)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {error && (
              <tr>
                <td colSpan={5} className="text-red-600 text-sm">
                  {error}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 justify-end items-center mt-6">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded"
        >
          Save Recipe
        </button>
      </div>
    </form>
  );
}
