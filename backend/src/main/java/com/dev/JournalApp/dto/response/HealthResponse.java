package com.dev.JournalApp.dto.response;

import java.time.LocalDateTime;

public record HealthResponse(String status, String db, LocalDateTime timestamp) {

}
