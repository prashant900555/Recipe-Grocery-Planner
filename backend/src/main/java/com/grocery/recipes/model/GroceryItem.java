package com.grocery.recipes.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroceryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The generic item name (can be ingredient or any user-specified thing)
    @Column(nullable = false)
    private String itemName;

    private String unit; // Unit of the item (e.g., "g", "pcs", "l")
    private double quantity; // Quantity of the item
    private String note; // Any user note (e.g., "organic", "brand")
    private String dateAdded; // Date item was added (string for simplicity DD-MM-YYYY)
    private boolean purchased = false; // Active or purchased
    private String datePurchased; // Date marked as purchased (null if not purchased)

    // NEW: User association
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}
