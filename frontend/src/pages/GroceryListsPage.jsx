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
  const [showPurchased, setShowPurchased] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [pendingNewList, setPendingNewList] = useState(false);
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

  function filteredLists() {
    return lists.filter((list) => !!list.completed === showPurchased);
  }

  const canAddNew =
    !showPurchased && lists.filter((l) => !l.completed).length === 0;

  function todayDDMMYYYY() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  async function markListPurchased(id) {
    setProcessingId(id);
    try {
      const list = lists.find((l) => l.id === id);
      if (!list) throw new Error("List not found");
      await updateGroceryList(id, { ...list, completed: true });
      await fetchAll();
    } catch {
      setError("Failed to mark list as purchased.");
    } finally {
      setProcessingId(null);
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

  // Add: No user-provided name or date
  async function handleCreate(data) {
    try {
      setPendingNewList(true);
      const dateStr = todayDDMMYYYY();
      // Exclude 'name' and 'date' from newData; they'll be set after initial create
      const { name, date, ...newData } = data;
      // Create new list, backend gets placeholder date and name
      const created = await createGroceryList({
        ...newData,
        name: "",
        date: "",
      });
      const dynamicName = `GroceryList_${dateStr}_${created.id}`;
      // Patch with dynamic name and today's date
      await updateGroceryList(created.id, {
        ...created,
        name: dynamicName,
        date: dateStr,
      });
      setShowForm(false);
      setPendingNewList(false);
      fetchAll();
    } catch {
      setError("Failed to create grocery list.");
      setPendingNewList(false);
    }
  }

  async function handleUpdate(data) {
    // Do not allow editing name or date
    try {
      await updateGroceryList(data.id, data);
      setShowForm(false);
      setEditList(null);
      fetchAll();
    } catch {
      setError("Failed to update grocery list.");
    }
  }

  async function handleTogglePurchased(listId, entryId, currentValue) {
    try {
      const newLists = lists.map((l) => {
        if (l.id !== listId) return l;
        const updatedEntries = l.entries.map((e) =>
          e.id === entryId ? { ...e, purchased: !currentValue } : e
        );
        return { ...l, entries: updatedEntries };
      });
      setLists(newLists);
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

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-pink-800">Grocery Lists</h2>
        <div className="flex gap-2">
          <button
            className={
              "px-3 py-1 rounded " +
              (!showPurchased
                ? "bg-indigo-600 text-white"
                : "bg-gray-300 text-gray-700")
            }
            onClick={() => setShowPurchased(false)}
            disabled={!showPurchased}
          >
            Active
          </button>
          <button
            className={
              "px-3 py-1 rounded " +
              (showPurchased
                ? "bg-indigo-600 text-white"
                : "bg-gray-300 text-gray-700")
            }
            onClick={() => setShowPurchased(true)}
            disabled={showPurchased}
          >
            Purchased
          </button>
        </div>
      </div>

      {!showPurchased && (
        <div className="mb-6">
          <button
            className={
              "bg-green-700 text-white px-4 py-2 rounded-lg shadow transition " +
              (canAddNew && !pendingNewList
                ? "hover:bg-green-800 cursor-pointer"
                : "bg-opacity-50 opacity-60 cursor-not-allowed")
            }
            onClick={() => {
              if (canAddNew && !pendingNewList) {
                setShowForm(true);
                setEditList(null);
              }
            }}
            disabled={!canAddNew || pendingNewList}
            title={
              canAddNew
                ? ""
                : "You must mark the current grocery list as purchased before adding another."
            }
          >
            + Add Grocery List
          </button>
        </div>
      )}

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
            hideNameField={true}
            hideDateField={true}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm rounded-md">
          <thead className="bg-pink-50">
            <tr>
              <th className="py-3 px-4 text-left font-bold">Items</th>
              <th className="py-3 px-4 text-left font-bold">Actions</th>
              <th className="py-3 px-4 text-left font-bold">Date</th>
              {!showPurchased && (
                <th className="py-3 px-4 text-left font-bold">
                  Mark Purchased
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={showPurchased ? 3 : 4}
                  className="text-center py-8 text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredLists().length === 0 ? (
              <tr>
                <td
                  colSpan={showPurchased ? 3 : 4}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  {showPurchased
                    ? "No purchased grocery lists found."
                    : "No active grocery lists found."}
                </td>
              </tr>
            ) : (
              filteredLists().map((list, idx) => (
                <tr
                  key={list.id}
                  className={
                    "hover:bg-pink-50 transition" +
                    (idx > 0
                      ? " border-t border-gray-200 dark:border-gray-300"
                      : "")
                  }
                >
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
                              disabled={showPurchased}
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
                  <td className="py-2 px-4 flex gap-2">
                    {!showPurchased && (
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => {
                          setEditList(list);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(list.id)}
                    >
                      Delete
                    </button>
                  </td>
                  <td className="py-2 px-4">{list.date || "-"}</td>
                  {!showPurchased && (
                    <td className="py-2 px-4">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        onClick={() => markListPurchased(list.id)}
                        disabled={processingId === list.id}
                      >
                        {processingId === list.id
                          ? "Processing..."
                          : "Mark Purchased"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
