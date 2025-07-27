package com.grocery.recipes.service;

import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.repository.IngredientRepository;
import com.grocery.recipes.repository.RecipeIngredientRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class IngredientServiceImpl implements IngredientService {

    private final IngredientRepository ingredientRepository;

    private final RecipeIngredientRepository recipeIngredientRepository;

    public IngredientServiceImpl(IngredientRepository ingredientRepository, RecipeIngredientRepository recipeIngredientRepository) {
        this.ingredientRepository = ingredientRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
    }

    @Override
    public List<Ingredient> findAll() {
        return ingredientRepository.findAll();
    }

    @Override
    public Optional<Ingredient> findById(Long id) {
        return ingredientRepository.findById(id);
    }

    @Override
    public Ingredient save(Ingredient ingredient) {
        return ingredientRepository.save(ingredient);
    }

    @Transactional
    public void deleteById(Long id) {
        int usageCount = recipeIngredientRepository.countByIngredientId(id);
        if (usageCount > 0) {
            throw new IllegalStateException("Ingredient is used in one or more recipes and cannot be deleted.");
        }
        ingredientRepository.deleteById(id);
    }
}
