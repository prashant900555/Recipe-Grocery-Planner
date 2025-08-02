package com.grocery.recipes.controller;

import com.grocery.recipes.model.GroceryList;
import com.grocery.recipes.service.GroceryListService;
import com.grocery.recipes.service.GroceryListServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grocerylists")
@CrossOrigin(origins = "*")
public class GroceryListController {

    private final GroceryListService groceryListService;

    public GroceryListController(GroceryListService groceryListService) {
        this.groceryListService = groceryListService;
    }

    @GetMapping
    public List<GroceryList> getAllGroceryLists() {
        return groceryListService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroceryList> getGroceryList(@PathVariable Long id) {
        Optional<GroceryList> groceryListOpt = groceryListService.findById(id);
        return groceryListOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GroceryList> createGroceryList(@RequestBody GroceryList groceryList) {
        GroceryList saved = groceryListService.save(groceryList);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroceryList> updateGroceryList(
            @PathVariable Long id,
            @RequestBody GroceryList groceryList
    ) {
        if (!groceryListService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        groceryList.setId(id);
        GroceryList updated = groceryListService.save(groceryList);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroceryList(@PathVariable Long id) {
        groceryListService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate/mealplan/{mealPlanId}")
    public ResponseEntity<GroceryList> generateFromMealPlan(
            @PathVariable Long mealPlanId,
            @RequestParam String name,
            @RequestParam String date) {
        GroceryList glist = ((GroceryListServiceImpl) groceryListService)
                .generateFromMealPlan(mealPlanId, name, date);
        // Do NOT save here! Just return the generated grocery list
        return new ResponseEntity<>(glist, HttpStatus.OK);
    }

    @PostMapping("/generaterecipes")
    public ResponseEntity<?> generateFromRecipes(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("recipeIds") || !payload.containsKey("name") || !payload.containsKey("date")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("recipeIds, name, and date are required.");
            }
            List<?> recipeIdsRaw = (List<?>) payload.get("recipeIds");
            List<Long> recipeIds = recipeIdsRaw.stream().map(id -> ((Number) id).longValue()).toList();
            String listName = (String) payload.get("name");
            String date = (String) payload.get("date");

            GroceryList glist = groceryListService.generateFromRecipes(recipeIds, listName, date);
            return new ResponseEntity<>(glist, HttpStatus.CREATED);
        } catch (Exception e) {
            // Print stacktrace for diagnosis
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }



}
