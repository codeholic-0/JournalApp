package com.dev.Notes.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FolderPatchRequest {
    private String name;
    private String parentId;
    private String icon;
    private String color;
}
