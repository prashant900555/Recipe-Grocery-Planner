package com.grocery.recipes.controller;

import com.grocery.recipes.model.Ingredient;
import com.grocery.recipes.service.IngredientService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/ingredients")
public class IngredientController {

    private final IngredientService ingredientService;

    public IngredientController(IngredientService ingredientService) {
        this.ingredientService = ingredientService;
    }

    @GetMapping
    public String listIngredients(Model model) {
        model.addAttribute("ingredients", ingredientService.findAll());
        return "ingredients/list";
    }

    @GetMapping("/new")
    public String newIngredientForm(Model model) {
        model.addAttribute("ingredient", new Ingredient());
        return "ingredients/form";
    }

    @PostMapping
    public String createIngredient(@Valid @ModelAttribute("ingredient") Ingredient ingredient, BindingResult result) {
        if (result.hasErrors()) {
            return "ingredients/form";
        }
        ingredientService.save(ingredient);
        return "redirect:/ingredients";
    }

    @GetMapping("/{id}/edit")
    public String editIngredientForm(@PathVariable Long id, Model model) {
        Ingredient ingredient = ingredientService.findById(id).orElseThrow(() -> new IllegalArgumentException("Invalid ingredient Id:" + id));
        model.addAttribute("ingredient", ingredient);
        return "ingredients/form";
    }

    @PostMapping("/{id}")
    public String updateIngredient(@PathVariable Long id, @Valid @ModelAttribute("ingredient") Ingredient ingredient, BindingResult result) {
        if (result.hasErrors()) {
            return "ingredients/form";
        }
        ingredient.setId(id);
        ingredientService.save(ingredient);
        return "redirect:/ingredients";
    }

    @PostMapping("/{id}/delete")
    public String deleteIngredient(@PathVariable Long id) {
        ingredientService.deleteById(id);
        return "redirect:/ingredients";
    }
}
