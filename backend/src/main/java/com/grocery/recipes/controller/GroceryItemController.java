package com.grocery.recipes.controller;

import com.grocery.recipes.model.GroceryItem;
import com.grocery.recipes.service.GroceryItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/groceryitems")
@CrossOrigin(origins = "*")
public class GroceryItemController {

    private final GroceryItemService groceryItemService;

    public GroceryItemController(GroceryItemService groceryItemService) {
        this.groceryItemService = groceryItemService;
    }

    // Get all ACTIVE (unpurchased) items
    @GetMapping("/active")
    public List<GroceryItem> getActiveItems() {
        return groceryItemService.findAllActive();
    }

    // Get all PURCHASED items
    @GetMapping("/purchased")
    public List<GroceryItem> getPurchasedItems() {
        return groceryItemService.findAllPurchased();
    }

    // Add item (with merge-by-quantity logic)
    @PostMapping
    public ResponseEntity<GroceryItem> addItem(@RequestBody GroceryItem item) {
        GroceryItem result = groceryItemService.addItem(item);
        return ResponseEntity.ok(result);
    }

    // Update item (edit name, note, unit, quantity, dateAdded)
    @PutMapping("/{id}")
    public ResponseEntity<GroceryItem> updateItem(@PathVariable Long id, @RequestBody GroceryItem item) {
        item.setId(id);
        GroceryItem updated = groceryItemService.updateItem(item);
        return ResponseEntity.ok(updated);
    }

    // Delete item
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        groceryItemService.deleteItem(id);
        return ResponseEntity.ok().build();
    }

    // Mark batch of items as purchased
    @PostMapping("/mark-purchased")
    public ResponseEntity<Void> markPurchased(@RequestBody List<Long> itemIds) {
        groceryItemService.markItemsPurchased(itemIds);
        return ResponseEntity.ok().build();
    }

    // Undo: Move batch of purchased items back to active
    @PostMapping("/undo-purchased")
    public ResponseEntity<Void> undoPurchased(@RequestBody List<Long> itemIds) {
        groceryItemService.markItemsUnpurchased(itemIds);
        return ResponseEntity.ok().build();
    }

    // Generate from recipes (adds ingredients as items to the global grocery list, merges by quantity)
    @PostMapping("/generate-from-recipes")
    public ResponseEntity<List<GroceryItem>> generateFromRecipes(@RequestBody GenerateRequest req) {
        List<GroceryItem> items = groceryItemService.generateFromRecipes(req.getIds(), req.getDate());
        return ResponseEntity.ok(items);
    }

    // Generate from meal plans (adds ingredients as items to the global grocery list, merges by quantity)
    @PostMapping("/generate-from-mealplans")
    public ResponseEntity<List<GroceryItem>> generateFromMealPlans(@RequestBody GenerateRequest req) {
        List<GroceryItem> items = groceryItemService.generateFromMealPlans(req.getIds(), req.getDate());
        return ResponseEntity.ok(items);
    }

    // Utility wrapper class for batch generate requests
    public static class GenerateRequest {
        private List<Long> ids;
        private String date;

        public List<Long> getIds() {
            return ids;
        }

        public void setIds(List<Long> ids) {
            this.ids = ids;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }
    }
}
