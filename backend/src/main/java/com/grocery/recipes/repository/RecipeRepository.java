package com.grocery.recipes.repository;

import com.grocery.recipes.model.Recipe;
import com.grocery.recipes.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByUser(User user);
    Optional<Recipe> findByIdAndUser(Long id, User user);
    boolean existsByIdAndUser(Long id, User user);
    void deleteByIdAndUser(Long id, User user);
}
