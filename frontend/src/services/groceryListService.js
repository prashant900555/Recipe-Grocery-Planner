import axios from "axios";
import { apiUrl } from "../config/api.js";

export async function getActiveItems() {
  const res = await axios.get(apiUrl("/api/groceryitems/active"));
  return res.data;
}

export async function getPurchasedItems() {
  const res = await axios.get(apiUrl("/api/groceryitems/purchased"));
  return res.data;
}

export async function addItem(item) {
  const res = await axios.post(apiUrl("/api/groceryitems"), item);
  return res.data;
}

export async function updateItem(id, item) {
  const res = await axios.put(apiUrl(`/api/groceryitems/${id}`), item);
  return res.data;
}

export async function deleteItem(id) {
  await axios.delete(apiUrl(`/api/groceryitems/${id}`));
}

export async function markPurchased(itemIds) {
  await axios.post(apiUrl("/api/groceryitems/mark-purchased"), itemIds);
}

export async function undoPurchased(itemIds) {
  await axios.post(apiUrl("/api/groceryitems/undo-purchased"), itemIds);
}

export async function generateFromRecipes(recipeIds, date) {
  const res = await axios.post(
    apiUrl("/api/groceryitems/generate-from-recipes"),
    {
      ids: recipeIds,
      date,
    }
  );
  return res.data;
}

export async function generateFromMealPlans(mealPlanIds, date) {
  const res = await axios.post(
    apiUrl("/api/groceryitems/generate-from-mealplans"),
    {
      ids: mealPlanIds,
      date,
    }
  );
  return res.data;
}

export async function updatePurchasedStatus(id, purchased) {
  await axios.patch(apiUrl(`/api/groceryitems/entries/${id}/purchased`), {
    purchased,
  });
}
