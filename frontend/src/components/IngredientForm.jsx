import React, { useState, useEffect } from "react";

// Predefined units for the dropdown
const UNIT_OPTIONS = ["g", "kg", "ml", "l", "pcs", "tsp", "tbsp", "cup"];

export default function IngredientForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setUnit(initialData.unit || "");
    }
  }, [initialData]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !unit) return;
    onSubmit({
      ...initialData,
      name: name.trim(),
      unit: unit,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-lg mx-auto flex flex-col gap-6"
    >
      <div>
        <label className="block mb-1 font-semibold text-blue-700">Name</label>
        <input
          type="text"
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-blue-700">Unit</label>
        <select
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={unit}
          required
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="" disabled>
            -- Select Unit --
          </option>
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 justify-end mt-2">
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
