import React, { useState, useEffect } from "react";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../services/ingredientService";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState();

  const fetchAll = async () => {
    setLoading(true);
    try {
      setIngredients(await getIngredients());
      setError();
    } catch {
      setError("Failed to fetch ingredients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  function resetForm() {
    setEditing(null);
    setName("");
    setError();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateIngredient(editing.id, { name: name.trim() });
      } else {
        await createIngredient({ name: name.trim() });
      }
      resetForm();
      fetchAll();
    } catch {
      setError("Failed to save ingredient.");
    }
  }

  function handleEdit(ingredient) {
    setEditing(ingredient);
    setName(ingredient.name);
    setError();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this ingredient?")) return;
    try {
      await deleteIngredient(id);
      fetchAll();
    } catch {
      setError("Failed to delete ingredient.");
    }
  }

  return (
    <section className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Ingredients</h2>
      <form className="mb-8 flex gap-2 items-end" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border rounded w-60"
          />
        </div>
        <button
          className="bg-green-700 text-white px-4 py-2 rounded"
          type="submit"
        >
          {editing ? "Update" : "Add"}
        </button>
        {editing && (
          <button
            className="ml-2 bg-gray-200 px-3 py-2 rounded"
            onClick={resetForm}
            type="button"
          >
            Cancel
          </button>
        )}
      </form>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : ingredients.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-gray-400">
                  No ingredients found.
                </td>
              </tr>
            ) : (
              ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-t border-gray-100">
                  <td className="py-2 px-4">{ingredient.name}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                      onClick={() => handleEdit(ingredient)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded"
                      onClick={() => handleDelete(ingredient.id)}
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
