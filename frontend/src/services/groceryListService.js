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

export async function generateFromMealPlan(mealPlanId, name, date) {
  const res = await axios.post(
    `${API_URL}/generate/mealplan/${mealPlanId}?name=${encodeURIComponent(
      name
    )}&date=${date}`
  );
  return res.data;
}

export async function generateFromRecipes(recipeIds, name, date) {
  const res = await axios.post(`${API_URL}/generaterecipes`, {
    recipeIds,
    name,
    date,
  });
  return res.data;
}
