package com.dev.Notes.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dev.Notes.models.Workspace;

public interface WorkspaceRepository extends MongoRepository<Workspace, String> {
    List<Workspace> findByUsername(String username);

    Optional<Workspace> findByUsernameAndName(String username, String name);

    boolean existsByUsernameAndName(String username, String name);

    List<Workspace> findByUsername(String username, Sort sort);
}
