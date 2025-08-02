import axios from "axios";

const API_URL = "http://localhost:8080/api/grocerylists";

export async function getGroceryLists() {
  const res = await axios.get(API_URL);
  return res.data;
}

export async function createGroceryList(glist) {
  const res = await axios.post(API_URL, glist);
  return res.data;
}

export async function updateGroceryList(id, glist) {
  const res = await axios.put(`${API_URL}/${id}`, glist);
  return res.data;
}

export async function deleteGroceryList(id) {
  await axios.delete(`${API_URL}/${id}`);
}

export async function generateFromRecipes(recipeIds, name, date) {
  const res = await axios.post(`${API_URL}/generaterecipes`, {
    recipeIds,
    name,
    date,
  });
  return res.data;
}

// NEW: Generate grocery list from meal plan IDs
export async function generateFromMealPlans(mealPlanIds, name, date) {
  const res = await axios.post(API_URL + "/generate/mealplans", {
    mealPlanIds,
    name,
    date,
  });
  return res.data;
}

export async function updateEntryPurchased(entryId, purchased) {
  await axios.patch(
    `http://localhost:8080/api/grocerylists/entries/${entryId}/purchased`,
    {
      purchased,
    }
  );
}
