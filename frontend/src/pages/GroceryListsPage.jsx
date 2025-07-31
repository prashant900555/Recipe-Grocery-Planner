import React, { useState, useEffect } from "react";
import {
  getGroceryLists,
  createGroceryList,
  updateGroceryList,
  deleteGroceryList,
} from "../services/groceryListService";
import GroceryListForm from "../components/GroceryListForm";

export default function GroceryListsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editList, setEditList] = useState(null);
  const [error, setError] = useState();

  const fetchAll = async () => {
    setLoading(true);
    try {
      setLists(await getGroceryLists());
      setError();
    } catch {
      setError("Failed to fetch grocery lists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleCreate(data) {
    try {
      await createGroceryList(data);
      setShowForm(false);
      fetchAll();
    } catch {
      setError("Failed to create grocery list.");
    }
  }

  async function handleUpdate(data) {
    try {
      await updateGroceryList(data.id, data);
      setShowForm(false);
      setEditList(null);
      fetchAll();
    } catch {
      setError("Failed to update grocery list.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this grocery list?")) return;
    try {
      await deleteGroceryList(id);
      fetchAll();
    } catch {
      setError("Failed to delete grocery list.");
    }
  }

  function showPurchasedCount(entries = []) {
    if (!entries || !entries.length) return "";
    const done = entries.filter((e) => e.purchased).length;
    return `${done}/${entries.length}`;
  }

  return (
    <section className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-pink-800">Grocery Lists</h2>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
          onClick={() => {
            setShowForm(true);
            setEditList(null);
          }}
        >
          + Add Grocery List
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-10">
          <GroceryListForm
            initialData={editList}
            onSubmit={editList ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditList(null);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm rounded-md">
          <thead className="bg-pink-50">
            <tr>
              <th className="py-3 px-4 text-left font-bold">#</th>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4 text-left font-bold">Date</th>
              <th className="py-3 px-4 text-left font-bold">From Meal Plan</th>
              <th className="py-3 px-4 text-left font-bold">Items</th>
              <th className="py-3 px-4 text-left font-bold">Purchased</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : lists.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No grocery lists found.
                </td>
              </tr>
            ) : (
              lists.map((list, idx) => (
                <tr key={list.id} className="hover:bg-pink-50 transition">
                  <td className="py-2 px-4">{idx + 1}</td>
                  <td className="py-2 px-4">{list.name}</td>
                  <td className="py-2 px-4">{list.date || "-"}</td>
                  <td className="py-2 px-4">{list.mealPlan?.name || "-"}</td>
                  <td className="py-2 px-4">
                    {list.entries && list.entries.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {list.entries.map((e, i) => (
                          <li key={e.ingredientId + "-" + i}>
                            {e.quantity} {e.unit} {e.ingredientName}
                            {e.note ? ` (${e.note})` : ""}
                            {e.purchased ? " ✔️" : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {showPurchasedCount(list.entries)}
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => {
                        setEditList(list);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(list.id)}
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
