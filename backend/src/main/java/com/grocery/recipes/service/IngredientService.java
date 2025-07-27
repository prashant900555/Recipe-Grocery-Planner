package com.grocery.recipes.service;

import com.grocery.recipes.model.Ingredient;

import java.util.List;
import java.util.Optional;

public interface IngredientService {
    List<Ingredient> findAll();
    Optional<Ingredient> findById(Long id);
    Ingredient save(Ingredient ingredient);
    void deleteById(Long id);
}
