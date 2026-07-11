package com.dev.Notes.service;

import java.time.Duration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dev.Notes.dto.request.UserPreferencesRequest;
import com.dev.Notes.dto.response.UserPreferencesResponse;
import com.dev.Notes.exceptions.ResourceNotFoundException;
import com.dev.Notes.models.User;
import com.dev.Notes.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class UserPreferencesService {
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public UserPreferencesService(UserRepository userRepository, RedisTemplate<String, Object> redisTemplate){
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    private UserPreferencesResponse toResponse(User.Preferences prefs){
        return new UserPreferencesResponse(prefs.getTheme(), prefs.getAccent(), prefs.getFontScale(), prefs.getDensity());
    }

    private void evictUserCache(String username) {
        try {
            redisTemplate.delete("user:prefs:" + username);
        } catch (Exception e) {
            log.warn("Failed to evict user cache for {}: {}", username, e.getMessage());
        }
    }

    public UserPreferencesResponse getUserPreferences(String username){
        String key = "user:prefs:" + username; 
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if(cached instanceof UserPreferencesResponse res){
                return res;
            }
        } catch (Exception e) {
            log.warn("Cache read error for key {}: {}", key, e.getMessage());
        }

        var user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new ResourceNotFoundException("User with username: " + username + " not found"));

        var prefs = user.getPrefs();
        if (prefs == null) {
            prefs = new User.Preferences();
        }
        UserPreferencesResponse response = toResponse(prefs);
        try {
            redisTemplate.opsForValue().set(key, response, Duration.ofMinutes(5));
        } catch (Exception e) {
            log.warn("Cache write error for key {}: {}", key, e.getMessage());
        }

        log.info("User preferences Fetched: {}", username);

        return response;
    }

    @Transactional
    public UserPreferencesResponse updateUserPreferences(String username, UserPreferencesRequest req){
        var user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new ResourceNotFoundException("User with username: " + username + " not found"));
        var prefs = user.getPrefs();
        if(req.getTheme() != null)
            prefs.setTheme(req.getTheme());
        if(req.getAccent() != null)
            prefs.setAccent(req.getAccent());
        if(req.getDensity() != null)
            prefs.setDensity(req.getDensity());
        if(req.getFontScale() != null)
            prefs.setFontScale(req.getFontScale());
        user.setPrefs(prefs);
        userRepository.save(user);
        evictUserCache(username);
        log.info("Preferences updated for user: {}", username);
        return toResponse(prefs);
    }
}
