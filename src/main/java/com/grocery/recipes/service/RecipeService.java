package com.grocery.recipes.service;

import com.grocery.recipes.model.Recipe;

import java.util.List;
import java.util.Optional;

public interface RecipeService {
    List<Recipe> findAll();
    Optional<Recipe> findById(Long id);
    Recipe save(Recipe recipe);
    void deleteById(Long id);
}
