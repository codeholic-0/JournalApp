package com.dev.JournalApp.controller;

import com.dev.JournalApp.dto.request.JournalRequest;
import com.dev.JournalApp.dto.response.JournalResponse;
import com.dev.JournalApp.service.JournalService;

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

@RestController
@RequestMapping("/api/users/{username}/journals")
@PreAuthorize("#username == authentication.name")
@Tag(name = "Journals", description = "Journal CRUD endpoints")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @Operation(summary = "Create journal", description = "Create a new journal entry for the authenticated user")
    @ApiResponse(responseCode = "201", description = "Journal created")
    @ApiResponse(responseCode = "404", description = "User not found")
    @PostMapping
    public ResponseEntity<JournalResponse> createJournal(
            @PathVariable String username,
            @Valid @RequestBody JournalRequest req) {
        JournalResponse res = journalService.createJournal(username, req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @Operation(summary = "Get journal by ID", description = "Fetch a single journal entry by its ID")
    @ApiResponse(responseCode = "200", description = "Journal found")
    @ApiResponse(responseCode = "404", description = "Journal not found")
    @ApiResponse(responseCode = "403", description = "Journal does not belong to the user")
    @GetMapping("/{journalId}")
    public ResponseEntity<JournalResponse> getJournalById(
            @PathVariable String username,
            @PathVariable String journalId) {
        JournalResponse res = journalService.getJournalById(
                username,
                journalId);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "List journals", description = "Get all journals for the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of journals")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping
    public ResponseEntity<Page<JournalResponse>> getJournalsByUsername(
            @PathVariable String username,
            @PageableDefault(size = 10) Pageable pageable) {
        var res = journalService.getJournalsByUsername(username, pageable);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Update journal", description = "Update an existing journal entry (partial update)")
    @ApiResponse(responseCode = "200", description = "Journal updated")
    @ApiResponse(responseCode = "404", description = "Journal not found")
    @ApiResponse(responseCode = "403", description = "Journal does not belong to the user")
    @PatchMapping("/{journalId}")
    public ResponseEntity<JournalResponse> updateJournal(
            @PathVariable String username,
            @PathVariable String journalId,
            @Valid @RequestBody JournalRequest updates) {
        JournalResponse res = journalService.updateJournal(
                username,
                journalId,
                updates);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Delete journal", description = "Delete a journal entry by ID")
    @ApiResponse(responseCode = "204", description = "Journal deleted")
    @ApiResponse(responseCode = "404", description = "Journal not found")
    @ApiResponse(responseCode = "403", description = "Journal does not belong to the user")
    @DeleteMapping("/{journalId}")
    public ResponseEntity<Void> deleteJournal(
            @PathVariable String username,
            @PathVariable String journalId) {
        journalService.deleteJournal(username, journalId);
        return ResponseEntity.noContent().build();
    }
}
