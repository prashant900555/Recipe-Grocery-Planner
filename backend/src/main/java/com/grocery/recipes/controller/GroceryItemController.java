package com.grocery.recipes.controller;

import com.grocery.recipes.model.GroceryItem;
import com.grocery.recipes.model.User;
import com.grocery.recipes.service.GroceryItemService;
import com.grocery.recipes.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groceryitems")
@CrossOrigin(origins = "*")
public class GroceryItemController {

    private final GroceryItemService groceryItemService;
    private final UserService userService;

    public GroceryItemController(GroceryItemService groceryItemService, UserService userService) {
        this.groceryItemService = groceryItemService;
        this.userService = userService;
    }

    // Get all ACTIVE (unpurchased) items for authenticated user
    @GetMapping("/active")
    public List<GroceryItem> getActiveItems(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return groceryItemService.findAllActiveByUser(user);
    }

    // Get all PURCHASED items for authenticated user
    @GetMapping("/purchased")
    public List<GroceryItem> getPurchasedItems(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        return groceryItemService.findAllPurchasedByUser(user);
    }

    // Add item with merge-by-quantity logic for authenticated user
    @PostMapping
    public ResponseEntity<GroceryItem> addItem(@RequestBody GroceryItem item, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        item.setUser(user);
        GroceryItem result = groceryItemService.addItem(item);
        return ResponseEntity.ok(result);
    }

    // Update item (edit name, note, unit, quantity, dateAdded) for authenticated user
    @PutMapping("/{id}")
    public ResponseEntity<GroceryItem> updateItem(@PathVariable Long id,
                                                  @RequestBody GroceryItem item,
                                                  Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        item.setId(id);
        item.setUser(user);
        GroceryItem updated = groceryItemService.updateItem(item);
        return ResponseEntity.ok(updated);
    }

    // Delete item for authenticated user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        groceryItemService.deleteItemByIdAndUser(id, user);
        return ResponseEntity.ok().build();
    }

    // Mark batch of items as purchased for authenticated user
    @PostMapping("/mark-purchased")
    public ResponseEntity<Void> markPurchased(@RequestBody List<Long> itemIds, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        groceryItemService.markItemsPurchasedByUser(itemIds, user);
        return ResponseEntity.ok().build();
    }

    // Undo: Move batch of purchased items back to active for authenticated user
    @PostMapping("/undo-purchased")
    public ResponseEntity<Void> undoPurchased(@RequestBody List<Long> itemIds, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        groceryItemService.markItemsUnpurchasedByUser(itemIds, user);
        return ResponseEntity.ok().build();
    }

    // Generate from recipes: adds ingredients as items to the user's grocery list, merges by quantity
    @PostMapping("/generate-from-recipes")
    public ResponseEntity<List<GroceryItem>> generateFromRecipes(@RequestBody GenerateRequest req, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        List<GroceryItem> items = groceryItemService.generateFromRecipesByUser(req.getIds(), req.getDate(), user);
        return ResponseEntity.ok(items);
    }

    // Generate from meal plans: adds ingredients as items to the user's grocery list, merges by quantity
    @PostMapping("/generate-from-mealplans")
    public ResponseEntity<List<GroceryItem>> generateFromMealPlans(@RequestBody GenerateRequest req, Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        List<GroceryItem> items = groceryItemService.generateFromMealPlansByUser(req.getIds(), req.getDate(), user);
        return ResponseEntity.ok(items);
    }

    private User getUserFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        return userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
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
