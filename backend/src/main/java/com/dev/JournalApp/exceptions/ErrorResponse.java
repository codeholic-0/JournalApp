package com.dev.JournalApp.exceptions;

import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;

public record ErrorResponse(
        String message,
        int statusCode,
        String status,
        LocalDateTime timestamp) {
    public ErrorResponse(
            String message,
            HttpStatus status,
            LocalDateTime timestamp) {
        this(message, status.value(), status.name(), timestamp);
    }
}
