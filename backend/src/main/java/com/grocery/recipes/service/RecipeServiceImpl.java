package com.grocery.recipes.service;

import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.model.RecipeIngredient;
import com.grocery.recipes.model.User;
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
    public List<Recipe> findAllByUser(User user) {
        return recipeRepository.findByUser(user);
    }

    @Override
    public Optional<Recipe> findById(Long id) {
        return recipeRepository.findById(id);
    }

    @Override
    public Optional<Recipe> findByIdAndUser(Long id, User user) {
        return recipeRepository.findByIdAndUser(id, user);
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

    @Override
    @Transactional
    public void deleteByIdAndUser(Long id, User user) {
        // Check if recipe belongs to user and if it's used in meal plans
        Optional<Recipe> recipeOpt = recipeRepository.findByIdAndUser(id, user);
        if (recipeOpt.isEmpty()) {
            throw new IllegalArgumentException("Recipe not found or doesn't belong to user");
        }

        int usageCount = mealPlanItemRepository.countByRecipeId(id);
        if (usageCount > 0) {
            throw new IllegalStateException("Recipe is used in one or more meal plans and cannot be deleted.");
        }
        recipeRepository.deleteByIdAndUser(id, user);
    }

    @Override
    public boolean existsByIdAndUser(Long id, User user) {
        return recipeRepository.existsByIdAndUser(id, user);
    }

    @Override
    @Transactional
    public void updateServingsAndScaleQuantities(Long id, Integer servings, User user) {
        Optional<Recipe> recipeOpt = recipeRepository.findByIdAndUser(id, user);
        if (recipeOpt.isEmpty()) {
            throw new IllegalArgumentException("Recipe not found or doesn't belong to user");
        }

        Recipe recipe = recipeOpt.get();
        if (servings == null || servings < 1 || servings > 100) {
            throw new IllegalArgumentException("Servings must be between 1 and 100");
        }

        // Calculate scaling factor
        double factor = (double) servings / recipe.getServings();

        // Update servings
        recipe.setServings(servings);

        // Scale ingredient quantities
        for (RecipeIngredient ri : recipe.getIngredients()) {
            ri.setQuantity(ri.getQuantity() * factor);
        }

        recipeRepository.save(recipe);
    }

    @Override
    @Transactional
    public void setAllRecipesDefaultServings(Integer servings, User user) {
        if (servings == null || servings < 1 || servings > 100) {
            throw new IllegalArgumentException("Servings must be between 1 and 100");
        }

        List<Recipe> userRecipes = recipeRepository.findByUser(user);
        for (Recipe recipe : userRecipes) {
            double factor = (double) servings / recipe.getServings();
            recipe.setServings(servings);

            // Scale ingredient quantities
            for (RecipeIngredient ri : recipe.getIngredients()) {
                ri.setQuantity(ri.getQuantity() * factor);
            }
        }

        recipeRepository.saveAll(userRecipes);
    }
}
