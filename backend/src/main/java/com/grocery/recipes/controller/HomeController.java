package com.grocery.recipes.controller;

import com.grocery.recipes.service.IngredientService;
import com.grocery.recipes.service.MealPlanService;
import com.grocery.recipes.service.RecipeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/home")
@CrossOrigin(origins = "*")
public class HomeController {
    private final RecipeService recipeService;
    private final MealPlanService mealPlanService;
    private final IngredientService ingredientService;

    public HomeController(
            RecipeService recipeService,
            MealPlanService mealPlanService,
            IngredientService ingredientService
    ) {
        this.recipeService = recipeService;
        this.mealPlanService = mealPlanService;
        this.ingredientService = ingredientService;
    }

    @GetMapping("/summary")
    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRecipes", recipeService.findAll().size());
        summary.put("totalMealPlans", mealPlanService.findAll().size());
        summary.put("totalIngredients", ingredientService.findAll().size());
        // Add other summary data as desired
        return summary;
    }
}
