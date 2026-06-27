package com.dev.JournalApp.controller;

import com.dev.JournalApp.dto.UserRequest;
import com.dev.JournalApp.dto.UserResponse;
import com.dev.JournalApp.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createNewUser(
            @RequestBody UserRequest req) {
        UserResponse res = authService.createNewUser(req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }
}
