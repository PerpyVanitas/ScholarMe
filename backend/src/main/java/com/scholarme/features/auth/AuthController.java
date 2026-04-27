package com.scholarme.features.auth;

import com.scholarme.shared.dto.ApiResponse;
import com.scholarme.features.auth.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller (Auth Feature)
 * 
 * Provides REST endpoints for user authentication including:
 * - Card-based login (physical ID card + PIN)
 * - Email/password login
 * - User registration
 * - Session logout
 * 
 * All endpoints return standardized {@link ApiResponse} wrappers.
 * Error codes follow SSD Section 5.1 specifications.
 * 
 * @see AuthService for business logic implementation
 * @see com.scholarme.shared.security.JwtService for token generation
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Authenticates a user using their physical ID card credentials.
     * 
     * @param request Contains cardId (unique card identifier) and PIN
     * @return JWT token and user profile on success
     * @throws 401 Unauthorized if card is invalid, inactive, or PIN is incorrect
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
     * Authenticates a user using email and password credentials.
     * Used primarily by mobile and web clients.
     * 
     * @param request Contains email address and password
     * @return JWT token and user profile on success
     * @throws 401 Unauthorized if credentials are invalid
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
     * Registers a new user account.
     * Creates user profile and issues authentication token.
     * 
     * @param request Contains email, password, fullName, and optional role (defaults to LEARNER)
     * @return JWT token and newly created user profile
     * @throws 400 Bad Request if email already exists or validation fails
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            RegisterResponse response = authService.register(request);
            return ResponseEntity.status(201).body(ApiResponse.ok(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALID-001", "Registration failed", e.getMessage()));
        }
    }

    /**
     * Logs out the current user session.
     * 
     * Note: JWT tokens are stateless, so server-side logout is a no-op.
     * Clients must discard the token locally to complete logout.
     * For enhanced security, consider implementing token blacklisting.
     * 
     * @return Success confirmation message
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }
}
