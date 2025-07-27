package com.grocery.recipes.service;

import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.repository.MealPlanRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MealPlanServiceImpl implements MealPlanService {

    private final MealPlanRepository mealPlanRepository;

    public MealPlanServiceImpl(MealPlanRepository mealPlanRepository) {
        this.mealPlanRepository = mealPlanRepository;
    }

    @Override
    public List<MealPlan> findAll() {
        return mealPlanRepository.findAll();
    }

    @Override
    public Optional<MealPlan> findById(Long id) {
        return mealPlanRepository.findById(id);
    }

    @Override
    public MealPlan save(MealPlan mealPlan) {
        mealPlan.getItems().forEach(item -> item.setMealPlan(mealPlan));
        return mealPlanRepository.save(mealPlan);
    }

    @Override
    public void deleteById(Long id) {
        mealPlanRepository.deleteById(id);
    }
}
