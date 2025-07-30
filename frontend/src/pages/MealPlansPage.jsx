import React, { useState, useEffect } from "react";
import {
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../services/mealPlanService";
import MealPlanForm from "../components/MealPlanForm";

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [error, setError] = useState();

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

  return (
    <section className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl mt-8 p-6">
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
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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
              <th className="py-3 px-4 text-left font-bold">#</th>
              <th className="py-3 px-4 text-left font-bold">Name</th>
              <th className="py-3 px-4 text-left font-bold">Created</th>
              <th className="py-3 px-4 text-left font-bold">Days</th>
              <th className="py-3 px-4 text-left font-bold">Meals</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : mealPlans.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-10 text-gray-300 font-semibold"
                >
                  No meal plans found.
                </td>
              </tr>
            ) : (
              mealPlans.map((plan, idx) => (
                <tr key={plan.id} className="hover:bg-indigo-50 transition">
                  <td className="py-2 px-4">{idx + 1}</td>
                  <td className="py-2 px-4 capitalize">{plan.name}</td>
                  <td className="py-2 px-4">
                    {plan.createdAt?.slice(0, 10) || "-"}
                  </td>
                  <td className="py-2 px-4">
                    {[...new Set((plan.items || []).map((i) => i.date))].length}
                  </td>
                  <td className="py-2 px-4">
                    {plan.items && plan.items.length > 0 ? (
                      <ul className="list-disc pl-3">
                        {plan.items.map((item) =>
                          item.recipe ? (
                            <li key={item.id || item.date + item.recipe.id}>
                              {item.date}: {item.recipe.name}
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
