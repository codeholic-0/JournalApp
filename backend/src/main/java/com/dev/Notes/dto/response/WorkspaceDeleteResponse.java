package com.dev.Notes.dto.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceDeleteResponse {
    private String mode;
    private long bytes;
    private int notesHandled;
}
