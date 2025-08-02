import React, { useState, useEffect } from "react";
import {
  getGroceryLists,
  createGroceryList,
  updateGroceryList,
  deleteGroceryList,
  updateEntryPurchased,
} from "../services/groceryListService";
import GroceryListForm from "../components/GroceryListForm";
import { useNavigate } from "react-router-dom";

export default function GroceryListsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editList, setEditList] = useState(null);
  const [error, setError] = useState();
  const navigate = useNavigate();

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

  // This now uses the PATCH API to avoid concurrent version errors
  async function handleTogglePurchased(listId, entryId, currentValue) {
    try {
      // Optimistically update UI
      const newLists = lists.map((l) => {
        if (l.id !== listId) return l;
        const updatedEntries = l.entries.map((e) =>
          e.id === entryId ? { ...e, purchased: !currentValue } : e
        );
        return { ...l, entries: updatedEntries };
      });
      setLists(newLists);

      // Send PATCH update for this entry only
      await updateEntryPurchased(entryId, !currentValue);
    } catch {
      fetchAll();
      setError("Failed to update purchased status.");
    }
  }

  return (
    <section className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        onClick={() => navigate("/")}
      >
        Back to Home
      </button>
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
        <table className="min-w-full text-sm rounded-md">
          <thead className="bg-pink-50">
            <tr>
              <th className="py-3 px-4 text-left font-bold">Items</th>
              <th className="py-3 px-4"></th>
              <th className="py-3 px-4 text-left font-bold">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : lists.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No grocery lists found.
                </td>
              </tr>
            ) : (
              lists.map((list, idx) => (
                <tr
                  key={list.id}
                  className={
                    "hover:bg-pink-50 transition" +
                    (idx > 0
                      ? " border-t border-gray-200 dark:border-gray-300"
                      : "")
                  }
                >
                  {/* Itemboxes */}
                  <td className="py-2 px-4">
                    {list.entries && list.entries.length > 0 ? (
                      <ul className="list-none pl-0 m-0">
                        {list.entries.map((entry) => (
                          <li
                            key={entry.id}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={!!entry.purchased}
                              onChange={() =>
                                handleTogglePurchased(
                                  list.id,
                                  entry.id,
                                  !!entry.purchased
                                )
                              }
                              className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            />
                            <span>
                              {entry.quantity} {entry.unit}{" "}
                              {entry.ingredientName}
                            </span>
                            {entry.note && (
                              <span className="text-gray-500 ml-1 text-sm">
                                ({entry.note})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* Buttons */}
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
                  {/* Date */}
                  <td className="py-2 px-4">{list.date || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
