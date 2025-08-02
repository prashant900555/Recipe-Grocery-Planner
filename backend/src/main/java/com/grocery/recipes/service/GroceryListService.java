package com.grocery.recipes.service;

import com.grocery.recipes.model.GroceryList;
import java.util.List;
import java.util.Optional;

public interface GroceryListService {
    List<GroceryList> findAll();
    Optional<GroceryList> findById(Long id);
    GroceryList save(GroceryList groceryList);
    void deleteById(Long id);
    // NEW: Generate grocery list from recipe IDs
    GroceryList generateFromRecipes(List<Long> recipeIds, String listName, String shoppingDate);
}
