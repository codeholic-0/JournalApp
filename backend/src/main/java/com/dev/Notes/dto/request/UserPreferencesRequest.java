package com.dev.Notes.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserPreferencesRequest{
    private String theme;
    private String accent;
    private Double fontScale;
    private String density;
}
