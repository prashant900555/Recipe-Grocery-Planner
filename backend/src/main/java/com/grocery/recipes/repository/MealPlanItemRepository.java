package com.grocery.recipes.repository;

import com.grocery.recipes.model.MealPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MealPlanItemRepository extends JpaRepository<MealPlanItem, Long> {
    int countByRecipeId(Long recipeId);
    void deleteByRecipeId(Long recipeId);
}
