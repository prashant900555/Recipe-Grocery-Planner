package com.grocery.recipes.repository;

import com.grocery.recipes.model.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {
    int countByIngredientId(Long ingredientId);

    // Additional query methods can be implemented as needed
}
