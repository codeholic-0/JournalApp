package com.dev.Notes.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "folders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(name = "idx_workspaceId_name", def = "{'workspaceId': 1, 'name': 1}")
@CompoundIndex(name = "idx_workspaceId_parentId", def = "{'workspaceId': 1, 'parentId': 1}")
@CompoundIndex(name = "idx_workspaceId_materializedPath", def = "{'workspaceId': 1, 'materializedPath': 1}")
public class Folder {
    @Id
    private String id;
    @NotBlank
    private String workspaceId;
    private String parentId;
    @NotBlank
    private String name;
    private String icon;
    private String color;
    @NotBlank
    private String sortOrder;
    @NotBlank
    private String materializedPath;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
