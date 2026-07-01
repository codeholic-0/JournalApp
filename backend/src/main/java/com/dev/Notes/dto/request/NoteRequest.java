package com.dev.Notes.dto.request;

import java.util.Map;

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
    @Size(max = 5000)
    private String content;

    private Map<String, Object> contentJson;
}
