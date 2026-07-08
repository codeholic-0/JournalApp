package com.dev.Notes.exceptions;

public class FolderConflictException extends RuntimeException {
    public FolderConflictException(String message) {
        super(message);
    }
}
