package com.grocery.recipes.controller;

import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.model.User;
import com.grocery.recipes.service.RecipeService;
import com.grocery.recipes.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    private final RecipeService recipeService;
    private final UserService userService;

    public RecipeController(RecipeService recipeService, UserService userService) {
        this.recipeService = recipeService;
        this.userService = userService;
    }

    // GET /api/recipes - Get all recipes for authenticated user
    @GetMapping
    @CrossOrigin(origins = "*")
    public ResponseEntity<List<Recipe>> getAllRecipes(Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            List<Recipe> recipes = recipeService.findAllByUser(user);
            return ResponseEntity.ok(recipes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // GET /api/recipes/{id} - Get specific recipe for authenticated user
    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            Optional<Recipe> recipeOpt = recipeService.findByIdAndUser(id, user);
            return recipeOpt.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // POST /api/recipes - Create recipe for authenticated user
    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@RequestBody Recipe recipe, Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            recipe.setUser(user);
            Recipe saved = recipeService.save(recipe);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // PUT /api/recipes/{id} - Update recipe for authenticated user
    @PutMapping("/{id}")
    public ResponseEntity<Recipe> updateRecipe(@PathVariable Long id,
                                               @RequestBody Recipe recipe,
                                               Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            if (!recipeService.existsByIdAndUser(id, user)) {
                return ResponseEntity.notFound().build();
            }

            recipe.setId(id);
            recipe.setUser(user);
            Recipe updated = recipeService.save(recipe);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // DELETE /api/recipes/{id} - Delete recipe for authenticated user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            recipeService.deleteByIdAndUser(id, user);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PATCH /api/recipes/{id}/servings - Updates servings and scales ingredient quantities
    @PatchMapping("/{id}/servings")
    public ResponseEntity<Void> updateServingsAndQuantities(@PathVariable Long id,
                                                            @RequestBody Map<String, Integer> payload,
                                                            Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            if (!payload.containsKey("servings")) {
                return ResponseEntity.badRequest().build();
            }

            recipeService.updateServingsAndScaleQuantities(id, payload.get("servings"), user);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PATCH /api/recipes/default-servings - Sets all user's recipes to default servings (2)
    @PatchMapping("/default-servings")
    @CrossOrigin(origins = "*")
    public ResponseEntity<Void> setAllRecipesDefaultServings(@RequestBody Map<String, Integer> payload,
                                                             Authentication authentication) {
        try {
            User user = getUserFromAuthentication(authentication);
            if (!payload.containsKey("servings")) {
                return ResponseEntity.badRequest().build();
            }

            recipeService.setAllRecipesDefaultServings(payload.get("servings"), user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private User getUserFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        return userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
