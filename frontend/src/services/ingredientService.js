import axios from "axios";

const API_URL = "http://localhost:8080/api/ingredients";

export async function getIngredients() {
  const res = await axios.get(API_URL);
  return res.data;
}

export async function getIngredient(id) {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

export async function createIngredient(ingredient) {
  const res = await axios.post(API_URL, ingredient);
  return res.data;
}

export async function updateIngredient(id, ingredient) {
  const res = await axios.put(`${API_URL}/${id}`, ingredient);
  return res.data;
}

export async function deleteIngredient(id) {
  await axios.delete(`${API_URL}/${id}`);
}
