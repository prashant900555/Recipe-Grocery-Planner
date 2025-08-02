import React, { useState, useEffect } from "react";
import { getIngredients } from "../services/ingredientService";
import { getMealPlans } from "../services/mealPlanService";

// Helper to get today's date string in DD-MM-YYYY
function todayDDMMYYYY() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function GroceryListForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayDDMMYYYY());
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedMealPlan, setSelectedMealPlan] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    getIngredients().then(setIngredients);
    getMealPlans().then(setMealPlans);
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDate(initialData.date || todayDDMMYYYY());
      setItems(
        initialData.entries?.map((item) => ({
          ...item,
        })) || []
      );
      setSelectedMealPlan(initialData.mealPlan?.id || "");
    } else {
      setItems([]);
      setSelectedMealPlan("");
      setName("");
      setDate(todayDDMMYYYY());
    }
  }, [initialData]);

  function handleAddItem() {
    setItems([
      ...items,
      {
        ingredientId: "",
        ingredientName: "",
        unit: "",
        quantity: 1,
        note: "",
        purchased: false,
      },
    ]);
  }

  function handleIngredientChange(idx, value) {
    const ing = ingredients.find((i) => String(i.id) === value);
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              ingredientId: ing?.id || "",
              ingredientName: ing?.name || "",
              unit: ing?.unit || "",
            }
          : item
      )
    );
  }

  function handleFieldChange(idx, field, value) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function handleRemove(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) {
      setError("At least one ingredient must be added.");
      return;
    }
    if (items.some((item) => !item.ingredientId || !item.quantity)) {
      setError("All ingredients must be selected and quantities > 0.");
      return;
    }
    onSubmit({
      ...initialData,
      name: name.trim(),
      date,
      mealPlan: selectedMealPlan ? { id: selectedMealPlan } : null,
      entries: items,
    });
  }

  function toInputDate(ddmmyyyy) {
    // DD-MM-YYYY => YYYY-MM-DD
    const [dd, mm, yyyy] = ddmmyyyy.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  function toDDMMYYYY(iso) {
    // YYYY-MM-DD => DD-MM-YYYY
    const [yyyy, mm, dd] = iso.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }

  return (
    <form
      className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-2xl mx-auto flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block mb-1 font-semibold text-blue-700">
          List Name
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
        <label className="block mb-1 font-semibold text-blue-700">Date</label>
        <input
          type="date"
          className="border border-blue-300 rounded px-3 py-2"
          value={toInputDate(date)}
          required
          onChange={(e) => setDate(toDDMMYYYY(e.target.value))}
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-blue-700">Ingredients</label>
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleAddItem}
          >
            Add Ingredient
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Ingredient</th>
              <th className="px-2 py-1">Unit</th>
              <th className="px-2 py-1">Quantity</th>
              <th className="px-2 py-1">Note</th>
              <th className="px-2 py-1">Purchased</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    required
                    className="border border-gray-300 rounded px-2 py-1"
                    value={item.ingredientId}
                    onChange={(e) =>
                      handleIngredientChange(idx, e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {ingredients.map((opt) => (
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
                    value={item.unit}
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
                    value={item.quantity}
                    required
                    onChange={(e) =>
                      handleFieldChange(idx, "quantity", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={item.note}
                    onChange={(e) =>
                      handleFieldChange(idx, "note", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={item.purchased || false}
                    onChange={(e) =>
                      handleFieldChange(idx, "purchased", e.target.checked)
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="text-red-600 px-2"
                    onClick={() => handleRemove(idx)}
                    title="Remove"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {error && (
              <tr>
                <td colSpan={6} className="text-red-600 text-sm">
                  {error}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 justify-end items-center">
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
          Save Grocery List
        </button>
      </div>
    </form>
  );
}
