package com.grocery.recipes.service;

import com.grocery.recipes.model.GroceryItem;
import com.grocery.recipes.model.User;

import java.util.List;
import java.util.Optional;

public interface GroceryItemService {

    List<GroceryItem> findAllActive();
    List<GroceryItem> findAllActiveByUser(User user);

    List<GroceryItem> findAllPurchased();
    List<GroceryItem> findAllPurchasedByUser(User user);

    Optional<GroceryItem> findById(Long id);

    GroceryItem addItem(GroceryItem item);
    GroceryItem updateItem(GroceryItem item);
    void deleteItem(Long id);
    void deleteItemByIdAndUser(Long id, User user);

    void markItemsPurchased(List<Long> itemIds);
    void markItemsPurchasedByUser(List<Long> itemIds, User user);

    void markItemsUnpurchased(List<Long> itemIds);
    void markItemsUnpurchasedByUser(List<Long> itemIds, User user);

    GroceryItem mergeOrAddItem(GroceryItem item);

    List<GroceryItem> generateFromRecipes(List<Long> recipeIds, String date);
    List<GroceryItem> generateFromRecipesByUser(List<Long> recipeIds, String date, User user);

    List<GroceryItem> generateFromMealPlans(List<Long> mealPlanIds, String date);
    List<GroceryItem> generateFromMealPlansByUser(List<Long> mealPlanIds, String date, User user);
}
