package com.grocery.recipes.service;

import com.grocery.recipes.model.GroceryList;
import com.grocery.recipes.repository.GroceryListRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GroceryListServiceImpl implements GroceryListService {

    private final GroceryListRepository groceryListRepository;

    public GroceryListServiceImpl(GroceryListRepository groceryListRepository) {
        this.groceryListRepository = groceryListRepository;
    }

    @Override
    public List<GroceryList> findAll() {
        return groceryListRepository.findAll();
    }

    @Override
    public Optional<GroceryList> findById(Long id) {
        return groceryListRepository.findById(id);
    }

    @Override
    public GroceryList save(GroceryList groceryList) {
        return groceryListRepository.save(groceryList);
    }

    @Override
    public void deleteById(Long id) {
        groceryListRepository.deleteById(id);
    }
}
