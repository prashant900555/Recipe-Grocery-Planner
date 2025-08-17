import axios from "axios";
import { apiUrl } from "../config/api.js";

export async function getMealPlans() {
  const res = await axios.get(apiUrl("/api/mealplans"));
  return res.data;
}

export async function getMealPlan(id) {
  const res = await axios.get(apiUrl(`/api/mealplans/${id}`));
  return res.data;
}

export async function createMealPlan(plan) {
  const res = await axios.post(apiUrl("/api/mealplans"), plan);
  return res.data;
}

export async function updateMealPlan(id, plan) {
  const res = await axios.put(apiUrl(`/api/mealplans/${id}`), plan);
  return res.data;
}

export async function deleteMealPlan(id) {
  await axios.delete(apiUrl(`/api/mealplans/${id}`));
}
