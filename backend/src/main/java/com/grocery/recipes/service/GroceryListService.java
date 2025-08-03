package com.grocery.recipes.service;

import com.grocery.recipes.model.GroceryList;
import java.util.List;
import java.util.Optional;

@Deprecated
public interface GroceryListService {
    List<GroceryList> findAll();
    Optional<GroceryList> findById(Long id);
    GroceryList save(GroceryList groceryList);
    void deleteById(Long id);
    // NEW: Generate grocery list from recipe IDs
    GroceryList generateFromRecipes(List<Long> recipeIds, String listName, String shoppingDate);

    // NEW: Generate grocery list from multiple meal plan IDs
    GroceryList generateFromMealPlans(List<Long> mealPlanIds, String listName, String shoppingDate);

    void updateEntryPurchased(Long entryId, boolean purchased);

}
