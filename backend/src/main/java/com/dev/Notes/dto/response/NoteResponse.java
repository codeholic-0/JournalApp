package com.dev.Notes.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

import com.dev.Notes.enumeration.NoteType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
}
