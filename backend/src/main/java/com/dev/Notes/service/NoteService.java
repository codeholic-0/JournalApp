package com.dev.Notes.service;

import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dev.Notes.dto.request.NoteRequest;
import com.dev.Notes.dto.response.NoteResponse;
import com.dev.Notes.exceptions.NoteOwnershipMismatchException;
import com.dev.Notes.exceptions.ResourceNotFoundException;
import com.dev.Notes.models.Note;
import com.dev.Notes.models.User;
import com.dev.Notes.repository.NoteRepository;
import com.dev.Notes.repository.UserRepository;

@Service
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public NoteService(
            NoteRepository noteRepository,
            UserRepository userRepository,
            RedisTemplate<String, Object> redisTemplate) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    private Note toNoteEntry(NoteRequest req) {
        Note entry = new Note();
        entry.setTitle(req.getTitle());
        entry.setContent(req.getContent());
        return entry;
    }

    private NoteResponse toNoteResponse(Note entry) {
        NoteResponse res = new NoteResponse();
        res.setId(entry.getId());
        res.setTitle(entry.getTitle());
        res.setContent(entry.getContent());
        res.setUsername(entry.getUsername());
        res.setCreatedAt(entry.getCreatedAt());
        res.setUpdatedAt(entry.getUpdatedAt());
        return res;
    }

    @Transactional
    public NoteResponse createNote(String username, NoteRequest req) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        var entry = toNoteEntry(req);
        entry.setUsername(username);
        var res = noteRepository.save(entry);
        user.getNoteIds().add(entry.getId());
        userRepository.save(user);
        evictNotesCache(username);
        log.info("Note created: {} for user: {}", req.getTitle(), username);
        return toNoteResponse(res);
    }

    public NoteResponse getNoteById(String username, String noteId) {
        String key = "note:" + noteId;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof NoteResponse response) {
                return response;
            }
        } catch (Exception e) {
            log.warn("Cache read error for key {}: {}", key, e.getMessage());
        }
        var entry = noteRepository
                .findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Note not found with id: " + noteId));
        if (entry.getUsername().equals(username)) {
            NoteResponse response = toNoteResponse(entry);
            try {
                redisTemplate.opsForValue().set(key, response, Duration.ofMinutes(5));
            } catch (Exception e) {
                log.warn("Cache write error for key {}: {}", key, e.getMessage());
            }
            return response;
        } else {
            log.warn("Ownership mismatch! user: {} tried to access note: {}", username, entry.getTitle());
            throw new NoteOwnershipMismatchException(username);
        }
    }

    public Page<NoteResponse> getNotesByUsername(String username, Pageable pageable) {
        if (userRepository.existsByUsername(username)) {
            return noteRepository
                    .findByUsernameOrderByCreatedAtDesc(username, pageable)
                    .map(this::toNoteResponse);
        } else {
            throw new ResourceNotFoundException(
                    "User not found with username: " + username);
        }
    }

    @Transactional
    public NoteResponse updateNote(
            String username,
            String noteId,
            NoteRequest updates) {
        var entry = noteRepository
                .findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Note not found with id: " + noteId));
        if (entry.getUsername().equals(username)) {
            if (updates.getTitle() != null)
                entry.setTitle(updates.getTitle());
            if (updates.getContent() != null)
                entry.setContent(updates.getContent());
            noteRepository.save(entry);
            evictNoteCache(noteId);
            log.info("Note: {} updated", entry.getId());
            return toNoteResponse(entry);
        } else {
            log.warn("Ownership mismatch! user: {} tried to access note: {}", username, entry.getId());
            throw new NoteOwnershipMismatchException(username);
        }
    }

    @Transactional
    public void deleteNote(String username, String noteId) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with username: " + username));
        var entry = noteRepository
                .findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Note not found with id: " + noteId));
        if (entry.getUsername().equals(username)) {
            noteRepository.delete(entry);
            user.getNoteIds().remove(noteId);
            userRepository.save(user);
            evictNoteCache(noteId);
            evictNotesCache(username);
            log.info("note {} deleted for user: {}", entry.getId(), username);
        } else {
            log.warn("Ownership mismatch! user: {} tried to access note: {}", username, entry.getId());
            throw new NoteOwnershipMismatchException(username);
        }
    }

    private void evictNoteCache(String noteId) {
        try {
            redisTemplate.delete("note:" + noteId);
        } catch (Exception e) {
            log.warn("Failed to evict note cache for {}: {}", noteId, e.getMessage());
        }
    }

    private void evictNotesCache(String username) {
        try {
            Set<String> keys = redisTemplate.keys("notes:" + username + ":page:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Failed to evict notes cache for {}: {}", username, e.getMessage());
        }
    }
}
