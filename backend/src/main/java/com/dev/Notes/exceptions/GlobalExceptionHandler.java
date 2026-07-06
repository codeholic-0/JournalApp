package com.dev.Notes.exceptions;

import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleNotFound(
                        ResourceNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.NOT_FOUND,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(UserAlreadyExistsException.class)
        public ResponseEntity<ErrorResponse> handleUserAlreadyExists(
                        UserAlreadyExistsException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.CONFLICT,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(NoteOwnershipMismatchException.class)
        public ResponseEntity<ErrorResponse> handleOwnershipMismatch(
                        NoteOwnershipMismatchException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.FORBIDDEN,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleInvalidArgument(MethodArgumentNotValidException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.BAD_REQUEST,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleInvalidJSON(HttpMessageNotReadableException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.BAD_REQUEST,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(MissingServletRequestPartException.class)
        public ResponseEntity<ErrorResponse> handleServletRequest(MissingServletRequestPartException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.BAD_REQUEST,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.FORBIDDEN,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ErrorResponse> handleInvalidAuth(AuthenticationException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.UNAUTHORIZED,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(WorkspaceConflictException.class)
        public ResponseEntity<ErrorResponse> handleWorkspaceConflict(WorkspaceConflictException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.CONFLICT,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(WorkspaceOwnershipMismatchException.class)
        public ResponseEntity<ErrorResponse> handleWorkspaceOwnershipConflict(WorkspaceOwnershipMismatchException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                                new ErrorResponse(
                                                ex.getMessage(),
                                                HttpStatus.FORBIDDEN,
                                                LocalDateTime.now()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
                log.error("Unexpected Error Occurred!", ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                                new ErrorResponse(
                                                "An unexpected error occurred",
                                                HttpStatus.INTERNAL_SERVER_ERROR,
                                                LocalDateTime.now()));
        }

}
