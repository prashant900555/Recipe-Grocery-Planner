package com.grocery.recipes.service;

import com.grocery.recipes.model.*;
import com.grocery.recipes.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroceryListServiceImpl implements GroceryListService {

    private final GroceryListRepository groceryListRepository;
    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;

    public GroceryListServiceImpl(
            GroceryListRepository groceryListRepository,
            MealPlanRepository mealPlanRepository,
            RecipeRepository recipeRepository
    ) {
        this.groceryListRepository = groceryListRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
    }

    @Override
    public List<GroceryList> findAll() {
        return groceryListRepository.findAll();
    }

    @Override
    public Optional<GroceryList> findById(Long id) {
        return groceryListRepository.findById(id);
    }

    @Override
    public GroceryList save(GroceryList incomingList) {
        if (incomingList.getEntries() == null || incomingList.getEntries().isEmpty()) {
            throw new IllegalArgumentException("Grocery list must contain at least one ingredient entry.");
        }

        if (incomingList.getId() != null) {
            // Update case: load the persistent entity first
            Optional<GroceryList> dbListOpt = groceryListRepository.findById(incomingList.getId());
            if (dbListOpt.isPresent()) {
                GroceryList dbList = dbListOpt.get();

                // Clear the persistent collection but do not replace it!
                dbList.getEntries().clear();

                if (incomingList.getEntries() != null) {
                    for (GroceryListEntry inc : incomingList.getEntries()) {
                        inc.setId(null); // treat all as new, let JPA handle orphan removal (simplest, safest)
                        dbList.getEntries().add(inc);
                    }
                }
                dbList.setName(incomingList.getName());
                dbList.setDate(incomingList.getDate());
                dbList.setMealPlan(incomingList.getMealPlan());

                return groceryListRepository.save(dbList);
            }
            // Fallback: treat as new
            incomingList.setId(null);
            if (incomingList.getEntries() != null) {
                for (GroceryListEntry entry : incomingList.getEntries()) {
                    entry.setId(null);
                }
            }
            return groceryListRepository.save(incomingList);
        }

        // New grocery list: all entries must be new
        if (incomingList.getEntries() != null) {
            for (GroceryListEntry entry : incomingList.getEntries()) {
                entry.setId(null);
            }
        }
        return groceryListRepository.save(incomingList);
    }

    @Override
    public void deleteById(Long id) {
        groceryListRepository.deleteById(id);
    }

    public GroceryList generateFromMealPlan(Long mealPlanId, String listName, String shoppingDate) {
        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Meal plan not found"));

        Map<String, GroceryListEntry> merged = new LinkedHashMap<>();

        for (MealPlanItem item : mealPlan.getItems()) {
            if (item.getRecipe() == null) continue;
            for (RecipeIngredient ri : item.getRecipe().getIngredients()) {
                String key = ri.getIngredient().getId() + "_" + ri.getIngredient().getUnit();
                if (merged.containsKey(key)) {
                    GroceryListEntry entry = merged.get(key);
                    entry.setQuantity(entry.getQuantity() + ri.getQuantity());
                } else {
                    GroceryListEntry entry = new GroceryListEntry();
                    entry.setIngredientId(ri.getIngredient().getId());
                    entry.setIngredientName(ri.getIngredient().getName());
                    entry.setUnit(ri.getIngredient().getUnit());
                    entry.setQuantity(ri.getQuantity());
                    entry.setNote("");
                    entry.setPurchased(false);
                    merged.put(key, entry);
                }
            }
        }
        GroceryList glist = new GroceryList();
        glist.setName(listName);
        glist.setDate(shoppingDate);
        glist.setEntries(new ArrayList<>(merged.values()));
        glist.setMealPlan(mealPlan);
        return glist;
    }

}
