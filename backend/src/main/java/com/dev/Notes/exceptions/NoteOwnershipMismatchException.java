package com.dev.Notes.exceptions;

public class NoteOwnershipMismatchException extends RuntimeException {

    public NoteOwnershipMismatchException(String username) {
        super("User " + username + " does not own this note");
    }
}
