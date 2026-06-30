package com.dev.JournalApp.repository;

import com.dev.JournalApp.models.JournalEntry;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface JournalRepository extends MongoRepository<JournalEntry, String> {
    Page<JournalEntry> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
}
