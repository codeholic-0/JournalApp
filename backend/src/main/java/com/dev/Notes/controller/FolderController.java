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

import com.dev.Notes.dto.request.FolderPatchRequest;
import com.dev.Notes.dto.request.FolderRequest;
import com.dev.Notes.dto.response.FolderResponse;
import com.dev.Notes.service.FolderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/folders")
@Tag(name = "Folders", description = "Folder CRUD endpoints")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @Operation(summary = "List folders", description = "Get all folders in a workspace")
    @ApiResponse(responseCode = "200", description = "List of folders")
    @GetMapping
    public ResponseEntity<List<FolderResponse>> getFolders(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId,
            @RequestParam(defaultValue = "sortOrder") String sort) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(folderService.getFolders(username, workspaceId, sort));
    }

    @Operation(summary = "Create folder", description = "Create a new folder in a workspace")
    @ApiResponse(responseCode = "201", description = "Folder created")
    @ApiResponse(responseCode = "409", description = "Folder name already exists")
    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId,
            @Valid @RequestBody FolderRequest req) {
        String username = userDetails.getUsername();
        FolderResponse res = folderService.createFolder(username, workspaceId, req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @Operation(summary = "Get folder", description = "Fetch a single folder by its ID")
    @ApiResponse(responseCode = "200", description = "Folder found")
    @ApiResponse(responseCode = "404", description = "Folder not found")
    @GetMapping("/{folderId}")
    public ResponseEntity<FolderResponse> getFolder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId,
            @PathVariable String folderId) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(folderService.getFolderById(username, workspaceId, folderId));
    }

    @Operation(summary = "Update folder", description = "Partially update a folder (rename, reparent, icon, color)")
    @ApiResponse(responseCode = "200", description = "Folder updated")
    @ApiResponse(responseCode = "404", description = "Folder not found")
    @ApiResponse(responseCode = "409", description = "Folder name already exists or cycle detected")
    @PatchMapping("/{folderId}")
    public ResponseEntity<FolderResponse> updateFolder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId,
            @PathVariable String folderId,
            @RequestBody FolderPatchRequest req) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(folderService.updateFolder(username, workspaceId, folderId, req));
    }

    @Operation(summary = "Delete folder", description = "Delete a folder. Without force, refuses if folder has children or notes. With force=true, orphans children and notes.")
    @ApiResponse(responseCode = "204", description = "Folder deleted")
    @ApiResponse(responseCode = "404", description = "Folder not found")
    @ApiResponse(responseCode = "409", description = "Folder not empty (without force)")
    @DeleteMapping("/{folderId}")
    public ResponseEntity<Void> deleteFolder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String workspaceId,
            @PathVariable String folderId,
            @RequestParam(defaultValue = "false") boolean force) {
        String username = userDetails.getUsername();
        folderService.deleteFolder(username, workspaceId, folderId, force);
        return ResponseEntity.noContent().build();
    }
}