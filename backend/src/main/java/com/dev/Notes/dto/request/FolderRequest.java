package com.dev.Notes.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FolderRequest {
    @NotBlank
    private String name;
    private String parentId;
    private String icon;
    private String color;
}
