package com.dev.JournalApp.service;

import com.dev.JournalApp.dto.request.UserRequest;
import com.dev.JournalApp.dto.response.UserResponse;
import com.dev.JournalApp.exceptions.ResourceNotFoundException;
import com.dev.JournalApp.models.User;
import com.dev.JournalApp.repository.JournalRepository;
import com.dev.JournalApp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final JournalRepository journalRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;

    public UserService(
            UserRepository userRepository,
            JournalRepository journalRepository,
            PasswordEncoder passwordEncoder,
            RedisTemplate<String, Object> redisTemplate) {
        this.userRepository = userRepository;
        this.journalRepository = journalRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
    }

    private UserResponse toUserResponse(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setRoles(user.getRoles());
        return res;
    }

    public UserResponse getUserByUsername(String username) {
        String key = "user:" + username;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof UserResponse response) {
                return response;
            }
        } catch (Exception e) {
            log.warn("Cache read error for key {}: {}", key, e.getMessage());
        }
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        UserResponse response = toUserResponse(user);
        try {
            redisTemplate.opsForValue().set(key, response, Duration.ofMinutes(10));
        } catch (Exception e) {
            log.warn("Cache write error for key {}: {}", key, e.getMessage());
        }
        log.debug("User Fetched: {}", username);
        return response;
    }

    @Transactional
    public UserResponse updateUserPassword(String username, UserRequest req) {
        var old = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        old.setPassword(passwordEncoder.encode(req.getPassword()));
        old = userRepository.save(old);
        evictUserCache(username);
        log.info("Password updated for user: {}", username);
        return toUserResponse(old);
    }

    @Transactional
    public void deleteUser(String username) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        journalRepository.deleteAllById(user.getJournals());
        userRepository.delete(user);
        evictUserCache(username);
        log.info("User {} deleted.", username);
    }

    private void evictUserCache(String username) {
        try {
            redisTemplate.delete("user:" + username);
        } catch (Exception e) {
            log.warn("Failed to evict user cache for {}: {}", username, e.getMessage());
        }
    }
}
