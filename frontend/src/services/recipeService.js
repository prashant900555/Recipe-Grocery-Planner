import axios from "axios";
import { apiUrl } from "../config/api.js";

export async function getRecipes() {
  const res = await axios.get(apiUrl("/api/recipes"));
  return res.data;
}

export async function getRecipe(id) {
  const res = await axios.get(apiUrl(`/api/recipes/${id}`));
  return res.data;
}

export async function createRecipe(recipe) {
  const res = await axios.post(apiUrl("/api/recipes"), recipe);
  return res.data;
}

export async function updateRecipe(id, recipe) {
  const res = await axios.put(apiUrl(`/api/recipes/${id}`), recipe);
  return res.data;
}

export async function deleteRecipe(id) {
  await axios.delete(apiUrl(`/api/recipes/${id}`));
}

// NEW: Update servings and scale quantities in database
export async function updateRecipeServings(id, servings) {
  const res = await axios.patch(apiUrl(`/api/recipes/${id}/servings`), {
    servings,
  });
  return res.data;
}

// NEW: Set all recipes to default servings = 2
export async function setAllRecipesDefaultServings() {
  const res = await axios.patch(apiUrl("/api/recipes/default-servings"), {
    servings: 2,
  });
  return res.data;
}
