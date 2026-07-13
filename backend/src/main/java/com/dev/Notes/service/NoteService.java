package com.dev.Notes.service;

import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dev.Notes.dto.request.NoteRequest;
import com.dev.Notes.dto.request.SortOrderRequest;
import com.dev.Notes.dto.response.NoteResponse;
import com.dev.Notes.enumeration.NoteType;
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
    @Lazy
    private final WorkspaceService workspaceService;
    private final RedisTemplate<String, Object> redisTemplate;

    public NoteService(
            NoteRepository noteRepository,
            UserRepository userRepository,
            WorkspaceService workspaceService,
            RedisTemplate<String, Object> redisTemplate) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.workspaceService = workspaceService;
        this.redisTemplate = redisTemplate;
    }

    private Note toNote(NoteRequest req) {
        Note note = new Note();
        note.setTitle(req.getTitle());
        note.setContent(req.getContent());
        note.setFolderId(req.getFolderId());
        note.setNoteType(req.getNoteType() != null ? req.getNoteType() : NoteType.BASIC);
        if (req.getContentJson() != null) {
            note.setContentJson(req.getContentJson());
        }
        return note;
    }

    private NoteResponse toNoteResponse(Note note) {
        NoteResponse res = new NoteResponse();
        res.setId(note.getId());
        res.setTitle(note.getTitle());
        res.setContent(note.getContent());
        res.setNoteType(note.getNoteType());
        res.setFavorite(note.isFavorite());
        res.setPinned(note.isPinned());
        res.setContentJson(note.getContentJson());
        res.setUsername(note.getUsername());
        res.setCreatedAt(note.getCreatedAt());
        res.setUpdatedAt(note.getUpdatedAt());
        res.setDeletedAt(note.getDeletedAt());
        res.setFolderId(note.getFolderId());
        res.setSortOrder(note.getSortOrder());
        return res;
    }

    private Note validateOwnerShip(String username, String noteId) {
        var note = noteRepository
                .findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Note not found with id: " + noteId));
        if (note.getUsername().equals(username)) {
            return note;
        } else {
            log.warn("Ownership mismatch! user: {} tried to access note: {}", username, note.getId());
            throw new NoteOwnershipMismatchException(username);
        }
    }

    @Transactional
    public NoteResponse createNote(String username, NoteRequest req) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username: " + username + " not found"));
        var note = toNote(req);
        note.setUsername(username);
        note.setWorkspaceId(req.getWorkspaceId() != null
                ? req.getWorkspaceId()
                : workspaceService.getOrCreateInternalWorkspace(username).getId());
        note.setFolderId(req.getFolderId());
        noteRepository.save(note);
        user.getNoteIds().add(note.getId());
        userRepository.save(user);
        evictNotesCache(username);
        log.info("Note created: {} for user: {}", req.getTitle(), username);
        if (note.getContentJson() == null) {
            note.setContentJson(Map.of("type", "doc", "content", List.of(Map.of("type", "paragraph"))));
        }
        var res = noteRepository.save(note);
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

        var note = validateOwnerShip(username, noteId);

        NoteResponse response = toNoteResponse(note);
        try {
            redisTemplate.opsForValue().set(key, response, Duration.ofMinutes(5));
        } catch (Exception e) {
            log.warn("Cache write error for key {}: {}", key, e.getMessage());
        }
        return response;

    }

    public Page<NoteResponse> getNotesByUsername(String username, String workspaceId, Pageable pageable) {
        if (!userRepository.existsByUsername(username))
            throw new ResourceNotFoundException("User not found: " + username);

        if (workspaceId != null) {
            return noteRepository
                    .findByUsernameAndWorkspaceIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(username,
                            workspaceId, pageable)
                    .map(this::toNoteResponse);
        }

        return noteRepository
                .findByUsernameAndDeletedAtIsNullOrderByCreatedAtDesc(username, pageable)
                .map(this::toNoteResponse);
    }

    public Page<NoteResponse> getNotesByUsername(String username, String workspaceId, String folderId,
            Pageable pageable) {
        if (!userRepository.existsByUsername(username))
            throw new ResourceNotFoundException("User not found: " + username);

        if (workspaceId != null) {
            return noteRepository
                    .findByUsernameAndWorkspaceIdAndFolderIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(username,
                            workspaceId, folderId, pageable)
                    .map(this::toNoteResponse);
        }

        return noteRepository
                .findByUsernameAndDeletedAtIsNullOrderByCreatedAtDesc(username, pageable)
                .map(this::toNoteResponse);
    }

    public Page<NoteResponse> getUnfiledNotes(String username, String workspaceId, Pageable pageable) {
        if (!userRepository.existsByUsername(username)) {
            throw new ResourceNotFoundException("User not found: " + username);
        }
        if (workspaceId != null) {
            return noteRepository
                    .findByUsernameAndWorkspaceIdAndFolderIdIsNullAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(
                            username, workspaceId, pageable)
                    .map(this::toNoteResponse);
        }
        return noteRepository
                .findByUsernameAndFolderIdIsNullAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(username, pageable)
                .map(this::toNoteResponse);
    }

    public long getUnfiledCount(String username, String workspaceId) {
        if (workspaceId != null)
            return noteRepository.countByUsernameAndWorkspaceIdAndFolderIdIsNullAndDeletedAtIsNull(username,
                    workspaceId);
        return noteRepository.countByUsernameAndFolderIdIsNullAndDeletedAtIsNull(username);
    }

    @Transactional
    public NoteResponse updateNote(
            String username,
            String noteId,
            NoteRequest updates) {
        var note = validateOwnerShip(username, noteId);

        if (updates.getTitle() != null)
            note.setTitle(updates.getTitle());
        if (updates.getContent() != null)
            note.setContent(updates.getContent());
        if (updates.getNoteType() != null)
            note.setNoteType(updates.getNoteType());
        if (updates.getFolderId() != null)
            note.setFolderId(updates.getFolderId());
        if (updates.getContentJson() != null)
            note.setContentJson(updates.getContentJson());
        noteRepository.save(note);
        evictNoteCache(noteId);
        log.info("Note: {} updated", note.getId());
        return toNoteResponse(note);
    }

    @Transactional
    public void deleteNote(String username, String noteId) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with username: " + username));
        var note = validateOwnerShip(username, noteId);
        note.setDeletedAt(LocalDateTime.now());
        noteRepository.save(note);
        user.getNoteIds().remove(noteId);
        userRepository.save(user);
        evictNoteCache(noteId);
        evictNotesCache(username);
        log.info("note {} moved to trash for user: {}", note.getId(), username);

    }

    public Page<NoteResponse> getTrashedNotes(String username, Pageable pageable) {
        if (userRepository.existsByUsername(username)) {
            return noteRepository
                    .findByUsernameAndDeletedAtIsNotNullOrderByCreatedAtDesc(username, pageable)
                    .map(this::toNoteResponse);
        } else {
            throw new ResourceNotFoundException(
                    "User not found with username: " + username);
        }
    }

    @Transactional
    public NoteResponse restoreNote(String username, String noteId) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with username: " + username));
        var note = validateOwnerShip(username, noteId);
        note.setDeletedAt(null);
        noteRepository.save(note);
        user.getNoteIds().add(noteId);
        userRepository.save(user);
        evictNoteCache(noteId);
        evictNotesCache(username);
        log.info("note {} restored for user: {}", note.getId(), username);
        return toNoteResponse(note);
    }

    @Transactional
    public void purgeNote(String username, String noteId) {
        var user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with username: " + username));
        var note = validateOwnerShip(username, noteId);
        noteRepository.delete(note);
        user.getNoteIds().remove(noteId);
        userRepository.save(user);
        evictNoteCache(noteId);
        evictNotesCache(username);
        log.info("note {} permanently deleted for user: {}", note.getId(), username);
    }

    public NoteResponse toggleFavorite(String username, String noteId) {
        var note = validateOwnerShip(username, noteId);
        note.setFavorite(!note.isFavorite());
        noteRepository.save(note);
        evictNoteCache(noteId);
        evictNotesCache(username);
        log.info("note {} {} favourite for user: {}", note.getId(), note.isFavorite() ? "marked" : "unmarked",
                username);
        return toNoteResponse(note);
    }

    public NoteResponse togglePinned(String username, String noteId) {
        var note = validateOwnerShip(username, noteId);
        note.setPinned(!note.isPinned());
        noteRepository.save(note);
        evictNoteCache(noteId);
        evictNotesCache(username);
        log.info("note {} {}  for user: {}", note.getId(), note.isPinned() ? "pinned" : "unpinned",
                username);
        return toNoteResponse(note);
    }

    @Transactional
    public NoteResponse updateSortOrder(String username, String noteId, SortOrderRequest req) {
        var note = validateOwnerShip(username, noteId);
        note.setSortOrder(req.getSortOrder());
        noteRepository.save(note);
        evictNoteCache(noteId);
        evictNotesCache(username);
        log.info("Sort order updated for note: {}", noteId);
        return toNoteResponse(note);
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
