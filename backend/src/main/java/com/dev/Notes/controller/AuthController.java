package com.dev.Notes.controller;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dev.Notes.dto.request.LoginRequest;
import com.dev.Notes.dto.request.UserRequest;
import com.dev.Notes.dto.response.AuthResponse;
import com.dev.Notes.service.AuthService;
import com.dev.Notes.service.RefreshTokenService;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Authtentication endpoints")
public class AuthController {

    private final RefreshTokenService refreshTokenService;
    private final AuthService authService;

    public AuthController(AuthService authService,
            RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    @Operation(summary = "Register a new User", description = "Creates account and returns JWT tokens")
    @ApiResponse(responseCode = "201", description = "User created successfully")
    @ApiResponse(responseCode = "409", description = "Username already exists")
    @RateLimiter(name = "authEndpoint")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> createNewUser(
            @Valid @RequestBody UserRequest req) {
        AuthResponse res = authService.createNewUser(req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @Operation(summary = "Login", description = "Authenticate user and return JWT tokens")
    @ApiResponse(responseCode = "200", description = "Login successful")
    @ApiResponse(responseCode = "401", description = "Invalid credentials")
    @RateLimiter(name = "authEndpoint")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req) {
        AuthResponse res = authService.login(req);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Refresh token", description = "Exchange refresh token for new access + refresh tokens")
    @ApiResponse(responseCode = "200", description = "Tokens refreshed")
    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody Map<String, String> body) {
        AuthResponse res = authService.refresh(body);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Logout", description = "Revoke refresh token")
    @ApiResponse(responseCode = "204", description = "Logged out successfully")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body) {
        String rawToken = body.get("refreshToken");
        if (rawToken != null) {
            refreshTokenService.revokeToken(rawToken);
        }
        return ResponseEntity.noContent().build();
    }
}
