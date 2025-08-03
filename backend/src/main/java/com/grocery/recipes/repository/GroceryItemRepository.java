package com.grocery.recipes.repository;

import com.grocery.recipes.model.GroceryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroceryItemRepository extends JpaRepository<GroceryItem, Long> {

    List<GroceryItem> findByPurchasedFalseOrderByDateAddedDesc();

    List<GroceryItem> findByPurchasedTrueOrderByDatePurchasedDesc();

    // For merging: fetch by itemName (case-insensitive), unit, note, and not purchased
    @Query("SELECT g FROM GroceryItem g WHERE LOWER(g.itemName) = LOWER(:itemName) AND g.unit = :unit AND " +
            "(g.note IS NULL OR g.note = :note OR :note IS NULL OR LOWER(g.note) = LOWER(:note)) AND g.purchased = false")
    List<GroceryItem> findMergableActive(String itemName, String unit, String note);

    // For uniqueness checks if needed, use equalsIgnoreCase and trim in service logic
    Optional<GroceryItem> findById(Long id);

}
