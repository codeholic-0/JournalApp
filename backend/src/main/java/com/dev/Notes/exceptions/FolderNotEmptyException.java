package com.dev.Notes.exceptions;

public class FolderNotEmptyException extends RuntimeException {
    public FolderNotEmptyException(String message) {
        super(message);
    }
}
