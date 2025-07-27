package com.grocery.recipes.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        // Maps the root URL '/' to the Thymeleaf template 'index.html'
        return "index";
    }
}
