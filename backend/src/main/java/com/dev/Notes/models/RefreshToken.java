package com.dev.Notes.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refreshTokens")
public class RefreshToken {
    @Id
    private String id;
    @Indexed(unique = true)
    private String tokenHash;
    @Indexed
    private String username;
    private LocalDateTime expiresAt;
    @CreatedDate
    private LocalDateTime createdAt;
    private boolean revoked = false;
}
