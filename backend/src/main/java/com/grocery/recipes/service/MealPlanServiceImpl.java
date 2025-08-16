package com.grocery.recipes.service;

import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.model.User;
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
    public List<MealPlan> findAllByUser(User user) {
        return mealPlanRepository.findByUser(user);
    }

    @Override
    public Optional<MealPlan> findById(Long id) {
        return mealPlanRepository.findById(id);
    }

    @Override
    public Optional<MealPlan> findByIdAndUser(Long id, User user) {
        return mealPlanRepository.findByIdAndUser(id, user);
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

    @Override
    public void deleteByIdAndUser(Long id, User user) {
        mealPlanRepository.deleteByIdAndUser(id, user);
    }

    @Override
    public boolean existsByIdAndUser(Long id, User user) {
        return mealPlanRepository.existsByIdAndUser(id, user);
    }
}
