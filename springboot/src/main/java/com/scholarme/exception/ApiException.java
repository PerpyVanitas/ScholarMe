package com.scholarme.exception;

import lombok.Getter;

/**
 * Custom API exception with error code support.
 */
@Getter
public class ApiException extends RuntimeException {

    private final String code;
    private final Object details;

    public ApiException(String code, String message) {
        super(message);
        this.code = code;
        this.details = null;
    }

    public ApiException(String code, String message, Object details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}
