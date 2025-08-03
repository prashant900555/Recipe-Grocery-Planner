package com.grocery.recipes.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

@Deprecated
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroceryListEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ingredientId;
    private String ingredientName;
    private String unit;
    private double quantity;

    private String note;     // E.g. "organic brand"
    private boolean purchased = false; // checked off?
}
