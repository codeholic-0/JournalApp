package com.dev.Notes.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dev.Notes.models.Note;

public interface NoteRepository extends MongoRepository<Note, String> {
    Page<Note> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
}
