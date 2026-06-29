package com.dev.JournalApp.controller;

import com.dev.JournalApp.dto.request.LoginRequest;
import com.dev.JournalApp.dto.request.UserRequest;
import com.dev.JournalApp.dto.response.AuthResponse;
import com.dev.JournalApp.service.AuthService;

import com.dev.JournalApp.service.RefreshTokenService;
import jakarta.validation.Valid;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RefreshTokenService refreshTokenService;
    private final AuthService authService;

    public AuthController(AuthService authService,
            RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> createNewUser(
            @Valid @RequestBody UserRequest req) {
        AuthResponse res = authService.createNewUser(req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req) {
        AuthResponse res = authService.login(req);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody Map<String, String> body) {
        AuthResponse res = authService.refresh(body);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body) {
        String rawToken = body.get("refreshToken");
        if (rawToken != null) {
            refreshTokenService.revokeToken(rawToken);
        }
        return ResponseEntity.noContent().build();
    }
}
