package com.grocery.recipes.repository;

import com.grocery.recipes.model.GroceryList;
import com.grocery.recipes.model.GroceryListEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface GroceryListRepository extends JpaRepository<GroceryList, Long> {
    // Find a GroceryListEntry by its id
    @Query("SELECT e FROM GroceryListEntry e WHERE e.id = :entryId")
    Optional<GroceryListEntry> findEntryById(Long entryId);

    // Save a GroceryListEntry (simply delegates to EntityManager; will work if you mark it as a Spring bean)
    @SuppressWarnings("unchecked")
    default GroceryListEntry saveEntry(GroceryListEntry entry) {
        // The default method reuses the EntityManager managed by Spring Data JPA repositories
        return ((JpaRepository<GroceryListEntry, Long>) (Object) this).save(entry);
    }
}
