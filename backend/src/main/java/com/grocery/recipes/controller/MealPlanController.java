package com.grocery.recipes.controller;

import com.grocery.recipes.model.MealPlan;
import com.grocery.recipes.model.User;
import com.grocery.recipes.service.MealPlanService;
import com.grocery.recipes.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/mealplans")
@CrossOrigin(origins = "*")
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final UserService userService;

    public MealPlanController(MealPlanService mealPlanService, UserService userService) {
        this.mealPlanService = mealPlanService;
        this.userService = userService;
    }

    // GET /api/mealplans - Get all meal plans for authenticated user
    @GetMapping
    public List<MealPlan> getAllMealPlans(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return mealPlanService.findAllByUser(user);
    }

    // GET /api/mealplans/{id} - Get specific meal plan for authenticated user
    @GetMapping("/{id}")
    public ResponseEntity<MealPlan> getMealPlan(@PathVariable Long id, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        Optional<MealPlan> mealPlanOpt = mealPlanService.findByIdAndUser(id, user);
        return mealPlanOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST /api/mealplans - Create meal plan for authenticated user
    @PostMapping
    public ResponseEntity<MealPlan> createMealPlan(@RequestBody MealPlan mealPlan, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        mealPlan.setUser(user);
        MealPlan saved = mealPlanService.save(mealPlan);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // PUT /api/mealplans/{id} - Update meal plan for authenticated user
    @PutMapping("/{id}")
    public ResponseEntity<MealPlan> updateMealPlan(@PathVariable Long id,
                                                   @RequestBody MealPlan mealPlan,
                                                   Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        if (!mealPlanService.existsByIdAndUser(id, user)) {
            return ResponseEntity.notFound().build();
        }

        mealPlan.setId(id);
        mealPlan.setUser(user);
        MealPlan updated = mealPlanService.save(mealPlan);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/mealplans/{id} - Delete meal plan for authenticated user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMealPlan(@PathVariable Long id, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        try {
            mealPlanService.deleteByIdAndUser(id, user);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    private User getUserFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        return userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
