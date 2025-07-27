package com.grocery.recipes.service;

import com.grocery.recipes.dto.GroceryListEntry;

import java.util.List;

public interface GroceryListService {

    /**
     * Generate aggregated grocery list entries for the given meal plan ID.
     * Aggregation groups ingredients by ingredientId and unit.
     *
     * @param mealPlanId meal plan identifier
     * @return list of GroceryListEntry with summed quantities
     */
    List<GroceryListEntry> generateGroceryList(Long mealPlanId);
}
