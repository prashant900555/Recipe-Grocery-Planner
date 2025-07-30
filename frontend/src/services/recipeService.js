import axios from "axios";

const API_URL = "http://localhost:8080/api/recipes";

export async function getRecipes() {
  const res = await axios.get(API_URL);
  return res.data;
}

export async function getRecipe(id) {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

export async function createRecipe(recipe) {
  const res = await axios.post(API_URL, recipe);
  return res.data;
}

export async function updateRecipe(id, recipe) {
  const res = await axios.put(`${API_URL}/${id}`, recipe);
  return res.data;
}

export async function deleteRecipe(id) {
  await axios.delete(`${API_URL}/${id}`);
}
