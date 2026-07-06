package com.dev.Notes.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String color;
    @NotBlank
    private String icon;
}
