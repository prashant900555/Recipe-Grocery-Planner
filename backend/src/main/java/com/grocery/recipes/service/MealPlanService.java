package com.grocery.recipes.service;

import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.model.User;

import java.util.List;
import java.util.Optional;

public interface MealPlanService {
    List<MealPlan> findAll();
    List<MealPlan> findAllByUser(User user);
    Optional<MealPlan> findById(Long id);
    Optional<MealPlan> findByIdAndUser(Long id, User user);
    MealPlan save(MealPlan mealPlan);
    void deleteById(Long id);
    void deleteByIdAndUser(Long id, User user);
    boolean existsByIdAndUser(Long id, User user);
}
