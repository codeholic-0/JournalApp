package com.dev.Notes.dto.response;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceResponse {
    private String id;
    private String name;
    private String color;
    private String icon;
    private String sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
