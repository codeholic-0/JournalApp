package com.dev.JournalApp.service;

import com.dev.JournalApp.dto.request.UserRequest;
import com.dev.JournalApp.dto.response.UserResponse;
import com.dev.JournalApp.exceptions.ResourceNotFoundException;
import com.dev.JournalApp.models.User;
import com.dev.JournalApp.repository.JournalRepository;
import com.dev.JournalApp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final JournalRepository journalRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            JournalRepository journalRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.journalRepository = journalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private UserResponse toUserResponse(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setRoles(user.getRoles());
        return res;
    }

    @Cacheable(value = "user", key = "#username")
    public UserResponse getUserByUsername(String username) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        log.debug("User Fetched: {}", username);
        return toUserResponse(user);
    }

    @Transactional
    @CacheEvict(value = "user", key = "#username")
    public UserResponse updateUserPassword(String username, UserRequest req) {
        var old = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        old.setPassword(passwordEncoder.encode(req.getPassword()));
        old = userRepository.save(old);
        log.info("Password updated for user: {}", username);
        return toUserResponse(old);
    }

    @Transactional
    @CacheEvict(value = "user", key = "#username")
    public void deleteUser(String username) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        journalRepository.deleteAllById(user.getJournals());
        userRepository.delete(user);
        log.info("User {} deleted.", username);
    }
}
