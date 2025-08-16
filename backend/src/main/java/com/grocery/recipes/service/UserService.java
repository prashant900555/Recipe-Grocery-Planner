package com.grocery.recipes.service;

import com.grocery.recipes.model.User;

import java.util.Optional;

public interface UserService {
    User createUser(User user);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneAreaCodeAndPhoneNumber(String phoneAreaCode, String phoneNumber);
    Optional<User> findByEmailOrPhone(String email, String phoneAreaCode, String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phoneAreaCode, String phoneNumber);
    Optional<User> findById(Long id);
}
