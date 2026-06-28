package com.dev.JournalApp.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "refreshTokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
