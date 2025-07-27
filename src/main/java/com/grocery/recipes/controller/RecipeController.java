package com.grocery.recipes.controller;

import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.model.RecipeIngredient;
import com.grocery.recipes.service.IngredientService;
import com.grocery.recipes.service.RecipeService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Iterator;
import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/recipes")
public class RecipeController {

    private final RecipeService recipeService;
    private final IngredientService ingredientService;

    public RecipeController(RecipeService recipeService, IngredientService ingredientService) {
        this.recipeService = recipeService;
        this.ingredientService = ingredientService;
    }

    @GetMapping
    public String listRecipes(Model model) {
        model.addAttribute("recipes", recipeService.findAll());
        return "recipes/list";
    }

    @GetMapping("/new")
    public String newRecipeForm(Model model) {
        Recipe recipe = new Recipe();
        recipe.getIngredients().add(new RecipeIngredient()); // add one empty row
        model.addAttribute("recipe", recipe);
        model.addAttribute("allIngredients", ingredientService.findAll());
        return "recipes/form";
    }

    @PostMapping
    public String createRecipe(@Valid @ModelAttribute("recipe") Recipe recipe, BindingResult result, Model model) {
        cleanEmptyRecipeIngredients(recipe);
        if (result.hasErrors()) {
            model.addAttribute("allIngredients", ingredientService.findAll());
            return "recipes/form";
        }
        linkRecipeInRecipeIngredients(recipe);
        recipeService.save(recipe);
        return "redirect:/recipes";
    }

    @GetMapping("/{id}/edit")
    public String editRecipeForm(@PathVariable("id") Long id, Model model) {
        Recipe recipe = recipeService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid recipe Id:" + id));
        model.addAttribute("recipe", recipe);
        model.addAttribute("allIngredients", ingredientService.findAll());
        return "recipes/form";
    }

    @PostMapping("/{id}")
    public String updateRecipe(@PathVariable("id") Long id, @Valid @ModelAttribute("recipe") Recipe recipe, BindingResult result, Model model) {
        cleanEmptyRecipeIngredients(recipe);
        if (result.hasErrors()) {
            model.addAttribute("allIngredients", ingredientService.findAll());
            return "recipes/form";
        }
        recipe.setId(id);
        linkRecipeInRecipeIngredients(recipe);
        recipeService.save(recipe);
        return "redirect:/recipes";
    }

    @PostMapping("/{id}/delete")
    public String deleteRecipe(@PathVariable("id") Long id) {
        recipeService.deleteById(id);
        return "redirect:/recipes";
    }

    /**
     * Remove any RecipeIngredient with no Ingredient selected or zero quantity to avoid errors.
     */
    private void cleanEmptyRecipeIngredients(Recipe recipe) {
        if (recipe.getIngredients() == null) return;
        Iterator<RecipeIngredient> iterator = recipe.getIngredients().iterator();
        while (iterator.hasNext()) {
            RecipeIngredient ri = iterator.next();
            if (ri.getIngredient() == null || ri.getIngredient().getId() == null || ri.getQuantity() <= 0) {
                iterator.remove();
            }
        }
    }

    /**
     * Set the back-reference recipe field in each RecipeIngredient to the current Recipe.
     */
    private void linkRecipeInRecipeIngredients(Recipe recipe) {
        if (recipe.getIngredients() != null) {
            for (RecipeIngredient ri : recipe.getIngredients()) {
                ri.setRecipe(recipe);
            }
        }
    }
}
