package com.dev.Notes.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;;

@Document(collection = "workspaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(name = "idx_username_name", def = "{'username': 1, 'name': 1}", unique = true)
@CompoundIndex(name = "idx_username_sortOrder", def = "{'username': 1, 'sortOrder': 1}")
public class Workspace {
    @Id
    private String id;
    @NotBlank
    private String username;
    @NotBlank
    private String name;
    private String icon;
    private String color;
    private String sortOrder;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
