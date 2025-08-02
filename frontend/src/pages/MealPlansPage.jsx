import React, { useState, useEffect } from "react";
import {
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../services/mealPlanService";
import { generateFromMealPlans } from "../services/groceryListService";
import MealPlanForm from "../components/MealPlanForm";
import { useNavigate } from "react-router-dom";

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [error, setError] = useState();
  const [selected, setSelected] = useState([]);
  const [listName, setListName] = useState("");
  const [listDate, setListDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      setMealPlans(await getMealPlans());
      setError();
    } catch {
      setError("Failed to fetch meal plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    setListDate(todayDDMMYYYY());
  }, []);

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

  function toggleSelected(id) {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    );
  }

  async function handleGenerate() {
    if (!listName.trim()) {
      setError("Please enter a name for the grocery list.");
      return;
    }
    if (!listDate.trim()) {
      setError("Please enter a date for the grocery list.");
      return;
    }
    setGenerating(true);
    setError();
    try {
      await generateFromMealPlans(selected, listName.trim(), listDate);
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
        Back to Home
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
          Add Meal Plan
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Selection and Generate */}
      <div className="mb-6 border p-4 rounded bg-blue-50 flex flex-wrap items-center gap-3">
        <span className="font-semibold mr-2">
          Select meal plans to generate a grocery list
        </span>
        <input
          type="text"
          placeholder="List name"
          className="border rounded px-2 py-1 mr-2"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1 mr-2"
          value={(() => {
            if (!listDate) return "";
            const [dd, mm, yyyy] = listDate.split("-");
            return `${yyyy}-${mm}-${dd}`;
          })()}
          onChange={(e) => {
            const [yyyy, mm, dd] = e.target.value.split("-");
            setListDate(`${dd}-${mm}-${yyyy}`);
          }}
          required
        />
        <button
          className="px-3 py-1 bg-green-700 text-white rounded"
          onClick={handleGenerate}
          disabled={generating || selected.length === 0}
        >
          {generating ? "Generating..." : "Generate Grocery List"}
        </button>
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
              <th></th>
              <th className="py-3 px-4 text-left font-bold">#</th>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4 text-left font-bold">Created</th>
              <th className="py-3 px-4 text-left font-bold">Days</th>
              <th className="py-3 px-4 text-left font-bold">Meals</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : mealPlans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No meal plans found.
                </td>
              </tr>
            ) : (
              mealPlans.map((plan, idx) => (
                <tr key={plan.id} className="hover:bg-indigo-50 transition">
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(plan.id)}
                      onChange={() => toggleSelected(plan.id)}
                    />
                  </td>
                  <td className="py-2 px-4">{idx + 1}</td>
                  <td className="py-2 px-4 capitalize">{plan.name}</td>
                  <td className="py-2 px-4">
                    {plan.createdAt?.slice(0, 10) || "-"}
                  </td>
                  <td className="py-2 px-4">
                    {
                      [
                        ...new Set(
                          plan.items?.map((i) => (i.date.length ? i.date : ""))
                        ),
                      ].length
                    }
                  </td>
                  <td className="py-2 px-4">
                    {plan.items && plan.items.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {plan.items.map((item) =>
                          item.recipe ? (
                            <li key={item.id + "-" + item.date}>
                              {item.date} {item.recipe.name}
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
