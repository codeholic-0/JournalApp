package com.dev.JournalApp.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dev.JournalApp.exceptions.ResourceNotFoundException;
import com.dev.JournalApp.models.RefreshToken;
import com.dev.JournalApp.repository.RefreshTokenRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshExpiry;
    private static final String HASH_ALGORITHM = "SHA-256";

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
            @Value("${jwt.refresh-expiry}") long refreshExpiry) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshExpiry = refreshExpiry;
    }

    private String hashToken(String rawToken) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance(HASH_ALGORITHM).digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            log.error("SHA-256 Algorithm not found", ex);
            throw new RuntimeException("Failed to hash token", ex);
        }
    }

    @Transactional
    public String createRefreshToken(String username) {
        revokeAllTokens(username);
        String rawToken = UUID.randomUUID().toString();
        String hash = hashToken(rawToken);
        RefreshToken token = new RefreshToken();
        token.setTokenHash(hash);
        token.setUsername(username);
        token.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpiry / 1000));
        token.setRevoked(false);
        refreshTokenRepository.save(token);
        log.info("Created refresh token for user: {}", username);
        return rawToken;
    }

    public boolean validateRefreshToken(String rawToken) {
        try {
            String hash = hashToken(rawToken);
            RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                    .orElseThrow(() -> new ResourceNotFoundException("Refresh not found with hash: " + hash));
            if (token.isRevoked()) {
                log.warn("Refresh token is revoked for user: {}", token.getUsername());
                return false;
            }

            if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
                log.warn("Refresh token has expired for user: {}", token.getUsername());
                return false;
            }

            return true;
        } catch (ResourceNotFoundException e) {
            log.warn("Invalid refresh token provided!");
            return false;
        } catch (Exception e) {
            log.warn("Error validation refresh token", e);
            return false;
        }
    }

    public String extractUsername(String rawToken) {
        String hash = hashToken(rawToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid refresh token"));
        if (token.isRevoked()) {
            throw new BadCredentialsException("Refresh token revoked");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token expired");
        }
        return token.getUsername();
    }

    @Transactional
    public void revokeToken(String rawToken) {
        try {
            String hash = hashToken(rawToken);
            RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                    .orElseThrow(() -> new ResourceNotFoundException("Refresh not found with hash: " + hash));
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("Refresh token revoked for user: {}", token.getUsername());

        } catch (Exception e) {
            log.error("Failed to revoke token");
            throw new RuntimeException("Failed to revoke refresh token for user");
        }
    }

    @Transactional
    public void revokeAllTokens(String username) {
        try {
            refreshTokenRepository.deleteAllByUsername(username);
            log.info("All Refresh tokens deleted for user: {}", username);
        } catch (Exception e) {
            log.error("Failed to delete all refresh tokens for user");
            throw new RuntimeException("Failed to delete all refresh tokens for user!");
        }
    }
}
