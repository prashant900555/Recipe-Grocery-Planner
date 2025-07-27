package com.grocery.recipes.controller;

import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.model.MealPlanItem;
import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.service.MealPlanService;
import com.grocery.recipes.service.RecipeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/mealplans")
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final RecipeService recipeService;

    public MealPlanController(MealPlanService mealPlanService, RecipeService recipeService) {
        this.mealPlanService = mealPlanService;
        this.recipeService = recipeService;
    }

    @GetMapping
    public String listMealPlans(Model model) {
        model.addAttribute("mealplans", mealPlanService.findAll());
        return "mealplans/list";
    }

    @GetMapping("/new")
    public String newMealPlanForm(Model model) {
        MealPlan mealPlan = new MealPlan();

        model.addAttribute("mealPlan", mealPlan);
        model.addAttribute("allRecipes", recipeService.findAll());
        model.addAttribute("numDays", 3);
        model.addAttribute("recipesPerDay", 3);

        return "mealplans/form";
    }

    @PostMapping
    public String createMealPlan(@Valid @ModelAttribute("mealPlan") MealPlan mealPlan,
                                 BindingResult result, Model model,
                                 @RequestParam("numDays") int numDays,
                                 @RequestParam("recipesPerDay") int recipesPerDay,
                                 @RequestParam(required = false, name="recipeIds") List<Long> recipeIds,
                                 @RequestParam(required = false, name="dates") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dates
    ) {
        if (result.hasErrors()) {
            model.addAttribute("allRecipes", recipeService.findAll());
            model.addAttribute("numDays", numDays);
            model.addAttribute("recipesPerDay", recipesPerDay);
            return "mealplans/form";
        }

        mealPlan.getItems().clear();

        if (recipeIds != null && dates != null && recipeIds.size() == dates.size()) {
            for (int i = 0; i < recipeIds.size(); i++) {
                Recipe recipe = recipeService.findById(recipeIds.get(i)).orElse(null);
                if (recipe != null) {
                    MealPlanItem item = new MealPlanItem();
                    item.setRecipe(recipe);
                    item.setDate(dates.get(i));
                    mealPlan.getItems().add(item);
                }
            }
        }

        mealPlanService.save(mealPlan);
        return "redirect:/mealplans";
    }

    @GetMapping("/{id}/edit")
    public String editMealPlanForm(@PathVariable("id") Long id, Model model) {
        MealPlan mealPlan = mealPlanService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid meal plan Id:" + id));

        // Extract unique dates (sorted)
        Set<LocalDate> uniqueDates = mealPlan.getItems().stream()
                .map(MealPlanItem::getDate)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(TreeSet::new));

        int numDays = uniqueDates.size();

        // Calculate max recipes per day
        int recipesPerDay = 0;
        Map<LocalDate, Long> countsPerDay = mealPlan.getItems().stream()
                .filter(item -> item.getDate() != null)
                .collect(Collectors.groupingBy(MealPlanItem::getDate, Collectors.counting()));

        if (!countsPerDay.isEmpty()) {
            recipesPerDay = countsPerDay.values().stream().max(Long::compare).orElse(0L).intValue();
        } else {
            recipesPerDay = 3; // fallback default
            numDays = 3;
        }

        model.addAttribute("mealPlan", mealPlan);
        model.addAttribute("allRecipes", recipeService.findAll());
        model.addAttribute("numDays", numDays);
        model.addAttribute("recipesPerDay", recipesPerDay);

        // Pass list of unique dates sorted to match recipes mapping in JS
        model.addAttribute("mealPlanDates", new ArrayList<>(uniqueDates));

        return "mealplans/form";
    }
    @PostMapping("/{id}")
    public String updateMealPlan(@PathVariable("id") Long id,
                                 @Valid @ModelAttribute("mealPlan") MealPlan mealPlan,
                                 BindingResult result,
                                 Model model,
                                 @RequestParam("numDays") int numDays,
                                 @RequestParam("recipesPerDay") int recipesPerDay,
                                 @RequestParam(required = false, name="recipeIds") List<Long> recipeIds,
                                 @RequestParam(required = false, name="dates") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dates
    ) {
        if (result.hasErrors()) {
            model.addAttribute("allRecipes", recipeService.findAll());
            model.addAttribute("numDays", numDays);
            model.addAttribute("recipesPerDay", recipesPerDay);
            return "mealplans/form";
        }

        mealPlan.setId(id);
        mealPlan.getItems().clear();

        if (recipeIds != null && dates != null && recipeIds.size() == dates.size()) {
            for (int i = 0; i < recipeIds.size(); i++) {
                Recipe recipe = recipeService.findById(recipeIds.get(i)).orElse(null);
                if (recipe != null) {
                    MealPlanItem item = new MealPlanItem();
                    item.setRecipe(recipe);
                    item.setDate(dates.get(i));
                    mealPlan.getItems().add(item);
                }
            }
        }

        mealPlanService.save(mealPlan);
        return "redirect:/mealplans";
    }

    @PostMapping("/{id}/delete")
    public String deleteMealPlan(@PathVariable("id") Long id) {
        mealPlanService.deleteById(id);
        return "redirect:/mealplans";
    }

    @GetMapping("/{id}")
    public String viewMealPlan(@PathVariable("id") Long id, Model model) {
        MealPlan mealPlan = mealPlanService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid meal plan Id:" + id));

        // Generate sorted unique dates for grouping in template
        Set<LocalDate> uniqueDates = mealPlan.getItems().stream()
                .map(MealPlanItem::getDate)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(java.util.TreeSet::new));

        model.addAttribute("mealPlan", mealPlan);
        model.addAttribute("mealPlanDates", uniqueDates);
        return "mealplans/detail";
    }
}
