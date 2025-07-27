package com.grocery.recipes.service;

import com.grocery.recipes.model.MealPlan;
import java.util.List;
import java.util.Optional;

public interface MealPlanService {
    List<MealPlan> findAll();
    Optional<MealPlan> findById(Long id);
    MealPlan save(MealPlan mealPlan);
    void deleteById(Long id);
}
