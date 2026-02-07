package com.hvac.controller;

import com.hvac.dto.*;
import com.hvac.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> initiateLogin(@Valid @RequestBody AuthRequest request) {
        try {
            String email = authService.initiateLogin(request);
            return ResponseEntity.ok(Map.of(
                "message", "Verification code sent to email",
                "email", email
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyAndLogin(@Valid @RequestBody VerifyCodeRequest request) {
        try {
            AuthResponse response = authService.verifyAndLogin(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            authService.forgotPassword(email);
            return ResponseEntity.ok(Map.of("message", "If an account exists with that email, a reset link has been sent"));
        } catch (Exception e) {
            // Return generic message to prevent email enumeration
            return ResponseEntity.ok(Map.of("message", "If an account exists with that email, a reset link has been sent"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        try {
            String token = payload.get("token");
            String username = payload.get("username");
            String password = payload.get("password");

            if (token == null || token.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reset token is required"));
            }

            authService.resetCredentials(token, username, password);
            return ResponseEntity.ok(Map.of("message", "Credentials updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        try {
            String googleId = payload.get("googleId");
            String email = payload.get("email");
            String name = payload.get("name");

            if (googleId == null || email == null || name == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
            }

            AuthResponse response = authService.loginWithGoogle(googleId, email, name);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
