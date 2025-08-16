package com.grocery.recipes.service;

import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.model.User;

import java.util.List;
import java.util.Optional;

public interface RecipeService {
    List<Recipe> findAll();
    List<Recipe> findAllByUser(User user);
    Optional<Recipe> findById(Long id);
    Optional<Recipe> findByIdAndUser(Long id, User user);
    Recipe save(Recipe recipe);
    void deleteById(Long id);
    void deleteByIdAndUser(Long id, User user);
    boolean existsByIdAndUser(Long id, User user);
    void updateServingsAndScaleQuantities(Long id, Integer servings, User user);
    void setAllRecipesDefaultServings(Integer servings, User user);
}
