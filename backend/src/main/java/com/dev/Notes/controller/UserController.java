package com.dev.Notes.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.dev.Notes.dto.request.UserRequest;
import com.dev.Notes.dto.response.UserResponse;
import com.dev.Notes.service.UserService;

@RestController
@RequestMapping("/api/users/{username}")
@PreAuthorize("#username == authentication.name")
@Tag(name = "Users", description = "User management endpoints")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get user", description = "Fetch user profile by username")
    @ApiResponse(responseCode = "200", description = "User found")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        UserResponse res = userService.getUserByUsername(username);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Update password", description = "Update the authenticated user's password")
    @ApiResponse(responseCode = "200", description = "Password updated")
    @ApiResponse(responseCode = "404", description = "User not found")
    @PatchMapping
    public ResponseEntity<UserResponse> updateUserPassword(
            @PathVariable String username,
            @Valid @RequestBody UserRequest req) {
        UserResponse res = userService.updateUserPassword(username, req);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Delete user", description = "Delete the authenticated user and all their notes")
    @ApiResponse(responseCode = "204", description = "User deleted")
    @ApiResponse(responseCode = "404", description = "User not found")
    @DeleteMapping
    public ResponseEntity<Void> deleteUser(@PathVariable String username) {
        userService.deleteUser(username);
        return ResponseEntity.noContent().build();
    }

}
