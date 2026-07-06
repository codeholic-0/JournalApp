package com.dev.Notes.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dev.Notes.dto.request.WorkspacePatchRequest;
import com.dev.Notes.dto.request.WorkspaceRequest;
import com.dev.Notes.dto.response.WorkspaceDeleteResponse;
import com.dev.Notes.dto.response.WorkspaceResponse;
import com.dev.Notes.exceptions.ResourceNotFoundException;
import com.dev.Notes.exceptions.WorkspaceConflictException;
import com.dev.Notes.exceptions.WorkspaceOwnershipMismatchException;
import com.dev.Notes.models.Note;
import com.dev.Notes.models.User;
import com.dev.Notes.models.Workspace;
import com.dev.Notes.repository.NoteRepository;
import com.dev.Notes.repository.UserRepository;
import com.dev.Notes.repository.WorkspaceRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class WorkspaceService {
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final MongoTemplate mongoTemplate;

    private final long byteThreshold;
    private static final String INTERNAL_PREFIX = "__internal_";
    private static final String CACHE_KEY_INTERNAL = "workspace:internal:";

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            UserRepository userRepository,
            NoteRepository noteRepository,
            RedisTemplate<String, Object> redisTemplate,
            MongoTemplate mongoTemplate,
            @Value("${notes.workspace.delete.byteThreshold:524288000}") long byteThreshold) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.redisTemplate = redisTemplate;
        this.mongoTemplate = mongoTemplate;
        this.byteThreshold = byteThreshold;
    }

    private WorkspaceResponse toResponse(Workspace workspace) {
        WorkspaceResponse res = new WorkspaceResponse();
        res.setId(workspace.getId());
        res.setName(workspace.getName());
        res.setColor(workspace.getColor());
        res.setIcon(workspace.getIcon());
        res.setSortOrder(workspace.getSortOrder());
        res.setCreatedAt(workspace.getCreatedAt());
        res.setUpdatedAt(workspace.getUpdatedAt());
        return res;
    }

    private Workspace validateOwnership(String username, String workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
        if (!workspace.getUsername().equals(username)) {
            throw new WorkspaceOwnershipMismatchException(username, workspace.getName());
        }
        return workspace;
    }

    @Transactional
    public WorkspaceResponse getOrCreateInternalWorkspace(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User with username: " + username + " not found"));

        String internalName = INTERNAL_PREFIX + user.getId();
        String cacheKey = CACHE_KEY_INTERNAL + username;

        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached instanceof WorkspaceResponse res) {
                return res;
            }
        } catch (Exception e) {
            log.warn("Cache read error for key {}: {}", cacheKey, e.getMessage());
        }

        var existing = workspaceRepository.findByUsernameAndName(username, internalName);
        if (existing.isPresent()) {
            WorkspaceResponse res = toResponse(existing.get());
            try {
                redisTemplate.opsForValue().set(cacheKey, res, Duration.ofMinutes(10));
            } catch (Exception e) {
                log.warn("Cache write error for key {}: {}", cacheKey, e.getMessage());
            }
            return res;
        }

        Workspace internal = new Workspace();
        internal.setUsername(username);
        internal.setName(internalName);
        internal.setIcon("folder");
        internal.setColor("#6b7280");
        workspaceRepository.save(internal);

        WorkspaceResponse response = toResponse(internal);
        try {
            redisTemplate.opsForValue().set(cacheKey, response, Duration.ofMinutes(10));
        } catch (Exception e) {
            log.warn("Cache write error for key {}: {}", cacheKey, e.getMessage());
        }
        log.info("Internal workspace created for user: {}", username);
        return response;
    }

    public WorkspaceResponse getWorkspaceById(String username, String workspaceId) {
        return toResponse(validateOwnership(username, workspaceId));
    }

    public List<WorkspaceResponse> getWorkspaces(String username, String sort, boolean includeInternal) {
        Sort sortby = switch (sort != null ? sort : "sortOrder") {
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            case "createdAt" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.ASC, "sortOrder");
        };

        return workspaceRepository.findByUsername(username, sortby)
                .stream().filter(w -> includeInternal || !w.getName().startsWith(INTERNAL_PREFIX))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public WorkspaceResponse createWorkspace(String username, WorkspaceRequest req) {
        if (workspaceRepository.existsByUsernameAndName(username, req.getName())) {
            throw new WorkspaceConflictException(
                    "Workspace '" + req.getName() + "' already exists for user: " + username);
        }

        Workspace workspace = new Workspace();
        workspace.setUsername(username);
        workspace.setName(req.getName());
        workspace.setColor(req.getColor());
        workspace.setIcon(req.getIcon());
        workspace.setSortOrder(String.valueOf(System.currentTimeMillis()));
        workspaceRepository.save(workspace);

        log.info("Workspace created: {} for user: {}", req.getName(), username);
        return toResponse(workspace);
    }

    @Transactional
    public WorkspaceResponse updateWorkspace(String username, String workspaceId, WorkspacePatchRequest req) {
        Workspace workspace = validateOwnership(username, workspaceId);

        if (req.getName() != null) {
            if (!req.getName().equals(workspace.getName())
                    && workspaceRepository.existsByUsernameAndName(username, req.getName())) {
                throw new WorkspaceConflictException("Workspace '" + req.getName() + "' already exists");
            }
            workspace.setName(req.getName());
        }

        if (req.getIcon() != null)
            workspace.setIcon(req.getIcon());
        if (req.getColor() != null)
            workspace.setColor(req.getColor());
        workspaceRepository.save(workspace);
        log.info("Workspace {} updated for user: {}", workspaceId, username);
        return toResponse(workspace);
    }

    @Transactional
    public WorkspaceDeleteResponse deleteWorkspace(String username, String workspaceId) {
        validateOwnership(username, workspaceId);
        var sizeResult = noteRepository.aggregateWorkspaceSize(workspaceId);
        long totalBytes = sizeResult.isEmpty() ? 0 : sizeResult.get(0).getTotal();
        int notesHandled = sizeResult.isEmpty() ? 0 : sizeResult.get(0).getCount();

        if (totalBytes > byteThreshold) {
            noteRepository.deleteByWorkspaceId(workspaceId);
            log.info("Permenently deleted {} notes in workspace {} ({} bytes)", notesHandled, workspaceId, totalBytes);
        } else {
            Query query = Query.query(Criteria.where("workspaceId").is(workspaceId));
            Update update = new Update().set("deletedAt", LocalDateTime.now());
            mongoTemplate.updateMulti(query, update, Note.class);
            log.info("Trashed {} notes in workspace {} ({} bytes)", notesHandled, workspaceId, totalBytes);
        }

        workspaceRepository.deleteById(workspaceId);
        log.info("Workspace {} deleted by user {}", workspaceId, username);

        return new WorkspaceDeleteResponse(totalBytes > byteThreshold ? "hard_delete" : "trash", totalBytes,
                notesHandled);
    }
}