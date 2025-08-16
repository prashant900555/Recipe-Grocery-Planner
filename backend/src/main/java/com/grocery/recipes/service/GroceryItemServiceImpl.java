package com.grocery.recipes.service;

import com.grocery.recipes.model.*;
import com.grocery.recipes.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroceryItemServiceImpl implements GroceryItemService {

    private final GroceryItemRepository groceryItemRepository;
    private final RecipeRepository recipeRepository;
    private final MealPlanRepository mealPlanRepository;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public GroceryItemServiceImpl(GroceryItemRepository groceryItemRepository,
                                  RecipeRepository recipeRepository,
                                  MealPlanRepository mealPlanRepository) {
        this.groceryItemRepository = groceryItemRepository;
        this.recipeRepository = recipeRepository;
        this.mealPlanRepository = mealPlanRepository;
    }

    @Override
    public List<GroceryItem> findAllActive() {
        return groceryItemRepository.findAll()
                .stream()
                .filter(i -> !i.isPurchased())
                .sorted(Comparator.comparing(GroceryItem::getDateAdded).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<GroceryItem> findAllActiveByUser(User user) {
        return groceryItemRepository.findByUserAndPurchasedFalseOrderByDateAddedDesc(user);
    }

    @Override
    public List<GroceryItem> findAllPurchased() {
        return groceryItemRepository.findAll()
                .stream()
                .filter(GroceryItem::isPurchased)
                .sorted(Comparator.comparing(GroceryItem::getDatePurchased).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<GroceryItem> findAllPurchasedByUser(User user) {
        return groceryItemRepository.findByUserAndPurchasedTrueOrderByDatePurchasedDesc(user);
    }

    @Override
    public Optional<GroceryItem> findById(Long id) {
        return groceryItemRepository.findById(id);
    }

    @Override
    @Transactional
    public GroceryItem addItem(GroceryItem item) {
        return mergeOrAddItem(item);
    }

    @Override
    @Transactional
    public GroceryItem updateItem(GroceryItem item) {
        Optional<GroceryItem> dbItemOpt = groceryItemRepository.findById(item.getId());
        if (dbItemOpt.isEmpty()) {
            throw new NoSuchElementException("Item not found with id " + item.getId());
        }

        GroceryItem dbItem = dbItemOpt.get();
        dbItem.setItemName(item.getItemName());
        dbItem.setQuantity(item.getQuantity());
        dbItem.setUnit(item.getUnit());
        dbItem.setNote(item.getNote());
        dbItem.setDateAdded(item.getDateAdded());
        return groceryItemRepository.save(dbItem);
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        groceryItemRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteItemByIdAndUser(Long id, User user) {
        groceryItemRepository.deleteByIdAndUser(id, user);
    }

    @Override
    @Transactional
    public void markItemsPurchased(List<Long> itemIds) {
        List<GroceryItem> items = groceryItemRepository.findAllById(itemIds);
        String nowStr = LocalDate.now().format(dateFormatter);
        for (GroceryItem item : items) {
            item.setPurchased(true);
            item.setDatePurchased(nowStr);
        }
        groceryItemRepository.saveAll(items);
    }

    @Override
    @Transactional
    public void markItemsPurchasedByUser(List<Long> itemIds, User user) {
        List<GroceryItem> items = groceryItemRepository.findByIdInAndUser(itemIds, user);
        String nowStr = LocalDate.now().format(dateFormatter);
        for (GroceryItem item : items) {
            item.setPurchased(true);
            item.setDatePurchased(nowStr);
        }
        groceryItemRepository.saveAll(items);
    }

    @Override
    @Transactional
    public void markItemsUnpurchased(List<Long> itemIds) {
        List<GroceryItem> items = groceryItemRepository.findAllById(itemIds);
        for (GroceryItem item : items) {
            item.setPurchased(false);
            item.setDatePurchased(null);
        }
        groceryItemRepository.saveAll(items);
    }

    @Override
    @Transactional
    public void markItemsUnpurchasedByUser(List<Long> itemIds, User user) {
        List<GroceryItem> items = groceryItemRepository.findByIdInAndUser(itemIds, user);
        for (GroceryItem item : items) {
            item.setPurchased(false);
            item.setDatePurchased(null);
        }
        groceryItemRepository.saveAll(items);
    }

    @Override
    @Transactional
    public GroceryItem mergeOrAddItem(GroceryItem newItem) {
        // Normalize name and note for matching
        String newName = newItem.getItemName().trim().toLowerCase();
        String newNote = newItem.getNote() != null ? newItem.getNote().trim().toLowerCase() : null;
        String newUnit = newItem.getUnit() != null ? newItem.getUnit().trim().toLowerCase() : null;

        // Find matching active item for the same user
        List<GroceryItem> candidates = groceryItemRepository.findMergableActiveByUser(
                newItem.getItemName(), newItem.getUnit(), newItem.getNote(), newItem.getUser());

        if (candidates.isEmpty()) {
            // New item
            if (newItem.getDateAdded() == null || newItem.getDateAdded().isEmpty()) {
                newItem.setDateAdded(LocalDate.now().format(dateFormatter));
            }
            newItem.setPurchased(false);
            return groceryItemRepository.save(newItem);
        } else {
            // Merge quantities
            GroceryItem existing = candidates.get(0);
            existing.setQuantity(existing.getQuantity() + newItem.getQuantity());
            return groceryItemRepository.save(existing);
        }
    }

    @Override
    @Transactional
    public List<GroceryItem> generateFromRecipes(List<Long> recipeIds, String date) {
        Map<String, GroceryItem> merged = new LinkedHashMap<>();
        for (Long recipeId : recipeIds) {
            Recipe recipe = recipeRepository.findById(recipeId)
                    .orElseThrow(() -> new NoSuchElementException("Recipe not found " + recipeId));
            for (RecipeIngredient ri : recipe.getIngredients()) {
                if (ri.getIngredient() == null) continue;
                String key = ri.getIngredient().getName().trim().toLowerCase() +
                        (ri.getUnit() != null ? ri.getUnit().trim().toLowerCase() : "") +
                        (ri.getNote() != null ? ri.getNote().trim().toLowerCase() : "");
                GroceryItem item = merged.get(key);
                if (item == null) {
                    GroceryItem newItem = new GroceryItem();
                    newItem.setItemName(ri.getIngredient().getName());
                    newItem.setQuantity(ri.getQuantity());
                    newItem.setUnit(ri.getUnit());
                    newItem.setNote(ri.getNote());
                    newItem.setDateAdded(date);
                    newItem.setPurchased(false);
                    merged.put(key, newItem);
                } else {
                    item.setQuantity(item.getQuantity() + ri.getQuantity());
                }
            }
        }

        List<GroceryItem> savedItems = new ArrayList<>();
        for (GroceryItem item : merged.values()) {
            GroceryItem saved = mergeOrAddItem(item);
            savedItems.add(saved);
        }
        return savedItems;
    }

    @Override
    @Transactional
    public List<GroceryItem> generateFromRecipesByUser(List<Long> recipeIds, String date, User user) {
        Map<String, GroceryItem> merged = new LinkedHashMap<>();
        for (Long recipeId : recipeIds) {
            Recipe recipe = recipeRepository.findByIdAndUser(recipeId, user)
                    .orElseThrow(() -> new NoSuchElementException("Recipe not found or doesn't belong to user: " + recipeId));
            for (RecipeIngredient ri : recipe.getIngredients()) {
                if (ri.getIngredient() == null) continue;
                String key = ri.getIngredient().getName().trim().toLowerCase() +
                        (ri.getUnit() != null ? ri.getUnit().trim().toLowerCase() : "") +
                        (ri.getNote() != null ? ri.getNote().trim().toLowerCase() : "");
                GroceryItem item = merged.get(key);
                if (item == null) {
                    GroceryItem newItem = new GroceryItem();
                    newItem.setItemName(ri.getIngredient().getName());
                    newItem.setQuantity(ri.getQuantity());
                    newItem.setUnit(ri.getUnit());
                    newItem.setNote(ri.getNote());
                    newItem.setDateAdded(date);
                    newItem.setPurchased(false);
                    newItem.setUser(user);
                    merged.put(key, newItem);
                } else {
                    item.setQuantity(item.getQuantity() + ri.getQuantity());
                }
            }
        }

        List<GroceryItem> savedItems = new ArrayList<>();
        for (GroceryItem item : merged.values()) {
            GroceryItem saved = mergeOrAddItem(item);
            savedItems.add(saved);
        }
        return savedItems;
    }

    @Override
    @Transactional
    public List<GroceryItem> generateFromMealPlans(List<Long> mealPlanIds, String date) {
        Map<String, GroceryItem> merged = new LinkedHashMap<>();
        for (Long mealPlanId : mealPlanIds) {
            MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                    .orElseThrow(() -> new NoSuchElementException("Meal Plan not found " + mealPlanId));
            for (MealPlanItem mpi : mealPlan.getItems()) {
                Recipe recipe = mpi.getRecipe();
                if (recipe == null) continue;
                for (RecipeIngredient ri : recipe.getIngredients()) {
                    if (ri.getIngredient() == null) continue;
                    String key = ri.getIngredient().getName().trim().toLowerCase() +
                            (ri.getUnit() != null ? ri.getUnit().trim().toLowerCase() : "") +
                            (ri.getNote() != null ? ri.getNote().trim().toLowerCase() : "");
                    GroceryItem item = merged.get(key);
                    if (item == null) {
                        GroceryItem newItem = new GroceryItem();
                        newItem.setItemName(ri.getIngredient().getName());
                        newItem.setQuantity(ri.getQuantity());
                        newItem.setUnit(ri.getUnit());
                        newItem.setNote(ri.getNote());
                        newItem.setDateAdded(date);
                        newItem.setPurchased(false);
                        merged.put(key, newItem);
                    } else {
                        item.setQuantity(item.getQuantity() + ri.getQuantity());
                    }
                }
            }
        }

        List<GroceryItem> savedItems = new ArrayList<>();
        for (GroceryItem item : merged.values()) {
            GroceryItem saved = mergeOrAddItem(item);
            savedItems.add(saved);
        }
        return savedItems;
    }

    @Override
    @Transactional
    public List<GroceryItem> generateFromMealPlansByUser(List<Long> mealPlanIds, String date, User user) {
        Map<String, GroceryItem> merged = new LinkedHashMap<>();
        for (Long mealPlanId : mealPlanIds) {
            MealPlan mealPlan = mealPlanRepository.findByIdAndUser(mealPlanId, user)
                    .orElseThrow(() -> new NoSuchElementException("Meal Plan not found or doesn't belong to user: " + mealPlanId));
            for (MealPlanItem mpi : mealPlan.getItems()) {
                Recipe recipe = mpi.getRecipe();
                if (recipe == null) continue;
                for (RecipeIngredient ri : recipe.getIngredients()) {
                    if (ri.getIngredient() == null) continue;
                    String key = ri.getIngredient().getName().trim().toLowerCase() +
                            (ri.getUnit() != null ? ri.getUnit().trim().toLowerCase() : "") +
                            (ri.getNote() != null ? ri.getNote().trim().toLowerCase() : "");
                    GroceryItem item = merged.get(key);
                    if (item == null) {
                        GroceryItem newItem = new GroceryItem();
                        newItem.setItemName(ri.getIngredient().getName());
                        newItem.setQuantity(ri.getQuantity());
                        newItem.setUnit(ri.getUnit());
                        newItem.setNote(ri.getNote());
                        newItem.setDateAdded(date);
                        newItem.setPurchased(false);
                        newItem.setUser(user);
                        merged.put(key, newItem);
                    } else {
                        item.setQuantity(item.getQuantity() + ri.getQuantity());
                    }
                }
            }
        }

        List<GroceryItem> savedItems = new ArrayList<>();
        for (GroceryItem item : merged.values()) {
            GroceryItem saved = mergeOrAddItem(item);
            savedItems.add(saved);
        }
        return savedItems;
    }
}
