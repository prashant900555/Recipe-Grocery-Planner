package com.grocery.recipes.service;

import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.model.RecipeIngredient;
import com.grocery.recipes.repository.IngredientRepository;
import com.grocery.recipes.repository.MealPlanItemRepository;
import com.grocery.recipes.repository.RecipeIngredientRepository;
import com.grocery.recipes.repository.RecipeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RecipeServiceImpl implements RecipeService {

    private final RecipeRepository recipeRepository;
    private final MealPlanItemRepository mealPlanItemRepository;
    @Autowired
    private IngredientRepository ingredientRepository;
    @Autowired
    private RecipeIngredientRepository recipeIngredientRepository;

    public RecipeServiceImpl(RecipeRepository recipeRepository, MealPlanItemRepository mealPlanItemRepository) {
        this.recipeRepository = recipeRepository;
        this.mealPlanItemRepository = mealPlanItemRepository;
    }

    @Override
    public List<Recipe> findAll() {
        return recipeRepository.findAll();
    }

    @Override
    public Optional<Recipe> findById(Long id) {
        return recipeRepository.findById(id);
    }

    @Override
    @Transactional
    public Recipe save(Recipe recipe) {
        List<RecipeIngredient> newIngredients = new ArrayList<>();
        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient dbIng;

            // Check if ingredient has an ID and exists in database
            if (ri.getIngredient() != null && ri.getIngredient().getId() != null) {
                Optional<Ingredient> existingIngredient = ingredientRepository.findById(ri.getIngredient().getId());
                if (existingIngredient.isPresent()) {
                    // Use existing ingredient from database
                    dbIng = existingIngredient.get();
                } else {
                    // ID provided but not found - create new ingredient
                    Ingredient newIngredient = new Ingredient();
                    newIngredient.setName(ri.getIngredient().getName());
                    dbIng = ingredientRepository.save(newIngredient);
                }
            } else {
                // No ID provided - create new ingredient
                Ingredient newIngredient = new Ingredient();
                newIngredient.setName(ri.getIngredient() != null ? ri.getIngredient().getName() : "");
                dbIng = ingredientRepository.save(newIngredient);
            }

            RecipeIngredient newRI = new RecipeIngredient();
            newRI.setRecipe(recipe); // for bi-directional mapping
            newRI.setIngredient(dbIng); // attach managed entity
            newRI.setQuantity(ri.getQuantity());
            newRI.setUnit(ri.getUnit());
            newRI.setNote(ri.getNote());
            // DO NOT set newRI.setId(...)!
            newIngredients.add(newRI);
        }
        recipe.setIngredients(newIngredients);
        return recipeRepository.save(recipe);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        int usageCount = mealPlanItemRepository.countByRecipeId(id);
        if (usageCount > 0) {
            throw new IllegalStateException("Recipe is used in one or more meal plans and cannot be deleted.");
        }
        recipeRepository.deleteById(id);
    }

    // NEW: Update servings and scale ingredient quantities in database
    @Override
    @Transactional
    public void updateServingsAndScaleQuantities(Long id, Integer newServings) {
        if (newServings == null || newServings < 1 || newServings > 100) {
            throw new IllegalArgumentException("Servings must be between 1 and 100");
        }

        Optional<Recipe> recipeOpt = recipeRepository.findById(id);
        if (recipeOpt.isEmpty()) {
            throw new IllegalArgumentException("Recipe not found with id " + id);
        }

        Recipe recipe = recipeOpt.get();
        Integer originalServings = recipe.getServings();

        if (originalServings == null || originalServings == 0) {
            originalServings = 1; // Fallback to prevent division by zero
        }

        // Scale all ingredient quantities based on servings change
        if (recipe.getIngredients() != null && !recipe.getIngredients().isEmpty()) {
            for (RecipeIngredient ingredient : recipe.getIngredients()) {
                double originalQuantity = ingredient.getQuantity();
                double scaledQuantity = (originalQuantity * newServings) / originalServings;
                ingredient.setQuantity(scaledQuantity);
            }
        }

        // Update servings
        recipe.setServings(newServings);

        // Save the recipe with updated servings and scaled quantities
        recipeRepository.save(recipe);
    }

    @Override
    public void setAllRecipesDefaultServings(int defaultServings) {
        List<Recipe> allRecipes = findAll();
        for (Recipe recipe : allRecipes) {
            updateServingsAndScaleQuantities(recipe.getId(), defaultServings);
        }
    }
}
