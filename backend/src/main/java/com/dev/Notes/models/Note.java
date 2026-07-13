package com.dev.Notes.models;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.dev.Notes.enumeration.NoteType;

@Document(collection = "note_entries")
@CompoundIndex(name = "idx_username_deletedAt_createdAt", def = "{'username': 1, 'deletedAt': 1, 'createdAt': -1}")
@CompoundIndex(name = "idx_username_workspaceId_deletedAt_createdAt", def = "{'username': 1, 'workspaceId': 1,'createdAt': -1, 'deletedAt': 1}")
@CompoundIndex(name = "idx_workspaceId_folderId", def = "{'workspaceId': 1, 'folderId': 1}")
@CompoundIndex(name = "idx_workspaceId_tagIds", def = "{'workspaceId': 1, 'tagIds': 1}")
@CompoundIndex(name = "idx_workspaceId_collectionIds", def = "{'workspaceId': 1, 'collectionIds': 1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Note {
    @Id
    private String id;
    @NonNull
    private String title;
    private String content;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    private String username;
    private Map<String, Object> contentJson;
    private NoteType noteType = NoteType.BASIC;
    private LocalDateTime deletedAt;
    private boolean favorite = false;
    private boolean pinned = false;
    @Indexed
    private String workspaceId;
    private String icon;
    private String color;
    private String folderId;
    private String categoryId;
    private List<String> tagIds;
    private List<String> collectionIds;
    private String sortOrder;
}
