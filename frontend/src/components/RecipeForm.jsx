import React, { useState, useEffect } from "react";
import { getIngredients } from "../services/ingredientService";

export default function RecipeForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    getIngredients().then(setAllIngredients);
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      if (initialData.ingredients) {
        setIngredients(
          initialData.ingredients.map((ri) => ({
            ingredientId: ri.ingredient.id,
            name: ri.ingredient.name,
            unit: ri.ingredient.unit,
            quantity: ri.quantity,
            note: ri.note || "",
            _recipeIngredientId: ri.id,
          }))
        );
      } else {
        setIngredients([]);
      }
    } else {
      setIngredients([]);
      setName("");
      setDescription("");
    }
  }, [initialData]);

  function handleAddIngredient() {
    setIngredients([
      ...ingredients,
      {
        ingredientId: "",
        name: "",
        unit: "",
        quantity: 1,
        note: "",
      },
    ]);
  }

  function handleIngredientChange(idx, field, value) {
    setIngredients((ings) =>
      ings.map((ing, i) =>
        i === idx
          ? {
              ...ing,
              [field]: value,
            }
          : ing
      )
    );
  }

  function handleSelectIngredient(idx, value) {
    const ingredient = allIngredients.find((ing) => String(ing.id) === value);
    if (ingredient) {
      handleIngredientChange(idx, "ingredientId", ingredient.id);
      handleIngredientChange(idx, "name", ingredient.name);
      handleIngredientChange(idx, "unit", ingredient.unit);
    }
  }

  function handleRemoveIngredient(idx) {
    setIngredients((ings) => ings.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...initialData,
      name: name.trim(),
      description: description.trim(),
      ingredients: ingredients.map((ing) => ({
        id: ing._recipeIngredientId,
        ingredient: {
          id: ing.ingredientId,
        },
        quantity: Number(ing.quantity) || 1,
        note: ing.note,
      })),
    };
    onSubmit(payload);
  }

  return (
    <form
      className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-xl mx-auto flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block mb-1 font-semibold text-blue-700">Name</label>
        <input
          type="text"
          className="w-full border border-blue-300 rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-blue-700">Ingredients</label>
          <button
            type="button"
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={handleAddIngredient}
          >
            + Add Ingredient
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Ingredient</th>
              <th className="px-2 py-1">Unit</th>
              <th className="px-2 py-1">Quantity</th>
              <th className="px-2 py-1">Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    required
                    className="border border-gray-300 rounded px-2 py-1"
                    value={ing.ingredientId}
                    onChange={(e) =>
                      handleSelectIngredient(idx, e.target.value)
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
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1 w-20"
                    value={ing.unit}
                    disabled
                    readOnly
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="border border-gray-300 rounded px-2 py-1 w-20"
                    value={ing.quantity}
                    onChange={(e) =>
                      handleIngredientChange(idx, "quantity", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={ing.note}
                    onChange={(e) =>
                      handleIngredientChange(idx, "note", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="px-2 text-red-600"
                    onClick={() => handleRemoveIngredient(idx)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-gray-400 text-center py-2">
                  No ingredients. Use + Add Ingredient.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 justify-end mt-2">
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
