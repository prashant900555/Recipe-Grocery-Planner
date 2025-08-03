import axios from "axios";

const API_URL = "http://localhost:8080/api/groceryitems";

export async function getActiveItems() {
  const res = await axios.get(`${API_URL}/active`);
  return res.data;
}

export async function getPurchasedItems() {
  const res = await axios.get(`${API_URL}/purchased`);
  return res.data;
}

export async function addItem(item) {
  const res = await axios.post(API_URL, item);
  return res.data;
}

export async function updateItem(id, item) {
  const res = await axios.put(`${API_URL}/${id}`, item);
  return res.data;
}

export async function deleteItem(id) {
  await axios.delete(`${API_URL}/${id}`);
}

export async function markPurchased(itemIds) {
  await axios.post(`${API_URL}/mark-purchased`, itemIds);
}

export async function undoPurchased(itemIds) {
  await axios.post(`${API_URL}/undo-purchased`, itemIds);
}

export async function generateFromRecipes(recipeIds, date) {
  const res = await axios.post(`${API_URL}/generate-from-recipes`, {
    ids: recipeIds,
    date,
  });
  return res.data;
}

export async function generateFromMealPlans(mealPlanIds, date) {
  const res = await axios.post(`${API_URL}/generate-from-mealplans`, {
    ids: mealPlanIds,
    date,
  });
  return res.data;
}

export async function updatePurchasedStatus(id, purchased) {
  await axios.patch(`${API_URL}/entries/${id}/purchased`, { purchased });
}
