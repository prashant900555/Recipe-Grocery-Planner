import axios from "axios";
import { apiUrl } from "../config/api.js";

export async function getIngredients() {
  const res = await axios.get(apiUrl("/api/ingredients"));
  return res.data;
}

export async function getAllIngredients() {
  const res = await axios.get(apiUrl("/api/ingredients"));
  return res.data; // { id, name, ... }
}

export async function getIngredient(id) {
  const res = await axios.get(apiUrl(`/api/ingredients/${id}`));
  return res.data;
}

export async function createIngredient(ingredient) {
  const res = await axios.post(apiUrl("/api/ingredients"), ingredient);
  return res.data;
}

export async function updateIngredient(id, ingredient) {
  const res = await axios.put(apiUrl(`/api/ingredients/${id}`), ingredient);
  return res.data;
}

export async function deleteIngredient(id) {
  await axios.delete(apiUrl(`/api/ingredients/${id}`));
}
