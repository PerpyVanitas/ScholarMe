package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.AuthDtos.*;
import com.scholarme.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /auth/card-login
     * Body: { "cardId": "string", "pin": "string" }
     * Response: { user, token }
     */
    @PostMapping("/card-login")
    public ResponseEntity<ApiResponse<LoginResponse>> cardLogin(@Valid @RequestBody CardLoginRequest request) {
        try {
            LoginResponse response = authService.cardLogin(request);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH-001", "Invalid credentials", e.getMessage()));
        }
    }

    /**
     * POST /auth/email-login
     * Body: { "email": "string", "password": "string" }
     * Response: { user, token }
     */
    @PostMapping("/email-login")
    public ResponseEntity<ApiResponse<LoginResponse>> emailLogin(@Valid @RequestBody EmailLoginRequest request) {
        try {
            LoginResponse response = authService.emailLogin(request);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH-001", "Invalid credentials", e.getMessage()));
        }
    }

    /**
     * POST /auth/logout
     * Headers: Authorization: Bearer {token}
     * Response: { message: "Logged out successfully" }
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        // JWT is stateless; client simply discards the token.
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }
}
