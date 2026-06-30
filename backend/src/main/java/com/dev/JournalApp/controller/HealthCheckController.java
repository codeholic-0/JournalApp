package com.dev.JournalApp.controller;

import java.time.LocalDateTime;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dev.JournalApp.dto.response.HealthResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/check")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthCheckController {

    private final MongoTemplate mongoTemplate;

    public HealthCheckController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Operation(summary = "Health check", description = "Check application and database connectivity status")
    @ApiResponse(responseCode = "200", description = "Health status returned")
    @GetMapping
    public ResponseEntity<HealthResponse> checkHealth() {
        String status;
        try {
            mongoTemplate.executeCommand("{ping: 1}");
            status = "CONNECTED";
        } catch (Exception e) {
            status = "DISCONNECTED";
        }
        return ResponseEntity.ok(new HealthResponse("UP", status, LocalDateTime.now()));
    }
}
