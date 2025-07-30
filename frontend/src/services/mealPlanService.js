import axios from "axios";

const API_URL = "http://localhost:8080/api/mealplans";

export async function getMealPlans() {
  const res = await axios.get(API_URL);
  return res.data;
}

export async function getMealPlan(id) {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

export async function createMealPlan(plan) {
  const res = await axios.post(API_URL, plan);
  return res.data;
}

export async function updateMealPlan(id, plan) {
  const res = await axios.put(`${API_URL}/${id}`, plan);
  return res.data;
}

export async function deleteMealPlan(id) {
  await axios.delete(`${API_URL}/${id}`);
}
