package com.dev.JournalApp.repository;

import com.dev.JournalApp.models.JournalEntry;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface JournalRepository
        extends MongoRepository<JournalEntry, String> {
    List<JournalEntry> findByUsernameOrderByCreatedAtDesc(String username);
}
