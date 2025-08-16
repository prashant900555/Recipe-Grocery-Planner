package com.grocery.recipes.repository;

import com.grocery.recipes.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneAreaCodeAndPhoneNumber(String phoneAreaCode, String phoneNumber);

    boolean existsByEmail(String email);

    boolean existsByPhoneAreaCodeAndPhoneNumber(String phoneAreaCode, String phoneNumber);

    Optional<User> findByEmailOrPhoneAreaCodeAndPhoneNumber(String email, String phoneAreaCode, String phoneNumber);
}
