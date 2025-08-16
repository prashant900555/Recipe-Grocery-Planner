package com.grocery.recipes.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Recipe name is required")
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Min(value = 1, message = "Servings must be at least 1")
    @Max(value = 100, message = "Servings cannot exceed 100")
    @Column(nullable = false)
    private Integer servings;

    // **FIX: Add JsonIgnore to prevent infinite recursion with User**
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore  // This prevents User from being serialized with Recipe
    private User user;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<RecipeIngredient> ingredients = new ArrayList<>();
}
