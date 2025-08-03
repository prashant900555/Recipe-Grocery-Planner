package com.grocery.recipes.service;

import com.grocery.recipes.model.GroceryItem;
import java.util.List;
import java.util.Optional;

public interface GroceryItemService {

    List<GroceryItem> findAllActive();

    List<GroceryItem> findAllPurchased();

    Optional<GroceryItem> findById(Long id);

    GroceryItem addItem(GroceryItem item);

    GroceryItem updateItem(GroceryItem item);

    void deleteItem(Long id);

    void markItemsPurchased(List<Long> itemIds);

    void markItemsUnpurchased(List<Long> itemIds);

    GroceryItem mergeOrAddItem(GroceryItem item);

    List<GroceryItem> generateFromRecipes(List<Long> recipeIds, String date);

    List<GroceryItem> generateFromMealPlans(List<Long> mealPlanIds, String date);
}
