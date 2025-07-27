package com.grocery.recipes.service;

import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.repository.MealPlanItemRepository;
import com.grocery.recipes.repository.RecipeRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RecipeServiceImpl implements RecipeService {

    private final RecipeRepository recipeRepository;
    private final MealPlanItemRepository mealPlanItemRepository;

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
    public Recipe save(Recipe recipe) {
        // Due to cascade ALL on RecipeIngredient in Recipe entity,
        // saving the Recipe will save ingredients as well.
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
