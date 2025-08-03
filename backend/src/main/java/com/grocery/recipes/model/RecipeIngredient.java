package com.grocery.recipes.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class RecipeIngredient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recipe_id")
    @JsonBackReference
    private Recipe recipe;

    @ManyToOne
    @JoinColumn(name = "ingredient_id")
    @NotNull(message = "Ingredient must be selected")
    private Ingredient ingredient;

    @Min(value = 0, message = "Quantity must be positive")
    private double quantity; // e.g. 250

    @Column(nullable = false)
    private String unit;

    private String note; // Optional prep instructions, e.g., "chopped"
}
