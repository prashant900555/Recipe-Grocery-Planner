package com.grocery.recipes.repository;

import com.grocery.recipes.model.GroceryList;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroceryListRepository extends JpaRepository<GroceryList, Long> {
}
