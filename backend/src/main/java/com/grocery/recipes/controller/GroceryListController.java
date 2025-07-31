package com.grocery.recipes.controller;

import com.grocery.recipes.model.GroceryList;
import com.grocery.recipes.service.GroceryListService;
import com.grocery.recipes.service.GroceryListServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

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

}
