package com.dev.JournalApp.controller;

import com.dev.JournalApp.dto.JournalRequest;
import com.dev.JournalApp.dto.JournalResponse;
import com.dev.JournalApp.service.JournalService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{username}/journals")
@PreAuthorize("#username == authentication.name")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @PostMapping
    public ResponseEntity<JournalResponse> createJournal(
            @PathVariable String username,
            @RequestBody JournalRequest req) {
        JournalResponse res = journalService.createJournal(username, req);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @GetMapping("/{journalId}")
    public ResponseEntity<JournalResponse> getJournalById(
            @PathVariable String username,
            @PathVariable String journalId) {
        JournalResponse res = journalService.getJournalById(
                username,
                journalId);
        return ResponseEntity.ok(res);
    }

    @GetMapping
    public ResponseEntity<List<JournalResponse>> getJournalsByUsername(
            @PathVariable String username) {
        var res = journalService.getJournalsByUsername(username);
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/{journalId}")
    public ResponseEntity<JournalResponse> updateJournal(
            @PathVariable String username,
            @PathVariable String journalId,
            @RequestBody JournalRequest updates) {
        JournalResponse res = journalService.updateJournal(
                username,
                journalId,
                updates);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{journalId}")
    public ResponseEntity<Void> deleteJournal(
            @PathVariable String username,
            @PathVariable String journalId) {
        journalService.deleteJournal(username, journalId);
        return ResponseEntity.noContent().build();
    }
}
