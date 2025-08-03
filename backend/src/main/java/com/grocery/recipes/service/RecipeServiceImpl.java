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
            Ingredient dbIng = ingredientRepository.findById(ri.getIngredient().getId())
                    .orElseThrow(() -> new RuntimeException("Ingredient not found!"));
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
}
