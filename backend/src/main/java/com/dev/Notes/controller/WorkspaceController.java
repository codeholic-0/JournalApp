package com.dev.Notes.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dev.Notes.dto.request.WorkspacePatchRequest;
import com.dev.Notes.dto.request.WorkspaceRequest;
import com.dev.Notes.dto.response.WorkspaceDeleteResponse;
import com.dev.Notes.dto.response.WorkspaceResponse;
import com.dev.Notes.service.WorkspaceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workspaces")
@Tag(name = "Workspaces", description = "Workspace CRUD endpoints")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @Operation(summary = "List workspaces", description = "Get all workspaces for the authenticated user, sorted by the specified field")
    @ApiResponse(responseCode = "200", description = "List of workspaces")
    @GetMapping
    public ResponseEntity<List<WorkspaceResponse>> getWorkspaces(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "sortOrder") String sort,
            @RequestParam(defaultValue = "false") boolean includeInternal) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(workspaceService.getWorkspaces(username, sort, includeInternal));
    }

    @Operation(summary = "Create workspace", description = "Create a new workspace for the authenticated user")
    @ApiResponse(responseCode = "201", description = "Workspace created")
    @ApiResponse(responseCode = "409", description = "Workspace name already exists")
    @PostMapping
    public ResponseEntity<WorkspaceResponse> createWorkspace(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WorkspaceRequest req) {
        String username = userDetails.getUsername();
        WorkspaceResponse res = workspaceService.createWorkspace(username, req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @Operation(summary = "Get workspace", description = "Fetch a single workspace by its ID")
    @ApiResponse(responseCode = "200", description = "Workspace found")
    @ApiResponse(responseCode = "404", description = "Workspace not found")
    @ApiResponse(responseCode = "403", description = "Workspace does not belong to the user")
    @GetMapping("/{workspaceId}")
    public ResponseEntity<WorkspaceResponse> getWorkspace(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(workspaceService.getWorkspaceById(username, workspaceId));
    }

    @Operation(summary = "Get internal workspace", description = "Get or create the internal (unfiled) workspace for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Internal workspace returned")
    @GetMapping("/internal")
    public ResponseEntity<WorkspaceResponse> getInternalWorkspace(
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(workspaceService.getOrCreateInternalWorkspace(username));
    }

    @Operation(summary = "Update workspace", description = "Partially update a workspace (name, icon, color)")
    @ApiResponse(responseCode = "200", description = "Workspace updated")
    @ApiResponse(responseCode = "404", description = "Workspace not found")
    @ApiResponse(responseCode = "403", description = "Workspace does not belong to the user")
    @ApiResponse(responseCode = "409", description = "New workspace name already exists")
    @PatchMapping("/{workspaceId}")
    public ResponseEntity<WorkspaceResponse> updateWorkspace(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId,
            @RequestBody WorkspacePatchRequest req) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(workspaceService.updateWorkspace(username, workspaceId, req));
    }

    @Operation(summary = "Delete workspace", description = "Delete a workspace with size-based cascade (trash or hard-delete)")
    @ApiResponse(responseCode = "200", description = "Workspace deleted; response includes mode, bytes, notesHandled")
    @ApiResponse(responseCode = "404", description = "Workspace not found")
    @ApiResponse(responseCode = "403", description = "Workspace does not belong to the user")
    @DeleteMapping("/{workspaceId}")
    public ResponseEntity<WorkspaceDeleteResponse> deleteWorkspace(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(workspaceService.deleteWorkspace(username, workspaceId));
    }
}
