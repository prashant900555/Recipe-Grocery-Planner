package com.grocery.recipes.repository;

import com.grocery.recipes.model.GroceryItem;
import com.grocery.recipes.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroceryItemRepository extends JpaRepository<GroceryItem, Long> {

    List<GroceryItem> findByPurchasedFalseOrderByDateAddedDesc();
    List<GroceryItem> findByUserAndPurchasedFalseOrderByDateAddedDesc(User user);

    List<GroceryItem> findByPurchasedTrueOrderByDatePurchasedDesc();
    List<GroceryItem> findByUserAndPurchasedTrueOrderByDatePurchasedDesc(User user);

    // For merging: fetch by itemName (case-insensitive), unit, note, and not purchased for specific user
    @Query("SELECT g FROM GroceryItem g WHERE LOWER(g.itemName) = LOWER(?1) AND g.unit = ?2 AND " +
            "(g.note IS NULL OR g.note = ?3 OR ?3 IS NULL OR LOWER(g.note) = LOWER(?3)) AND " +
            "g.purchased = false AND g.user = ?4")
    List<GroceryItem> findMergableActiveByUser(String itemName, String unit, String note, User user);

    Optional<GroceryItem> findByIdAndUser(Long id, User user);

    void deleteByIdAndUser(Long id, User user);

    List<GroceryItem> findByIdInAndUser(List<Long> ids, User user);
}
