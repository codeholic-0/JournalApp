package com.dev.Notes.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
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
import com.dev.Notes.models.Workspace;
import com.dev.Notes.repository.NoteRepository;
import com.dev.Notes.repository.WorkspaceRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class WorkspaceService {
    private final WorkspaceRepository workspaceRepository;
    private final NoteRepository noteRepository;
    private final MongoTemplate mongoTemplate;

    private final long byteThreshold;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            NoteRepository noteRepository,
            MongoTemplate mongoTemplate,
            @Value("${notes.workspace.delete.byteThreshold:524288000}") long byteThreshold) {
        this.workspaceRepository = workspaceRepository;
        this.noteRepository = noteRepository;
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

    public WorkspaceResponse getWorkspaceById(String username, String workspaceId) {
        return toResponse(validateOwnership(username, workspaceId));
    }

    public List<WorkspaceResponse> getWorkspaces(String username, String sort) {
        Sort sortby = switch (sort != null ? sort : "sortOrder") {
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            case "createdAt" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.ASC, "sortOrder");
        };

        return workspaceRepository.findByUsername(username, sortby)
                .stream().map(this::toResponse).toList();
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