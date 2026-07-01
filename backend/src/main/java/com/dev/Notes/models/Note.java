package com.dev.Notes.models;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "note_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Note {

    @Id
    private String id;

    @NonNull
    private String title;

    private String content;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private String username;

    private Map<String, Object> contentJson;
}
