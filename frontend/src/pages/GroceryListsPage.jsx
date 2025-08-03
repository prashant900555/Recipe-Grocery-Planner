import React, { useState, useEffect } from "react";
import {
  getActiveItems,
  getPurchasedItems,
  addItem,
  updateItem,
  deleteItem,
  markPurchased,
  undoPurchased,
} from "../services/groceryListService";
import { getAllIngredients } from "../services/ingredientService";
import { useNavigate } from "react-router-dom";

function extractDate(str) {
  if (!str) return "";
  const match = str.match(/\d{2}-\d{2}-\d{4}/);
  return match ? match[0] : str;
}
const ALL_UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "pcs",
  "slice",
  "can",
  "oz",
  "lb",
  "pinch",
  "dash",
  "pack",
  "box",
];
function autoConvertUnit(quantity, unit) {
  let num = parseFloat(quantity);
  let u = unit;
  if (u === "g" && num >= 1000) return [+(num / 1000).toFixed(2), "kg"];
  if (u === "kg" && num < 1) return [+(num * 1000).toFixed(2), "g"];
  if (u === "ml" && num >= 1000) return [+(num / 1000).toFixed(2), "l"];
  if (u === "l" && num < 1) return [+(num * 1000).toFixed(2), "ml"];
  if (u === "oz" && num >= 16) return [+(num / 16).toFixed(2), "lb"];
  if (u === "tsp" && num >= 3) return [+(num / 3).toFixed(2), "tbsp"];
  if (u === "tbsp" && num >= 16) return [+(num / 16).toFixed(2), "cup"];
  return [isNaN(num) ? "" : +num.toFixed(2), u];
}
function todayAsDDMMYYYY() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
const initialNewItem = {
  itemName: "",
  quantity: 1,
  unit: "g",
  note: "",
  dateAdded: "",
};

