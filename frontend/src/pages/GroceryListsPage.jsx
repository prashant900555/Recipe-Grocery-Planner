import React, { useState, useEffect, useCallback } from "react";
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
  "large",
  "medium",
  "small",
  "inch",
  "cm",
  "mm",
];

function autoConvertUnit(quantity, unit) {
  let num = parseFloat(quantity);
  let u = unit;

  function formatNumber(n) {
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  }

  if (u === "g" && num >= 1000) return [formatNumber(num / 1000), "kg"];
  if (u === "kg" && num < 1) return [formatNumber(num * 1000), "g"];
  if (u === "ml" && num >= 1000) return [formatNumber(num / 1000), "l"];
  if (u === "l" && num < 1) return [formatNumber(num * 1000), "ml"];
  if (u === "oz" && num >= 16) return [formatNumber(num / 16), "lb"];
  if (u === "tsp" && num >= 3) return [formatNumber(num / 3), "tbsp"];
  if (u === "tbsp" && num >= 16) return [formatNumber(num / 16), "cup"];
  return [isNaN(num) ? "1" : formatNumber(num), u];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredActiveItems, setFilteredActiveItems] = useState([]);
  const [filteredPurchasedItems, setFilteredPurchasedItems] = useState([]);
  const navigate = useNavigate();

  // Fixed fetchAll function with useCallback for stability
  const fetchAll = useCallback(async (unpurchasedIds = []) => {
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
  }, []);

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    fetchAll();
    getAllIngredients()
      .then((list) => setIngredients(list))
      .catch(() => setIngredients([]));
  }, [fetchAll]);

  useEffect(() => {
    const filterItems = (items) => {
      if (!searchTerm) return items;
      return items.filter((item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    setFilteredActiveItems(filterItems(activeItems));
    setFilteredPurchasedItems(filterItems(purchasedItems));
  }, [searchTerm, activeItems, purchasedItems]);

  function resetForm() {
    setAdding(false);
    setEditingId(null);
    setEditItem(null);
    setNewItem(initialNewItem);
    setIngredientSuggestions([]);
  }

  function handleItemNameChange(val) {
    setNewItem({ ...newItem, itemName: val });
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
      await updateItem(editingId, {
        ...editItem,
        quantity: qty,
        unit: unit,
      });
      resetForm();
      fetchAll();
    } catch {
      setError("Failed to update item.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteItem(id);
      fetchAll();
    } catch {
      setError("Failed to delete item.");
    }
  }

  async function handleDeleteSelected(type) {
    const ids = type === "active" ? selectedIds : selectedPurchasedIds;
    if (!ids.length) {
      setError(`Select ${type} items to delete.`);
      return;
    }

    if (!window.confirm(`Delete selected ${type} items?`)) return;
    try {
      for (const id of ids) {
        await deleteItem(id);
      }
      type === "active" ? setSelectedIds([]) : setSelectedPurchasedIds([]);
      fetchAll();
    } catch {
      setError(`Failed to delete ${type} items.`);
    }
  }

  async function handleDeleteAll(type) {
    const items = type === "active" ? activeItems : purchasedItems;
    if (!items.length) return;
    if (!window.confirm(`Delete all ${type} items?`)) return;
    try {
      for (const item of items) {
        await deleteItem(item.id);
      }
      fetchAll();
    } catch {
      setError(`Failed to delete all ${type} items.`);
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

  function toggleSelectAllActive() {
    if (
      filteredActiveItems.every((item) => selectedIds.includes(item.id)) &&
      filteredActiveItems.length > 0
    ) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredActiveItems.some((item) => item.id === id))
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...filteredActiveItems
          .map((item) => item.id)
          .filter((id) => !prev.includes(id)),
      ]);
    }
  }

  function toggleSelectAllPurchased() {
    if (
      filteredPurchasedItems.every((item) =>
        selectedPurchasedIds.includes(item.id)
      ) &&
      filteredPurchasedItems.length > 0
    ) {
      setSelectedPurchasedIds((prev) =>
        prev.filter(
          (id) => !filteredPurchasedItems.some((item) => item.id === id)
        )
      );
    } else {
      setSelectedPurchasedIds((prev) => [
        ...prev,
        ...filteredPurchasedItems
          .map((item) => item.id)
          .filter((id) => !prev.includes(id)),
      ]);
    }
  }

  function toggleSelect(id, purchased = false) {
    if (purchased) {
      setSelectedPurchasedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  }

  function renderEditableRow(item) {
    return (
      <tr key={item.id} onClick={(e) => e.stopPropagation()}>
        <td className="p-3">
          <input
            type="checkbox"
            checked={
              item.purchased
                ? selectedPurchasedIds.includes(item.id)
                : selectedIds.includes(item.id)
            }
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(item.id, item.purchased);
            }}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded"
          />
        </td>
        <td className="p-3">
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={editItem ? editItem.itemName : item.itemName}
            onChange={(e) =>
              setEditItem((prev) => ({ ...prev, itemName: e.target.value }))
            }
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        <td className="p-3">
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={editItem ? editItem.quantity : item.quantity}
            onChange={(e) =>
              setEditItem((prev) => ({ ...prev, quantity: e.target.value }))
            }
            onClick={(e) => e.stopPropagation()}
            min="0"
            step="any"
          />
        </td>
        <td className="p-3">
          <select
            className="w-full border border-gray-300 rounded px-2 py-1 capitalize"
            value={editItem ? editItem.unit : item.unit}
            onChange={(e) =>
              setEditItem((prev) => ({ ...prev, unit: e.target.value }))
            }
            onClick={(e) => e.stopPropagation()}
          >
            {ALL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </td>
        <td className="p-3">
          {showPurchased
            ? extractDate(item.datePurchased) || "-"
            : extractDate(item.dateAdded) || "-"}
        </td>
        <td className="p-3 flex gap-2">
          <button
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditSave();
            }}
          >
            Save
          </button>
          <button
            className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              resetForm();
            }}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Grocery Lists
              </h1>
              <p className="text-gray-600 mt-1">Manage your shopping items</p>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content - Left Side */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search grocery items..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {!showPurchased
                    ? `${filteredActiveItems.length} active items`
                    : `${filteredPurchasedItems.length} purchased items`}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {!showPurchased ? (
                  <>
                    <button
                      className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
                      onClick={() => setAdding(true)}
                    >
                      Add Item
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                      onClick={handleMarkPurchased}
                      disabled={selectedIds.length === 0}
                    >
                      Mark as Purchased
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                      onClick={() => handleDeleteSelected("active")}
                      disabled={selectedIds.length === 0}
                    >
                      Delete Selected
                    </button>
                    <button
                      className="px-4 py-2 bg-red-700 text-white rounded-lg shadow hover:bg-red-800 transition"
                      onClick={() => handleDeleteAll("active")}
                      disabled={activeItems.length === 0 || loading}
                    >
                      Delete All Active
                    </button>
                    <button
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      onClick={toggleSelectAllActive}
                      disabled={filteredActiveItems.length === 0}
                    >
                      {filteredActiveItems.every((item) =>
                        selectedIds.includes(item.id)
                      ) && filteredActiveItems.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
                      onClick={handleUndoPurchased}
                      disabled={selectedPurchasedIds.length === 0}
                    >
                      Undo Purchased
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                      onClick={() => handleDeleteSelected("purchased")}
                      disabled={selectedPurchasedIds.length === 0}
                    >
                      Delete Selected
                    </button>
                    <button
                      className="px-4 py-2 bg-red-700 text-white rounded-lg shadow hover:bg-red-800 transition"
                      onClick={() => handleDeleteAll("purchased")}
                      disabled={purchasedItems.length === 0 || loading}
                    >
                      Delete All Purchased
                    </button>
                    <button
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      onClick={toggleSelectAllPurchased}
                      disabled={filteredPurchasedItems.length === 0}
                    >
                      {filteredPurchasedItems.every((item) =>
                        selectedPurchasedIds.includes(item.id)
                      ) && filteredPurchasedItems.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Add Item Form */}
            {adding && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Item name"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newItem.itemName}
                      onChange={(e) => handleItemNameChange(e.target.value)}
                      autoComplete="off"
                    />
                    {ingredientSuggestions.length > 0 && (
                      <ul className="absolute top-full left-0 bg-white border border-gray-300 w-full z-10 max-h-48 overflow-y-auto rounded-b">
                        {ingredientSuggestions.map((sug) => (
                          <li
                            key={sug.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSuggestionClick(sug.name)}
                          >
                            {sug.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Quantity"
                    className="border border-gray-300 rounded px-3 py-2"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                  />
                  <select
                    className="border border-gray-300 rounded px-3 py-2"
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
                    placeholder="Note (optional)"
                    className="border border-gray-300 rounded px-3 py-2"
                    value={newItem.note}
                    onChange={(e) =>
                      setNewItem({ ...newItem, note: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={handleAdd}
                  >
                    Add Item
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items Display */}
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          !showPurchased
                            ? filteredActiveItems.length > 0 &&
                              filteredActiveItems.every((item) =>
                                selectedIds.includes(item.id)
                              )
                            : filteredPurchasedItems.length > 0 &&
                              filteredPurchasedItems.every((item) =>
                                selectedPurchasedIds.includes(item.id)
                              )
                        }
                        onChange={
                          !showPurchased
                            ? toggleSelectAllActive
                            : toggleSelectAllPurchased
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-700">
                      Item
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-700">
                      Unit
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-700">
                      {showPurchased ? "Date Purchased" : "Date Added"}
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-12 text-center text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : !showPurchased ? (
                    filteredActiveItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="py-12 text-center text-gray-400"
                        >
                          No active items found.
                        </td>
                      </tr>
                    ) : (
                      filteredActiveItems.map((item) => {
                        const selected = selectedIds.includes(item.id);
                        if (editingId === item.id) {
                          return renderEditableRow(item);
                        }

                        return (
                          <tr
                            key={item.id}
                            onClick={() => toggleSelect(item.id, false)}
                            className={`cursor-pointer transition-colors duration-200 ${
                              selected
                                ? "bg-pink-50 border-pink-300"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(item.id, false);
                                }}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                                onFocus={(e) => e.target.select()}
                              />
                            </td>
                            <td className="p-3 font-medium text-gray-900">
                              {item.itemName}
                            </td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3 capitalize">{item.unit}</td>
                            <td className="p-3">
                              {extractDate(item.dateAdded) || "-"}
                            </td>
                            <td className="p-3 flex gap-2">
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(item.id);
                                  setEditItem(item);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : filteredPurchasedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-12 text-center text-gray-400"
                      >
                        No purchased items found.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchasedItems.map((item) => {
                      const selected = selectedPurchasedIds.includes(item.id);
                      if (editingId === item.id) {
                        return renderEditableRow(item);
                      }

                      return (
                        <tr
                          key={item.id}
                          onClick={() => toggleSelect(item.id, true)}
                          className={`cursor-pointer transition-colors duration-200 ${
                            selected
                              ? "bg-indigo-50 border-indigo-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(item.id, true);
                              }}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                              onFocus={(e) => e.target.select()}
                            />
                          </td>
                          <td className="p-3 font-medium text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3 capitalize">{item.unit}</td>
                          <td className="p-3">
                            {extractDate(item.datePurchased) || "-"}
                          </td>
                          <td className="p-3 flex gap-2">
                            <button
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(item.id);
                                setEditItem(item);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar - Active/Purchased Sections */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">View Sections</h3>
              <div className="space-y-3">
                <button
                  className={`w-full px-4 py-3 rounded-lg text-left transition ${
                    !showPurchased
                      ? "bg-pink-100 text-pink-800 border-2 border-pink-300"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                  onClick={() => setShowPurchased(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Active Items</span>
                    <span className="bg-pink-200 text-pink-800 px-2 py-1 rounded-full text-sm">
                      {activeItems.length}
                    </span>
                  </div>
                  <div className="text-sm mt-1 opacity-75">
                    Items to purchase
                  </div>
                </button>
                <button
                  className={`w-full px-4 py-3 rounded-lg text-left transition ${
                    showPurchased
                      ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-300"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                  onClick={() => setShowPurchased(true)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Purchased Items</span>
                    <span className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full text-sm">
                      {purchasedItems.length}
                    </span>
                  </div>
                  <div className="text-sm mt-1 opacity-75">
                    Already bought items
                  </div>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Active</span>
                    <span className="font-medium">{activeItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Purchased</span>
                    <span className="font-medium">{purchasedItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selected</span>
                    <span className="font-medium">
                      {!showPurchased
                        ? selectedIds.length
                        : selectedPurchasedIds.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
