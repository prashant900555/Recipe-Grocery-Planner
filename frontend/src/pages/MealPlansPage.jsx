import React, { useState, useEffect, useCallback } from "react";
import {
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../services/mealPlanService";
import { generateFromMealPlans } from "../services/groceryListService";
import MealPlanForm from "../components/MealPlanForm";
import { useNavigate } from "react-router-dom";

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlans, setFilteredPlans] = useState([]);

  const navigate = useNavigate();

  // Fetch all meal plans
  const fetchAll = async () => {
    setLoading(true);
    try {
      setMealPlans(await getMealPlans());
      setError("");
    } catch {
      setError("Failed to fetch meal plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  // Debounced search - filter plans by name
  const debouncedSearch = useCallback(
    debounce((term, plansData) => {
      const f = !term
        ? plansData
        : plansData.filter((p) =>
            p.name.toLowerCase().includes(term.toLowerCase())
          );
      setFilteredPlans(f);
    }, 250),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm, mealPlans);
  }, [searchTerm, mealPlans, debouncedSearch]);

  // also keep the filtered list in sync on first mount
  useEffect(() => {
    setFilteredPlans(mealPlans);
  }, [mealPlans]);

  async function handleCreate(data) {
    try {
      await createMealPlan(data);
      setShowForm(false);
      fetchAll();
    } catch {
      setError("Failed to create meal plan.");
    }
  }

  async function handleUpdate(data) {
    try {
      await updateMealPlan(data.id, data);
      setShowForm(false);
      setEditPlan(null);
      fetchAll();
    } catch {
      setError("Failed to update meal plan.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this meal plan?")) return;
    try {
      await deleteMealPlan(id);
      fetchAll();
    } catch {
      setError("Failed to delete meal plan.");
    }
  }

  async function handleDeleteSelected() {
    if (selected.length === 0) {
      setError("Please select at least one meal plan to delete.");
      return;
    }

    const count = selected.length;
    if (
      !window.confirm(
        `Delete ${count} selected meal plan${count > 1 ? "s" : ""}?`
      )
    )
      return;

    setDeleting(true);
    setError("");

    try {
      // Delete all selected meal plans
      await Promise.all(selected.map((id) => deleteMealPlan(id)));
      setSelected([]); // Clear selection
      fetchAll(); // Refresh the list
    } catch {
      setError("Failed to delete some meal plans.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelected(id) {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    );
  }

  // Select all filtered/visible meal plans
  function toggleSelectAll() {
    if (
      filteredPlans.every((p) => selected.includes(p.id)) &&
      filteredPlans.length > 0
    ) {
      setSelected((prev) =>
        prev.filter((id) => !filteredPlans.some((p) => p.id === id))
      );
    } else {
      setSelected((prev) => [
        ...prev,
        ...filteredPlans.map((p) => p.id).filter((id) => !prev.includes(id)),
      ]);
    }
  }

  // Generate dynamic name - join plan names with " & " then add date/List
  function dynamicGroceryListName(dateStr) {
    if (!selected.length) return "";
    const plans = mealPlans.filter((mp) => selected.includes(mp.id));
    const names = plans.map((mp) => mp.name || "MealPlan");
    const joinedName = names.join(" & ");
    return `${joinedName}${dateStr}List`;
  }

  async function handleGenerate() {
    if (selected.length === 0) {
      setError("Please select at least one meal plan.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const todayDate = todayDDMMYYYY();
      const autoName = dynamicGroceryListName(todayDate);
      await generateFromMealPlans(selected, autoName, todayDate);
      setGenerating(false);
      navigate("/grocerylists");
    } catch (e) {
      let message = "Failed to generate grocery list.";
      if (e.response?.data) {
        if (typeof e.response.data === "string") message = e.response.data;
        else if (e.response.data.message) message = e.response.data.message;
        else message = JSON.stringify(e.response.data);
      } else if (e.message) {
        message = e.message;
      }
      setError(message);
      setGenerating(false);
    }
  }

  function todayDDMMYYYY() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return (
    <section className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </button>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-indigo-800">Meal Plans</h2>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
          onClick={() => {
            setShowForm(true);
            setEditPlan(null);
          }}
        >
          + Add Meal Plan
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex mb-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-base mr-2"
          placeholder="Search meal plan name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Selection and Actions */}
      <div className="mb-6 border p-4 rounded bg-blue-50 flex flex-wrap items-center gap-3">
        <span className="font-semibold mr-2">Select meal plans:</span>
        <button
          className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 disabled:bg-gray-400"
          onClick={handleGenerate}
          disabled={generating || selected.length === 0}
        >
          {generating ? "Generating..." : "Generate Grocery List"}
        </button>
        <button
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          onClick={handleDeleteSelected}
          disabled={deleting || selected.length === 0}
        >
          {deleting ? "Deleting..." : "Delete Selected"}
        </button>
        {selected.length > 0 && (
          <span className="text-sm text-gray-600">
            ({selected.length} selected)
          </span>
        )}
      </div>

      {showForm && (
        <div className="mb-10">
          <MealPlanForm
            initialData={editPlan}
            onSubmit={editPlan ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditPlan(null);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm rounded-md">
          <thead className="bg-indigo-50">
            <tr>
              <th className="py-3 px-4 text-left font-bold">
                <input
                  type="checkbox"
                  checked={
                    filteredPlans.length > 0 &&
                    filteredPlans.every((p) => selected.includes(p.id))
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  title="Select all"
                />
              </th>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4 text-left font-bold">Created</th>
              <th className="py-3 px-4 text-left font-bold">Days</th>
              <th className="py-3 px-4 text-left font-bold">Meals</th>
              <th className="py-3 px-4 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No meal plans found.
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan, idx) => (
                <tr key={plan.id} className="hover:bg-indigo-50 transition">
                  <td className="py-2 px-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(plan.id)}
                      onChange={() => toggleSelected(plan.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 px-4 capitalize">{plan.name}</td>
                  <td className="py-2 px-4">
                    {plan.createdAt?.slice(0, 10) || "-"}
                  </td>
                  <td className="py-2 px-4">
                    {[
                      ...new Set(
                        plan.items?.map((i) => (i.date.length ? i.date : ""))
                      ),
                    ].length || 0}
                  </td>
                  <td className="py-2 px-4">
                    {plan.items && plan.items.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {plan.items.map((item) =>
                          item.recipe ? (
                            <li key={`${item.id}-${item.date}`}>
                              {item.date} - {item.recipe.name}
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => {
                        setEditPlan(plan);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(plan.id)}
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