export default function GroceryListsPage() {
  const [activeItems, setActiveItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [showPurchased, setShowPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPurchasedIds, setSelectedPurchasedIds] = useState([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(initialNewItem);
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [justUnpurchasedIds, setJustUnpurchasedIds] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
  const navigate = useNavigate();

  async function fetchAll(unpurchasedIds = []) {
    setLoading(true);
    try {
      let actives = await getActiveItems();
      let purchased = await getPurchasedItems();
      if (unpurchasedIds.length > 0) {
        actives = actives.map((item) =>
          unpurchasedIds.includes(item.id)
            ? { ...item, dateAdded: todayAsDDMMYYYY() }
            : item
        );
      }
      actives = actives.map((item) => {
        const [qty, u] = autoConvertUnit(item.quantity, item.unit);
        return { ...item, quantity: qty, unit: u };
      });
      purchased = purchased.map((item) => {
        const [qty, u] = autoConvertUnit(item.quantity, item.unit);
        return { ...item, quantity: qty, unit: u };
      });
      setActiveItems(actives);
      setPurchasedItems(purchased);
      setError("");
    } catch {
      setError("Failed to fetch grocery items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // Fetch ingredient names for autocomplete
    getAllIngredients()
      .then((list) => setIngredients(list))
      .catch(() => setIngredients([]));
  }, []);

  function resetForm() {
    setAdding(false);
    setEditingId(null);
    setEditItem(null);
    setNewItem(initialNewItem);
    setIngredientSuggestions([]);
  }

  // Autocomplete ingredient suggestions
  function handleItemNameChange(val) {
    setNewItem({ ...newItem, itemName: val });
    // case-insensitive match
    if (val && ingredients.length > 0) {
      const matches = ingredients
        .filter((ing) => ing.name.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 7);
      setIngredientSuggestions(matches);
    } else {
      setIngredientSuggestions([]);
    }
  }
  function handleSuggestionClick(name) {
    setNewItem({ ...newItem, itemName: name });
    setIngredientSuggestions([]);
  }

  async function handleAdd() {
    if (!newItem.itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    try {
      const [qty, unit] = autoConvertUnit(newItem.quantity, newItem.unit);
      await addItem({
        ...newItem,
        quantity: qty,
        unit: unit,
        dateAdded: todayAsDDMMYYYY(),
      });
      resetForm();
      fetchAll();
    } catch {
      setError("Failed to add item.");
    }
  }
  async function handleEditSave() {
    if (!editItem.itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    try {
      const [qty, unit] = autoConvertUnit(editItem.quantity, editItem.unit);
      await updateItem(editingId, { ...editItem, quantity: qty, unit: unit });
      resetForm();
      fetchAll();
    } catch {
      setError("Failed to update item.");
    }
  }
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(id);
      fetchAll();
    } catch {
      setError("Failed to delete item.");
    }
  }
  async function handleDeleteSelected(type) {
    const ids = type === "active" ? selectedIds : selectedPurchasedIds;
    if (!ids.length) return;
    if (!window.confirm("Are you sure you want to delete the selected items?"))
      return;
    setLoading(true);
    setError("");
    try {
      for (const id of ids) {
        await deleteItem(id);
      }
      if (type === "active") setSelectedIds([]);
      if (type === "purchased") setSelectedPurchasedIds([]);
      fetchAll();
    } catch {
      setError("Failed to delete selected items.");
    } finally {
      setLoading(false);
    }
  }
  async function handleDeleteAll(section) {
    let items = section === "active" ? activeItems : purchasedItems;
    if (!items.length) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ALL ${
          section === "active" ? "active" : "purchased"
        } items? This cannot be undone.`
      )
    )
      return;
    setLoading(true);
    setError("");
    try {
      for (const item of items) {
        await deleteItem(item.id);
      }
      if (section === "active") setSelectedIds([]);
      if (section === "purchased") setSelectedPurchasedIds([]);
      fetchAll();
    } catch {
      setError("Failed to delete all items.");
    } finally {
      setLoading(false);
    }
  }
  async function handleMarkPurchased() {
    if (!selectedIds.length) {
      setError("Select items to mark as purchased.");
      return;
    }
    try {
      await markPurchased(selectedIds);
      setSelectedIds([]);
      fetchAll();
    } catch {
      setError("Failed to mark as purchased.");
    }
  }
  async function handleUndoPurchased() {
    if (!selectedPurchasedIds.length) {
      setError("Select items to undo purchased.");
      return;
    }
    try {
      await undoPurchased(selectedPurchasedIds);
      setJustUnpurchasedIds(selectedPurchasedIds);
      setSelectedPurchasedIds([]);
      fetchAll(selectedPurchasedIds);
    } catch {
      setError("Failed to undo purchased.");
      setJustUnpurchasedIds([]);
    }
  }
  function renderTable(items, selected, setSelected, purchased = false) {
    return (
      <>
        <div style={{ marginBottom: "12px" }}>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded mr-2"
            onClick={() =>
              handleDeleteSelected(purchased ? "purchased" : "active")
            }
            disabled={selected.length === 0 || loading}
          >
            Delete Selected
          </button>
        </div>
        <table className="min-w-full rounded-md text-sm">
          <thead className={purchased ? "bg-indigo-50" : "bg-pink-50"}>
            <tr>
              <th></th>
              <th className="py-3 px-3 text-left font-bold">Item</th>
              <th className="py-3 px-3 text-left font-bold">Quantity</th>
              <th className="py-3 px-3 text-left font-bold">Unit</th>
              <th className="py-3 px-3 text-left font-bold">Note</th>
              <th className="py-3 px-3 text-left font-bold">
                {purchased ? "Date Purchased" : "Date"}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-8">
                  {purchased ? "No purchased items." : "No items."}
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.id}
                className="odd:bg-gray-50 hover:bg-pink-50 transition border-b"
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelected([...selected, item.id]);
                      else setSelected(selected.filter((id) => id !== item.id));
                    }}
                  />
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      className="border p-1 w-28"
                      value={editItem.itemName}
                      onChange={(e) =>
                        setEditItem({ ...editItem, itemName: e.target.value })
                      }
                    />
                  ) : (
                    item.itemName
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      className="border p-1 w-16"
                      value={editItem.quantity}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          quantity: e.target.value,
                        })
                      }
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <select
                      className="border p-1 w-16"
                      value={editItem.unit}
                      onChange={(e) =>
                        setEditItem({ ...editItem, unit: e.target.value })
                      }
                    >
                      {ALL_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    item.unit
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      className="border p-1 w-32"
                      value={editItem.note || ""}
                      onChange={(e) =>
                        setEditItem({ ...editItem, note: e.target.value })
                      }
                    />
                  ) : (
                    item.note
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      className="border p-1 w-20"
                      value={editItem.dateAdded}
                      onChange={(e) =>
                        setEditItem({ ...editItem, dateAdded: e.target.value })
                      }
                    />
                  ) : purchased ? (
                    extractDate(item.datePurchased)
                  ) : justUnpurchasedIds.includes(item.id) ? (
                    todayAsDDMMYYYY()
                  ) : (
                    extractDate(item.dateAdded)
                  )}
                </td>
                <td className="flex gap-1">
                  {editingId === item.id ? (
                    <>
                      <button
                        className="bg-green-600 text-white px-2 py-1 rounded"
                        onClick={handleEditSave}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-blue-600 text-white px-2 py-1 rounded mr-1"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditItem({ ...item });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleDelete(item.id)}
                      >
                        &#10005;
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <section className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        onClick={() => navigate("/")}
      >
        Back to Home
      </button>
      <h2 className="text-3xl font-bold text-pink-800 mb-4">Grocery List</h2>
      <div className="flex gap-3 mb-6">
        <button
          className={`px-3 py-1 rounded ${
            !showPurchased
              ? "bg-indigo-600 text-white"
              : "bg-gray-300 text-gray-700"
          }`}
          onClick={() => setShowPurchased(false)}
        >
          Active
        </button>
        <button
          className={`px-3 py-1 rounded ${
            showPurchased
              ? "bg-indigo-600 text-white"
              : "bg-gray-300 text-gray-700"
          }`}
          onClick={() => setShowPurchased(true)}
        >
          Purchased
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {!showPurchased && (
        <div className="mb-6">
          <button
            className="bg-green-700 text-white px-4 py-2 rounded-lg shadow mb-4"
            onClick={() => setAdding(true)}
          >
            Add Item
          </button>
          <button
            className="bg-red-700 text-white px-4 py-2 rounded-lg shadow mb-4 ml-2"
            onClick={() => handleDeleteAll("active")}
            disabled={activeItems.length === 0 || loading}
            title="Delete all active items"
          >
            Delete All Active
          </button>
          {adding && (
            <div
              className="mb-4 bg-gray-50 px-3 py-2 rounded shadow flex flex-wrap gap-3 items-center"
              style={{ position: "relative" }}
            >
              <div style={{ position: "relative", width: "160px" }}>
                <input
                  type="text"
                  className="border p-1 w-28"
                  placeholder="Item"
                  value={newItem.itemName}
                  onChange={(e) => handleItemNameChange(e.target.value)}
                  autoComplete="off"
                />
                {ingredientSuggestions.length > 0 && (
                  <ul
                    style={{
                      position: "absolute",
                      top: "28px",
                      left: 0,
                      background: "#fff",
                      border: "1px solid #ddd",
                      width: "160px",
                      zIndex: 10,
                      maxHeight: "180px",
                      overflowY: "auto",
                      borderRadius: "0 0 8px 8px",
                    }}
                  >
                    {ingredientSuggestions.map((sug) => (
                      <li
                        key={sug.id}
                        style={{ padding: "4px 8px", cursor: "pointer" }}
                        onClick={() => handleSuggestionClick(sug.name)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSuggestionClick(sug.name);
                        }}
                      >
                        {sug.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="number"
                min={0.01}
                step={0.01}
                className="border p-1 w-16"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: e.target.value })
                }
              />
              <select
                className="border p-1 w-16"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
              >
                {ALL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="border p-1 w-32"
                placeholder="Note"
                value={newItem.note}
                onChange={(e) =>
                  setNewItem({ ...newItem, note: e.target.value })
                }
              />
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={handleAdd}
              >
                Add
              </button>
              <button
                className="bg-gray-400 text-white px-3 py-1 rounded"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            {renderTable(activeItems, selectedIds, setSelectedIds, false)}
          </div>
          <button
            className="mt-4 bg-indigo-700 text-white px-4 py-2 rounded-full"
            onClick={handleMarkPurchased}
            disabled={selectedIds.length === 0}
          >
            Mark Purchased
          </button>
        </div>
      )}
      {showPurchased && (
        <div>
          <button
            className="bg-red-700 text-white px-4 py-2 rounded-lg shadow mb-4"
            onClick={() => handleDeleteAll("purchased")}
            disabled={purchasedItems.length === 0 || loading}
            title="Delete all purchased items"
          >
            Delete All Purchased
          </button>
          <div className="mb-4">
            <button
              className="bg-indigo-700 text-white px-4 py-2 rounded-full"
              onClick={handleUndoPurchased}
              disabled={selectedPurchasedIds.length === 0}
            >
              Undo Purchased
            </button>
          </div>
          <div className="overflow-x-auto">
            {renderTable(
              purchasedItems,
              selectedPurchasedIds,
              setSelectedPurchasedIds,
              true
            )}
          </div>
        </div>
      )}
    </section>
  );
}
