package com.dev.Notes.dto.request;

import java.util.Map;

import com.dev.Notes.enumeration.NoteType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NoteRequest {

    @NotBlank
    private String title;
    @Size(max = 200000)
    private String content;
    private NoteType noteType;
    private Map<String, Object> contentJson;
    private String workspaceId;
    private String folderId;
    private String icon;
    private String color;
    private String sortOrder;
}
