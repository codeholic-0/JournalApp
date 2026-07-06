package com.dev.Notes.exceptions;

public class WorkspaceOwnershipMismatchException extends RuntimeException {
    public WorkspaceOwnershipMismatchException(String username, String workspace) {
        super("Workspace: " + workspace + " isn't owned by user: " + username);
    }
}
