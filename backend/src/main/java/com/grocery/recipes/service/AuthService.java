package com.grocery.recipes.service;

import com.grocery.recipes.model.RefreshToken;
import com.grocery.recipes.model.User;

import java.util.Optional;

public interface AuthService {
    RefreshToken createRefreshToken(User user, String deviceInfo);
    Optional<RefreshToken> findByToken(String token);
    RefreshToken verifyExpiration(RefreshToken token);
    void deleteByUser(User user);
    void deleteExpiredTokens();
    RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceInfo);
}
