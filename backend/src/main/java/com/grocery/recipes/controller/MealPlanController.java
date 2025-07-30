package com.grocery.recipes.controller;

import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.service.MealPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/mealplans")
@CrossOrigin(origins = "*")
public class MealPlanController {

    private final MealPlanService mealPlanService;

    public MealPlanController(MealPlanService mealPlanService) {
        this.mealPlanService = mealPlanService;
    }

    // GET /api/mealplans
    @GetMapping
    public List<MealPlan> getAllMealPlans() {
        return mealPlanService.findAll();
    }

    // GET /api/mealplans/{id}
    @GetMapping("/{id}")
    public ResponseEntity<MealPlan> getMealPlan(@PathVariable Long id) {
        Optional<MealPlan> mealPlanOpt = mealPlanService.findById(id);
        return mealPlanOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST /api/mealplans
    @PostMapping
    public ResponseEntity<MealPlan> createMealPlan(@RequestBody MealPlan mealPlan) {
        MealPlan saved = mealPlanService.save(mealPlan);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // PUT /api/mealplans/{id}
    @PutMapping("/{id}")
    public ResponseEntity<MealPlan> updateMealPlan(
            @PathVariable Long id,
            @RequestBody MealPlan mealPlan) {
        if (!mealPlanService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        mealPlan.setId(id);
        MealPlan updated = mealPlanService.save(mealPlan);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/mealplans/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMealPlan(@PathVariable Long id) {
        try {
            mealPlanService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }
}
