package com.dev.Notes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor
public class UserPreferencesResponse {
    private String theme;
    private String accent;
    private Double fontScale;
    private String density;
}
