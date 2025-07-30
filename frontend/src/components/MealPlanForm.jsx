import React, { useState, useEffect } from "react";
import { getRecipes } from "../services/recipeService";

// Convert DD-MM-YYYY <-> YYYY-MM-DD
function toDisplayInput(dateStr) {
  // from DD-MM-YYYY -> YYYY-MM-DD
  const [d, m, y] = dateStr.split("-");
  return `${y}-${m}-${d}`;
}
function toDDMMYYYY(dateStr) {
  // from YYYY-MM-DD -> DD-MM-YYYY
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}
// Today in DD-MM-YYYY
function todayDDMMYYYY(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function MealPlanForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState("");
  const [days, setDays] = useState(1);
  const [recipesPerDay, setRecipesPerDay] = useState(1);
  const [allRecipes, setAllRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    getRecipes().then(setAllRecipes);
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      if (initialData.items && initialData.items.length > 0) {
        // Group dates as DD-MM-YYYY
        const dayMap = {};
        initialData.items.forEach((item) => {
          let d =
            item.date.includes("-") && item.date.length === 10
              ? item.date.match(/^\d{2}-\d{2}-\d{4}$/)
                ? item.date
                : toDDMMYYYY(item.date)
              : item.date;
          if (!dayMap[d]) dayMap[d] = [];
          dayMap[d].push({ ...item, date: d });
        });
        const sortedDates = Object.keys(dayMap).sort((a, b) => {
          const ad = new Date(toDisplayInput(a));
          const bd = new Date(toDisplayInput(b));
          return ad - bd;
        });
        setDays(sortedDates.length);
        setRecipesPerDay(
          Math.max(...sortedDates.map((date) => dayMap[date].length))
        );
        setItems(sortedDates.flatMap((date) => dayMap[date]));
      } else {
        setDays(1);
        setRecipesPerDay(1);
        setItems([]);
      }
    } else {
      setName("");
      setDays(1);
      setRecipesPerDay(1);
      setItems([]);
    }
  }, [initialData]);

  function handleGenerate() {
    const newItems = [];
    for (let i = 0; i < days; ++i) {
      const date = todayDDMMYYYY(i);
      for (let j = 0; j < recipesPerDay; ++j) {
        newItems.push({ date, recipe: null });
      }
    }
    setItems(newItems);
  }

  function handleRecipeChange(idx, recipeId) {
    setItems((items) =>
      items.map((item, i) =>
        i === idx
          ? {
              ...item,
              recipe: recipeId
                ? allRecipes.find((r) => r.id === Number(recipeId))
                : null,
            }
          : item
      )
    );
  }

  function handleRemoveRow(idx) {
    setItems((items) => items.filter((_, i) => i !== idx));
  }

  function handleAddDay() {
    const date = todayDDMMYYYY(days);
    setItems([
      ...items,
      ...Array(recipesPerDay)
        .fill()
        .map(() => ({ date, recipe: null })),
    ]);
    setDays(days + 1);
  }

  function handleRemoveDay(idx) {
    const dateToRemove = items[idx].date;
    setItems((items) => items.filter((item) => item.date !== dateToRemove));
    setDays(days - 1);
  }

  function handleDateChange(idx, newDateISO) {
    setItems((items) =>
      items.map((item, i) =>
        i === idx ? { ...item, date: toDDMMYYYY(newDateISO) } : item
      )
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (items.some((item) => !item.recipe)) {
      setError("Please select a recipe in every slot.");
      return;
    }
    const backendItems = items.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      date: item.date,
      recipe: { id: item.recipe.id },
    }));
    onSubmit({ ...initialData, name: name.trim(), items: backendItems });
  }

  return (
    <form
      className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-2xl mx-auto flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block mb-1 font-semibold text-blue-700">
          Meal Plan Name
        </label>
        <input
          type="text"
          className="w-full border border-blue-300 rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-3 items-end">
        <div>
          <label className="block mb-1 font-semibold text-blue-700">Days</label>
          <input
            type="number"
            min={1}
            max={99}
            className="border border-blue-300 rounded px-3 py-2 w-24"
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 1)}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-blue-700">
            Recipes per Day
          </label>
          <input
            type="number"
            min={1}
            max={10}
            className="border border-blue-300 rounded px-3 py-2 w-24"
            value={recipesPerDay}
            onChange={(e) => setRecipesPerDay(Number(e.target.value) || 1)}
          />
        </div>
        <button
          type="button"
          className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
          onClick={handleGenerate}
        >
          Generate
        </button>
        <button
          type="button"
          className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800"
          onClick={handleAddDay}
        >
          + Add Day
        </button>
      </div>
      <div>
        <label className="font-semibold text-blue-700 mb-2 block">
          Meals Grid
        </label>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-2 py-1">Day</th>
                <th className="px-2 py-1">Recipe</th>
                <th />
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={toDisplayInput(item.date)}
                      onChange={(e) => handleDateChange(idx, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 w-32"
                      required
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      required
                      className="border border-gray-300 rounded px-2 py-1"
                      value={item.recipe?.id || ""}
                      onChange={(e) => handleRecipeChange(idx, e.target.value)}
                    >
                      <option value="">Select Recipe</option>
                      {allRecipes.map((rec) => (
                        <option value={rec.id} key={rec.id}>
                          {rec.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-red-600 px-2"
                      onClick={() => handleRemoveRow(idx)}
                      title="Remove Meal"
                    >
                      ✕
                    </button>
                  </td>
                  {idx % recipesPerDay === 0 && (
                    <td>
                      <button
                        type="button"
                        className="text-red-500 px-2 text-xs"
                        onClick={() => handleRemoveDay(idx)}
                        title="Remove Day"
                      >
                        Remove This Day
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-gray-400 text-center py-2">
                    Click "Generate" to setup your meal plan grid.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-500 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}
      <div className="flex gap-4 justify-end mt-2">
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700"
        >
          Save Plan
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
