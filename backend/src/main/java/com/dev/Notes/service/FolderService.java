package com.dev.Notes.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dev.Notes.dto.request.FolderPatchRequest;
import com.dev.Notes.dto.request.FolderRequest;
import com.dev.Notes.dto.response.FolderResponse;
import com.dev.Notes.exceptions.FolderConflictException;
import com.dev.Notes.exceptions.FolderNotEmptyException;
import com.dev.Notes.exceptions.ResourceNotFoundException;
import com.dev.Notes.exceptions.WorkspaceOwnershipMismatchException;
import com.dev.Notes.models.Folder;
import com.dev.Notes.models.Note;
import com.dev.Notes.models.Workspace;
import com.dev.Notes.repository.FolderRepository;
import com.dev.Notes.repository.WorkspaceRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FolderService {

    private final FolderRepository folderRepository;
    private final WorkspaceRepository workspaceRepository;
    private final MongoTemplate mongoTemplate;

    public FolderService(FolderRepository folderRepository,
            WorkspaceRepository workspaceRepository,
            MongoTemplate mongoTemplate) {
        this.folderRepository = folderRepository;
        this.workspaceRepository = workspaceRepository;
        this.mongoTemplate = mongoTemplate;
    }

    private FolderResponse toResponse(Folder folder) {
        FolderResponse res = new FolderResponse();
        res.setId(folder.getId());
        res.setWorkspaceId(folder.getWorkspaceId());
        res.setParentId(folder.getParentId());
        res.setName(folder.getName());
        res.setIcon(folder.getIcon());
        res.setColor(folder.getColor());
        res.setSortOrder(folder.getSortOrder());
        res.setMaterializedPath(folder.getMaterializedPath());
        res.setCreatedAt(folder.getCreatedAt());
        res.setUpdatedAt(folder.getUpdatedAt());
        return res;
    }

    private void validateOwnership(String username, String workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
        if (!workspace.getUsername().equals(username)) {
            throw new WorkspaceOwnershipMismatchException(username, workspace.getName());
        }
    }

    public List<FolderResponse> getFolders(String username, String workspaceId, String sort) {
        validateOwnership(username, workspaceId);
        Sort sortBy = switch (sort != null ? sort : "sortOrder") {
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            case "createdAt" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.ASC, "sortOrder");
        };
        return folderRepository.findByWorkspaceId(workspaceId, sortBy).stream()
                .map(this::toResponse)
                .toList();
    }

    public FolderResponse getFolderById(String username, String workspaceId, String folderId) {
        validateOwnership(username, workspaceId);
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));
        if (!folder.getWorkspaceId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Folder not found: " + folderId);
        }
        return toResponse(folder);
    }

    @Transactional
    public FolderResponse createFolder(String username, String workspaceId, FolderRequest req) {
        validateOwnership(username, workspaceId);

        if (folderRepository.existsByWorkspaceIdAndName(workspaceId, req.getName())) {
            throw new FolderConflictException("Folder '" + req.getName() + "' already exists in workspace");
        }

        Folder folder = new Folder();
        folder.setWorkspaceId(workspaceId);
        folder.setName(req.getName());
        folder.setParentId(req.getParentId());
        folder.setIcon(req.getIcon());
        folder.setColor(req.getColor());
        folder.setSortOrder(String.valueOf(System.currentTimeMillis()));
        folderRepository.save(folder);

        String path = computeMaterializedPath(workspaceId, req.getParentId(), folder.getId());
        folder.setMaterializedPath(path);
        folderRepository.save(folder);

        log.info("Folder created: {} in workspace {}", req.getName(), workspaceId);
        return toResponse(folder);
    }

    @Transactional
    public FolderResponse updateFolder(String username, String workspaceId, String folderId, FolderPatchRequest req) {
        validateOwnership(username, workspaceId);
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));

        if (!folder.getWorkspaceId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Folder not found: " + folderId);
        }

        if (req.getName() != null) {
            if (!req.getName().equals(folder.getName())
                    && folderRepository.existsByWorkspaceIdAndName(workspaceId, req.getName())) {
                throw new FolderConflictException("Folder '" + req.getName() + "' already exists in workspace");
            }
            folder.setName(req.getName());
        }

        if (req.getParentId() != null && !req.getParentId().equals(folder.getParentId())) {
            detectCycle(workspaceId, folderId, req.getParentId());
            folder.setParentId(req.getParentId());
        }

        if (req.getIcon() != null)
            folder.setIcon(req.getIcon());
        if (req.getColor() != null)
            folder.setColor(req.getColor());

        folderRepository.save(folder);

        String oldPath = folder.getMaterializedPath();
        String newPath = computeMaterializedPath(workspaceId, folder.getParentId(), folder.getId());
        folder.setMaterializedPath(newPath);
        folderRepository.save(folder);

        if (!newPath.equals(oldPath)) {
            rebuildSubtreePaths(workspaceId, folderId, oldPath, newPath);
        }

        log.info("Folder {} updated in workspace {}", folderId, workspaceId);
        return toResponse(folder);
    }

    @Transactional
    public void deleteFolder(String username, String workspaceId, String folderId, boolean force) {
        validateOwnership(username, workspaceId);
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));

        if (!folder.getWorkspaceId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Folder not found: " + folderId);
        }

        if (!force) {
            List<Folder> children = folderRepository.findByWorkspaceIdAndParentId(workspaceId, folderId);
            if (!children.isEmpty()) {
                throw new FolderNotEmptyException(
                        "Folder '" + folder.getName() + "' has " + children.size() + " sub-folders");
            }

            Query noteQuery = Query.query(
                    Criteria.where("workspaceId").is(workspaceId)
                            .and("folderId").is(folderId)
                            .and("deletedAt").isNull());
            long noteCount = mongoTemplate.count(noteQuery, Note.class);
            if (noteCount > 0) {
                throw new FolderNotEmptyException("Folder '" + folder.getName() + "' contains " + noteCount + " notes");
            }
        }

        if (force) {
            Query orphanNotes = Query.query(
                    Criteria.where("workspaceId").is(workspaceId)
                            .and("folderId").is(folderId));
            Update unsetFolder = new Update().unset("folderId");
            mongoTemplate.updateMulti(orphanNotes, unsetFolder, Note.class);

            Query orphanChildren = Query.query(
                    Criteria.where("workspaceId").is(workspaceId)
                            .and("parentId").is(folderId));
            Update unsetParent = new Update().unset("parentId");
            mongoTemplate.updateMulti(orphanChildren, unsetParent, Folder.class);
        }

        folderRepository.delete(folder);
        log.info("Folder {} deleted from workspace {} (force={})", folderId, workspaceId, force);
    }

    private String computeMaterializedPath(String workspaceId, String parentId, String folderId) {
        if (parentId == null) {
            return "/" + workspaceId + "/" + folderId;
        }
        Folder parent = folderRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent folder not found: " + parentId));
        return parent.getMaterializedPath() + "/" + folderId;
    }

    private void detectCycle(String workspaceId, String folderId, String newParentId) {
        if (folderId.equals(newParentId)) {
            throw new FolderConflictException("Cannot set folder as its own parent");
        }

        Folder current = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));

        String currentPathPrefix = current.getMaterializedPath() + "/";
        Folder newParent = folderRepository.findById(newParentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent folder not found: " + newParentId));

        if (newParent.getMaterializedPath().startsWith(currentPathPrefix)) {
            throw new FolderConflictException("Cannot move folder to a descendant");
        }
    }

    private void rebuildSubtreePaths(String workspaceId, String folderId, String oldPath, String newPath) {
        List<Folder> descendants = folderRepository
                .findByWorkspaceIdAndMaterializedPathStartingWith(workspaceId, oldPath + "/");

        for (Folder descendant : descendants) {
            String updatedPath = descendant.getMaterializedPath().replace(oldPath, newPath);
            descendant.setMaterializedPath(updatedPath);
            folderRepository.save(descendant);
        }
    }
}