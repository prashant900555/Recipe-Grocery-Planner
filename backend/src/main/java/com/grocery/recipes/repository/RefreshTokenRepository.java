package com.grocery.recipes.repository;

import com.grocery.recipes.model.RefreshToken;
import com.grocery.recipes.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUser(User user);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = ?1")
    void deleteByUser(User user);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < ?1")
    void deleteByExpiryDateBefore(LocalDateTime dateTime);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isActive = false WHERE rt.user = ?1")
    void deactivateAllByUser(User user);
}
