package com.dev.JournalApp.service;

import com.dev.JournalApp.dto.JournalRequest;
import com.dev.JournalApp.dto.JournalResponse;
import com.dev.JournalApp.exceptions.JournalOwnershipMismatchException;
import com.dev.JournalApp.exceptions.ResourceNotFoundException;
import com.dev.JournalApp.models.JournalEntry;
import com.dev.JournalApp.models.User;
import com.dev.JournalApp.repository.JournalRepository;
import com.dev.JournalApp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class JournalService {

    private final JournalRepository journalRepository;
    private final UserRepository userRepository;

    public JournalService(
            JournalRepository journalRepository,
            UserRepository userRepository) {
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
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
        log.info("Journal created: {} for user: {}", req.getTitle(), username);
        return toJournalResponse(res);
    }

    public JournalResponse getJournalById(String username, String journalId) {
        var entry = journalRepository
                .findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Journal not found with id: " + journalId));
        if (entry.getUsername().equals(username)) {
            return toJournalResponse(entry);
        } else {
            log.warn("Ownership mismatch! user: {} tried to access journal: {}", username, entry.getTitle());
            throw new JournalOwnershipMismatchException(username);
        }
    }

    public List<JournalResponse> getJournalsByUsername(String username) {
        if (userRepository.existsByUsername(username)) {
            return journalRepository
                    .findByUsernameOrderByCreatedAtDesc(username)
                    .stream()
                    .map(this::toJournalResponse)
                    .toList();
        } else {
            throw new ResourceNotFoundException(
                    "User not found with username: " + username);
        }
    }

    public JournalResponse updateJournal(
            String username,
            String journalId,
            JournalRequest updates) {
        var entry = journalRepository
                .findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Journal not found with id: " + journalId));
        if (entry.getUsername().equals(username)) {
            if (entry.getTitle() != null)
                entry.setTitle(updates.getTitle());
            if (entry.getContent() != null)
                entry.setContent(updates.getContent());
            journalRepository.save(entry);
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
            log.info("Journal {} deleted for user: {}", entry.getId(), username);
        } else {
            log.warn("Ownership mismatch! user: {} tried to access journal: {}", username, entry.getId());
            throw new JournalOwnershipMismatchException(username);
        }
    }
}
