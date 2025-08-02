import React, { useState, useEffect } from "react";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../services/ingredientService";
import IngredientForm from "../components/IngredientForm";
import { useNavigate } from "react-router-dom";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editIngredient, setEditIngredient] = useState(null);
  const [errorMsg, setErrorMsg] = useState();
  const navigate = useNavigate();

  async function fetchAll() {
    setLoading(true);
    try {
      setIngredients(await getIngredients());
      setErrorMsg();
    } catch {
      setErrorMsg("Failed to fetch ingredients.");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleCreate(data) {
    try {
      await createIngredient(data);
      setShowForm(false);
      fetchAll();
    } catch {
      setErrorMsg("Failed to create ingredient.");
    }
  }

  async function handleUpdate(data) {
    try {
      await updateIngredient(data.id, data);
      setShowForm(false);
      setEditIngredient(null);
      fetchAll();
    } catch {
      setErrorMsg("Failed to update ingredient.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this ingredient?")) return;
    try {
      await deleteIngredient(id);
      fetchAll();
    } catch {
      setErrorMsg("Failed to delete ingredient.");
    }
  }

  return (
    <section className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        onClick={() => navigate("/")}
      >
        Back to Home
      </button>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-blue-800">Ingredients</h2>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          onClick={() => {
            setShowForm(true);
            setEditIngredient(null);
          }}
        >
          Add Ingredient
        </button>
      </div>
      {errorMsg && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errorMsg}
        </div>
      )}
      {showForm && (
        <div className="mb-8">
          <IngredientForm
            initialData={editIngredient}
            onSubmit={editIngredient ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditIngredient(null);
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
              <th className="py-3 px-4 text-left font-bold">Unit</th>
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
            ) : ingredients.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No ingredients found.
                </td>
              </tr>
            ) : (
              ingredients.map((ing, idx) => (
                <tr key={ing.id} className="hover:bg-blue-50 transition">
                  <td className="py-2 px-4">{idx + 1}</td>
                  <td className="py-2 px-4 capitalize">{ing.name}</td>
                  <td className="py-2 px-4">{ing.unit}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        setShowForm(true);
                        setEditIngredient(ing);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(ing.id)}
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
