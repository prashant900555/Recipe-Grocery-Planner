package com.grocery.recipes.service;

import com.grocery.recipes.model.RefreshToken;
import com.grocery.recipes.model.User;
import com.grocery.recipes.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.hibernate.StaleObjectStateException;

@Service
public class AuthServiceImpl implements AuthService {

    private final RefreshTokenRepository refreshTokenRepository;

    // 14 days in milliseconds
    private final Long refreshTokenDurationMs = 14 * 24 * 60 * 60 * 1000L;

    public AuthServiceImpl(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public RefreshToken createRefreshToken(User user, String deviceInfo) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(LocalDateTime.now().plusSeconds(refreshTokenDurationMs / 1000));
        refreshToken.setDeviceInfo(deviceInfo);
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setActive(true);

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isExpired()) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    @Override
    @Transactional
    public void deleteByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    @Override
    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    }

    @Override
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceInfo) {
        try {
            refreshTokenRepository.delete(oldToken);
        } catch (StaleObjectStateException | org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // Log and ignore if already deleted
        }
        return createRefreshToken(oldToken.getUser(), deviceInfo);
    }
}
