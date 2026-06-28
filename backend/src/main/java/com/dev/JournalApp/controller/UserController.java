package com.dev.JournalApp.controller;

import com.dev.JournalApp.dto.request.UserRequest;
import com.dev.JournalApp.dto.response.UserResponse;
import com.dev.JournalApp.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{username}")
@PreAuthorize("#username == authentication.name")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        UserResponse res = userService.getUserByUsername(username);
        return ResponseEntity.ok(res);
    }

    @PatchMapping
    public ResponseEntity<UserResponse> updateUserPassword(
            @PathVariable String username,
            @Valid @RequestBody UserRequest req) {
        UserResponse res = userService.updateUserPassword(username, req);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteUser(@PathVariable String username) {
        userService.deleteUser(username);
        return ResponseEntity.noContent().build();
    }

}
