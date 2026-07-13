package com.dev.Notes.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dev.Notes.common.WorkspaceSizeResult;
import com.dev.Notes.models.Note;

import java.util.List;

public interface NoteRepository extends MongoRepository<Note, String> {
        Page<Note> findByUsernameAndDeletedAtIsNullOrderByCreatedAtDesc(String username, Pageable pageable);

        Page<Note> findByUsernameAndWorkspaceIdAndDeletedAtIsNullOrderByCreatedAtDesc(String username,
                        String workspaceId,
                        Pageable pageable);

        Page<Note> findByUsernameAndWorkspaceIdAndFolderIdAndDeletedAtIsNullOrderByCreatedAtDesc(String username,
                        String workspaceId, String folderId, Pageable pageable);

        Page<Note> findByUsernameAndDeletedAtIsNotNullOrderByCreatedAtDesc(String username, Pageable pageable);

        Page<Note> findByUsernameAndWorkspaceIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(
                        String username, String workspaceId, Pageable pageable);

        Page<Note> findByUsernameAndWorkspaceIdAndFolderIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(
                        String username, String workspaceId, String folderId, Pageable pageable);

        Page<Note> findByUsernameAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(
                        String username, Pageable pageable);

        List<Note> findByWorkspaceId(String workspaceId);

        void deleteByWorkspaceId(String workspaceId);

        @Aggregation(pipeline = {
                        "{ $match: { workspaceId: ?0, deletedAt: null } }",
                        "{ $group: { _id: null, total: { $sum: { $bsonSize: \"$content\" } }, count: { $sum: 1 } } }"
        })
        List<WorkspaceSizeResult> aggregateWorkspaceSize(String workspaceId);
}
