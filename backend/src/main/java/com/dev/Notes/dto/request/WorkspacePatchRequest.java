package com.dev.Notes.dto.request;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkspacePatchRequest {
    private String name;
    private String color;
    private String icon;
}
