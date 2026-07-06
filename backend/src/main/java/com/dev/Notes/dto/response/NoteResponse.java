package com.dev.Notes.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

import com.dev.Notes.enumeration.NoteType;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse {
    private String id;
    private String title;
    private String content;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Map<String, Object> contentJson;
    private NoteType noteType;
    private LocalDateTime deletedAt;
    private boolean favorite = false;
    private boolean pinned = false;
    private String workspaceId;
    private String icon;
    private String color;
}
