package com.scholarme.exception;

import com.scholarme.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for consistent error responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<?>> handleApiException(ApiException ex) {
        HttpStatus status = getHttpStatus(ex.getCode());
        return ResponseEntity.status(status)
                .body(ApiResponse.error(ex.getCode(), ex.getMessage(), ex.getDetails()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALID-001", "Validation failed", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("SYSTEM-001", "Internal server error"));
    }

    private HttpStatus getHttpStatus(String code) {
        if (code == null) return HttpStatus.INTERNAL_SERVER_ERROR;
        
        if (code.startsWith("AUTH-001")) return HttpStatus.UNAUTHORIZED;
        if (code.startsWith("AUTH-002")) return HttpStatus.UNAUTHORIZED;
        if (code.startsWith("AUTH-003")) return HttpStatus.FORBIDDEN;
        if (code.startsWith("VALID-")) return HttpStatus.BAD_REQUEST;
        if (code.startsWith("DB-001")) return HttpStatus.NOT_FOUND;
        if (code.startsWith("BUS-")) return HttpStatus.CONFLICT;
        
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
