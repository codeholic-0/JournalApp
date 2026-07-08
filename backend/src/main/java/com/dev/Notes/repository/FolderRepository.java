package com.dev.Notes.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dev.Notes.models.Folder;

public interface FolderRepository extends MongoRepository<Folder, String> {
    List<Folder> findByWorkspaceId(String workspaceId, Sort sort);

    List<Folder> findByWorkspaceIdAndParentId(String workspaceId, String parentId);

    Optional<Folder> findByWorkspaceIdAndName(String workspaceId, String name);

    boolean existsByWorkspaceIdAndName(String workspaceId, String name);

    List<Folder> findByWorkspaceIdAndMaterializedPathStartingWith(String workspaceId, String pathPrefix);

    List<Folder> findByWorkspaceId(String workspaceId);

    void deleteByWorkspaceId(String workspaceId);
}
