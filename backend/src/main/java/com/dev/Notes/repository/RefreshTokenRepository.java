package com.dev.Notes.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.dev.Notes.models.RefreshToken;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {
    Optional<RefreshToken> findByTokenHash(String hash);

    void deleteAllByUsername(String username);
}
