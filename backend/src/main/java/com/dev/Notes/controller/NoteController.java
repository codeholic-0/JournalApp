package com.dev.Notes.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.dev.Notes.dto.request.NoteRequest;
import com.dev.Notes.dto.response.NoteResponse;
import com.dev.Notes.service.NoteService;

@RestController
@RequestMapping("/api/users/{username}/notes")
@PreAuthorize("#username == authentication.name")
@Tag(name = "Notes", description = "Note CRUD endpoints")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @Operation(summary = "Create note", description = "Create a new note entry for the authenticated user")
    @ApiResponse(responseCode = "201", description = "Note created")
    @ApiResponse(responseCode = "404", description = "User not found")
    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @PathVariable String username,
            @Valid @RequestBody NoteRequest req) {
        NoteResponse res = noteService.createNote(username, req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @Operation(summary = "Get note by ID", description = "Fetch a single note entry by its ID")
    @ApiResponse(responseCode = "200", description = "Note found")
    @ApiResponse(responseCode = "404", description = "Note not found")
    @ApiResponse(responseCode = "403", description = "Note does not belong to the user")
    @GetMapping("/{noteId}")
    public ResponseEntity<NoteResponse> getNoteById(
            @PathVariable String username,
            @PathVariable String noteId) {
        NoteResponse res = noteService.getNoteById(
                username,
                noteId);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "List notes", description = "Get all notes for the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of notes")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping
    public ResponseEntity<Page<NoteResponse>> getNotesByUsername(
            @PathVariable String username,
            @PageableDefault(size = 10) Pageable pageable) {
        var res = noteService.getNotesByUsername(username, pageable);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Update note", description = "Update an existing note entry (partial update)")
    @ApiResponse(responseCode = "200", description = "Note updated")
    @ApiResponse(responseCode = "404", description = "Note not found")
    @ApiResponse(responseCode = "403", description = "Note does not belong to the user")
    @PatchMapping("/{noteId}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable String username,
            @PathVariable String noteId,
            @Valid @RequestBody NoteRequest updates) {
        NoteResponse res = noteService.updateNote(
                username,
                noteId,
                updates);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Delete note", description = "Delete a note entry by ID")
    @ApiResponse(responseCode = "204", description = "Note deleted")
    @ApiResponse(responseCode = "404", description = "Note not found")
    @ApiResponse(responseCode = "403", description = "Note does not belong to the user")
    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable String username,
            @PathVariable String noteId) {
        noteService.deleteNote(username, noteId);
        return ResponseEntity.noContent().build();
    }
}
