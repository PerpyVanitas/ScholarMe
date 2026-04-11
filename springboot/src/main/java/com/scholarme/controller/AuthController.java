package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.auth.AuthDtos.*;
import com.scholarme.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication controller - Card-based and email authentication endpoints.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/card-login")
    @Operation(summary = "Login with card ID and PIN")
    public ResponseEntity<ApiResponse<LoginResponse>> cardLogin(
            @Valid @RequestBody CardLoginRequest request) {
        LoginResponse response = authService.cardLogin(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<LoginResponse>> emailLogin(
            @Valid @RequestBody EmailLoginRequest request) {
        LoginResponse response = authService.emailLogin(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<LoginResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(201).body(ApiResponse.success(response));
    }

    @PostMapping("/register-card")
    @Operation(summary = "Register a new authentication card (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerCard(
            @Valid @RequestBody RegisterCardRequest request) {
        authService.registerCard(request);
        return ResponseEntity.status(201)
                .body(ApiResponse.success(Map.of("message", "Card registered successfully")));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout() {
        // JWT is stateless, client should delete token
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Logged out successfully")));
    }
}
