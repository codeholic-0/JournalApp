package com.dev.Notes.exceptions;

public class WorkspaceConflictException extends RuntimeException {
    public WorkspaceConflictException(String message) {
        super(message);
    }
}
