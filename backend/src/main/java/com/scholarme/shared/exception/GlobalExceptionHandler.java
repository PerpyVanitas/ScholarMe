package com.scholarme.shared.exception;

import com.scholarme.shared.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global Exception Handler
 * 
 * Provides centralized exception handling for all REST controllers.
 * Returns standardized error responses per SSD Section 5.1 specifications.
 * 
 * Error Code Prefixes:
 * - VALID-xxx: Validation/constraint errors (400)
 * - AUTH-xxx: Authentication/authorization errors (401, 403)
 * - BUS-xxx: Business logic errors (400)
 * - SYS-xxx: System/infrastructure errors (500)
 * 
 * @see ApiResponse for response wrapper structure
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** Handles @Valid annotation failures with field-level error details */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALID-001", "Validation failed", errors));
    }

    /** Handles JPA/Hibernate constraint violations (e.g., unique constraints) */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALID-002", "Constraint violation", ex.getMessage()));
    }

    /** Handles business logic validation failures from service layer */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("BUS-001", "Business logic error", ex.getMessage()));
    }

    /** Handles @PreAuthorize failures and role-based access denials */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("AUTH-002", "Access denied"));
    }

    /** Catch-all handler for unexpected exceptions - logs full stack trace */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("SYS-001", "Internal server error"));
    }
}
