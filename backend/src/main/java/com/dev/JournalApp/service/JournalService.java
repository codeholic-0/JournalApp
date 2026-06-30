package com.dev.JournalApp.service;

import com.dev.JournalApp.dto.request.JournalRequest;
import com.dev.JournalApp.dto.response.JournalResponse;
import com.dev.JournalApp.exceptions.JournalOwnershipMismatchException;
import com.dev.JournalApp.exceptions.ResourceNotFoundException;
import com.dev.JournalApp.models.JournalEntry;
import com.dev.JournalApp.models.User;
import com.dev.JournalApp.repository.JournalRepository;
import com.dev.JournalApp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class JournalService {

    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public JournalService(
            JournalRepository journalRepository,
            UserRepository userRepository,
            RedisTemplate<String, Object> redisTemplate) {
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    private JournalEntry toJournalEntry(JournalRequest req) {
        JournalEntry entry = new JournalEntry();
        entry.setTitle(req.getTitle());
        entry.setContent(req.getContent());
        return entry;
    }

    private JournalResponse toJournalResponse(JournalEntry entry) {
        JournalResponse res = new JournalResponse();
        res.setId(entry.getId());
        res.setTitle(entry.getTitle());
        res.setContent(entry.getContent());
        res.setUsername(entry.getUsername());
        res.setCreatedAt(entry.getCreatedAt());
        res.setUpdatedAt(entry.getUpdatedAt());
        return res;
    }

    @Transactional
    public JournalResponse createJournal(String username, JournalRequest req) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        var entry = toJournalEntry(req);
        entry.setUsername(username);
        var res = journalRepository.save(entry);
        user.getJournals().add(entry.getId());
        userRepository.save(user);
        evictJournalsCache(username);
        log.info("Journal created: {} for user: {}", req.getTitle(), username);
        return toJournalResponse(res);
    }

    public JournalResponse getJournalById(String username, String journalId) {
        String key = "journal:" + journalId;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof JournalResponse response) {
                return response;
            }
        } catch (Exception e) {
            log.warn("Cache read error for key {}: {}", key, e.getMessage());
        }
        var entry = journalRepository
                .findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Journal not found with id: " + journalId));
        if (entry.getUsername().equals(username)) {
            JournalResponse response = toJournalResponse(entry);
            try {
                redisTemplate.opsForValue().set(key, response, Duration.ofMinutes(5));
            } catch (Exception e) {
                log.warn("Cache write error for key {}: {}", key, e.getMessage());
            }
            return response;
        } else {
            log.warn("Ownership mismatch! user: {} tried to access journal: {}", username, entry.getTitle());
            throw new JournalOwnershipMismatchException(username);
        }
    }

    public Page<JournalResponse> getJournalsByUsername(String username, Pageable pageable) {
        if (userRepository.existsByUsername(username)) {
            return journalRepository
                    .findByUsernameOrderByCreatedAtDesc(username, pageable)
                    .map(this::toJournalResponse);
        } else {
            throw new ResourceNotFoundException(
                    "User not found with username: " + username);
        }
    }

    @Transactional
    public JournalResponse updateJournal(
            String username,
            String journalId,
            JournalRequest updates) {
        var entry = journalRepository
                .findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Journal not found with id: " + journalId));
        if (entry.getUsername().equals(username)) {
            if (updates.getTitle() != null)
                entry.setTitle(updates.getTitle());
            if (updates.getContent() != null)
                entry.setContent(updates.getContent());
            journalRepository.save(entry);
            evictJournalCache(journalId);
            log.info("Journal: {} updated", entry.getId());
            return toJournalResponse(entry);
        } else {
            log.warn("Ownership mismatch! user: {} tried to access journal: {}", username, entry.getId());
            throw new JournalOwnershipMismatchException(username);
        }
    }

    @Transactional
    public void deleteJournal(String username, String journalId) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with username: " + username));
        var entry = journalRepository
                .findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Journal not found with id: " + journalId));
        if (entry.getUsername().equals(username)) {
            journalRepository.delete(entry);
            user.getJournals().remove(journalId);
            userRepository.save(user);
            evictJournalCache(journalId);
            evictJournalsCache(username);
            log.info("Journal {} deleted for user: {}", entry.getId(), username);
        } else {
            log.warn("Ownership mismatch! user: {} tried to access journal: {}", username, entry.getId());
            throw new JournalOwnershipMismatchException(username);
        }
    }

    private void evictJournalCache(String journalId) {
        try {
            redisTemplate.delete("journal:" + journalId);
        } catch (Exception e) {
            log.warn("Failed to evict journal cache for {}: {}", journalId, e.getMessage());
        }
    }

    private void evictJournalsCache(String username) {
        try {
            Set<String> keys = redisTemplate.keys("journals:" + username + ":page:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Failed to evict journals cache for {}: {}", username, e.getMessage());
        }
    }
}
