package com.grocery.recipes.controller;

import com.grocery.recipes.dto.GroceryListEntry;
import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.service.GroceryListService;
import com.grocery.recipes.service.MealPlanService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/grocerylist")
public class GroceryListController {

    private final MealPlanService mealPlanService;
    private final GroceryListService groceryListService;

    public GroceryListController(MealPlanService mealPlanService, GroceryListService groceryListService) {
        this.mealPlanService = mealPlanService;
        this.groceryListService = groceryListService;
    }

    /**
     * Display page to select a Meal Plan for grocery list generation.
     */
    @GetMapping
    public String selectMealPlan(Model model, @RequestParam(required = false) Long mealPlanId) {
        List<MealPlan> mealPlans = mealPlanService.findAll();
        model.addAttribute("mealPlans", mealPlans);

        if (mealPlanId != null) {
            model.addAttribute("selectedMealPlanId", mealPlanId);
            List<GroceryListEntry> groceryList = groceryListService.generateGroceryList(mealPlanId);
            model.addAttribute("groceryList", groceryList);
        }

        return "grocerylist/list";
    }

    /**
     * Save updated grocery list quantities in-memory (simulate save).
     * Since no persistence, simply redisplay with updated quantities.
     */
    @PostMapping
    public String saveGroceryList(
            @RequestParam Long mealPlanId,
            @RequestParam(value = "ingredientIds") List<Long> ingredientIds,
            @RequestParam(value = "quantities") List<Double> quantities,
            Model model) {

        List<MealPlan> mealPlans = mealPlanService.findAll();
        model.addAttribute("mealPlans", mealPlans);
        model.addAttribute("selectedMealPlanId", mealPlanId);

        // Generate fresh grocery list
        List<GroceryListEntry> groceryList = groceryListService.generateGroceryList(mealPlanId);

        // Map entries by ingredientId for easy updates
        var entryMap = groceryList.stream()
                .collect(java.util.stream.Collectors.toMap(GroceryListEntry::getIngredientId, e -> e));

        // Update quantities from POST-ed values
        for (int i = 0; i < ingredientIds.size(); i++) {
            Long ingId = ingredientIds.get(i);
            double qty = quantities.get(i);
            GroceryListEntry entry = entryMap.get(ingId);
            if (entry != null) {
                entry.setQuantity(qty);
            }
        }

        model.addAttribute("groceryList", groceryList);

        // Do NOT persist grocery list per requirements

        return "grocerylist/list";
    }
}
