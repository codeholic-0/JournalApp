package com.dev.Notes.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FolderResponse {
    private String id;
    private String workspaceId;
    private String parentId;
    private String name;
    private String icon;
    private String color;
    private String sortOrder;
    private String materializedPath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
