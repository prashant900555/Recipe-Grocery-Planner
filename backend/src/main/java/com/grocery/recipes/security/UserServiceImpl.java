package com.grocery.recipes.security;

import com.grocery.recipes.model.User;
import com.grocery.recipes.repository.UserRepository;
import com.grocery.recipes.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createUser(User user) {
        // Hash the password
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findByPhoneAreaCodeAndPhoneNumber(String phoneAreaCode, String phoneNumber) {
        return userRepository.findByPhoneAreaCodeAndPhoneNumber(phoneAreaCode, phoneNumber);
    }

    @Override
    public Optional<User> findByEmailOrPhone(String email, String phoneAreaCode, String phoneNumber) {
        return userRepository.findByEmailOrPhoneAreaCodeAndPhoneNumber(email, phoneAreaCode, phoneNumber);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phoneAreaCode, String phoneNumber) {
        return userRepository.existsByPhoneAreaCodeAndPhoneNumber(phoneAreaCode, phoneNumber);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
