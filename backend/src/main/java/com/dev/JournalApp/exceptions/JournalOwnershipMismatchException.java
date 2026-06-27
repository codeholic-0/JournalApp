package com.dev.JournalApp.exceptions;

public class JournalOwnershipMismatchException extends RuntimeException {

    public JournalOwnershipMismatchException(String username) {
        super("User " + username + " does not own this journal");
    }
}
