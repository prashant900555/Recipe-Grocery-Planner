package com.grocery.recipes.service;

import com.grocery.recipes.dto.GroceryListEntry;
import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.model.MealPlanItem;
import com.grocery.recipes.model.RecipeIngredient;
import com.grocery.recipes.repository.MealPlanRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroceryListServiceImpl implements GroceryListService {

    private final MealPlanRepository mealPlanRepository;

    public GroceryListServiceImpl(MealPlanRepository mealPlanRepository) {
        this.mealPlanRepository = mealPlanRepository;
    }

    @Override
    public List<GroceryListEntry> generateGroceryList(Long mealPlanId) {
        Optional<MealPlan> optionalMealPlan = mealPlanRepository.findById(mealPlanId);
        if (optionalMealPlan.isEmpty()) {
            return Collections.emptyList();
        }

        MealPlan mealPlan = optionalMealPlan.get();

        // Map key by ingredientId + unit (concatenated)
        Map<String, GroceryListEntry> aggregateMap = new LinkedHashMap<>();

        for (MealPlanItem mpi : mealPlan.getItems()) {
            if (mpi.getRecipe() == null) {
                continue;
            }
            for (RecipeIngredient ri : mpi.getRecipe().getIngredients()) {
                if (ri.getIngredient() == null) {
                    continue;
                }
                Ingredient ing = ri.getIngredient();
                String key = ing.getId() + "::" + ing.getUnit();

                GroceryListEntry entry = aggregateMap.get(key);
                if (entry == null) {
                    entry = new GroceryListEntry(
                            ing.getId(),
                            ing.getName(),
                            ing.getUnit(),
                            ri.getQuantity()
                    );
                    aggregateMap.put(key, entry);
                } else {
                    entry.setQuantity(entry.getQuantity() + ri.getQuantity());
                }
            }
        }

        return new ArrayList<>(aggregateMap.values());
    }
}
