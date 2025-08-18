package com.grocery.recipes.controller;

import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.service.IngredientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ingredients")
@CrossOrigin(origins = "*")
public class IngredientController {

    private final IngredientService ingredientService;

    public IngredientController(IngredientService ingredientService) {
        this.ingredientService = ingredientService;
    }

    // GET /api/ingredients
    @GetMapping
    public List<Ingredient> getAllIngredients() {
        return ingredientService.findAll();
    }

    // GET /api/ingredients/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Ingredient> getIngredient(@PathVariable Long id) {
        Optional<Ingredient> ingredientOpt = ingredientService.findById(id);
        return ingredientOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST /api/ingredients
    @PostMapping
    public ResponseEntity<Ingredient> createIngredient(@RequestBody Ingredient ingredient) {
        Ingredient saved = ingredientService.save(ingredient);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // PUT /api/ingredients/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Ingredient> updateIngredient(@PathVariable Long id,
                                                       @RequestBody Ingredient ingredient) {
        if (!ingredientService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }

        ingredient.setId(id);
        Ingredient updated = ingredientService.save(ingredient);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/ingredients/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIngredient(@PathVariable Long id) {
        try {
            ingredientService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }
}
