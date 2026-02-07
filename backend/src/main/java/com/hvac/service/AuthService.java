package com.hvac.service;

import com.hvac.dto.*;
import com.hvac.entity.PasswordResetToken;
import com.hvac.entity.User;
import com.hvac.entity.User.UserRole;
import com.hvac.entity.VerificationCode;
import com.hvac.repository.PasswordResetTokenRepository;
import com.hvac.repository.UserRepository;
import com.hvac.repository.VerificationCodeRepository;
import com.hvac.security.CustomUserDetails;
import com.hvac.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${cors.allowed.origins:http://localhost:3000}")
    private String allowedOrigins;

    public AuthService(
            UserRepository userRepository,
            VerificationCodeRepository verificationCodeRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.verificationCodeRepository = verificationCodeRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.CUSTOMER);
        user.setActive(true);

        userRepository.save(user);
    }

    @Transactional
    public void registerAdmin(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.ADMIN);
        user.setActive(true);

        userRepository.save(user);
    }

    public String initiateLogin(AuthRequest request) {
        // Validate credentials
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String email = userDetails.getEmail();

        // Generate and send verification code
        String code = generateVerificationCode();

        // Delete any existing codes for this email
        verificationCodeRepository.deleteByEmail(email);

        // Save new code
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCodeRepository.save(verificationCode);

        // Send email
        emailService.sendVerificationCode(email, code);

        return email;
    }

    public AuthResponse verifyAndLogin(VerifyCodeRequest request) {
        VerificationCode verificationCode = verificationCodeRepository
            .findByEmailAndCodeAndIsUsedFalse(request.getEmail(), request.getCode())
            .orElseThrow(() -> new RuntimeException("Invalid verification code"));

        if (verificationCode.isExpired()) {
            throw new RuntimeException("Verification code has expired");
        }

        // Mark code as used
        verificationCode.setUsed(true);
        verificationCodeRepository.save(verificationCode);

        // Get user and generate token
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
            token,
            user.getUsername(),
            user.getEmail(),
            user.getRole().name(),
            jwtService.getExpirationTime()
        );
    }

    public AuthResponse loginWithGoogle(String googleId, String email, String name) {
        User user = userRepository.findByGoogleId(googleId)
            .orElseGet(() -> {
                // Check if user exists with this email
                return userRepository.findByEmail(email)
                    .map(existingUser -> {
                        existingUser.setGoogleId(googleId);
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        // Create new user
                        User newUser = new User();
                        newUser.setUsername(name.replaceAll("\\s+", "_") + "_" + System.currentTimeMillis() % 10000);
                        newUser.setEmail(email);
                        newUser.setPassword(passwordEncoder.encode(generateRandomPassword()));
                        newUser.setGoogleId(googleId);
                        newUser.setRole(UserRole.CUSTOMER);
                        newUser.setActive(true);
                        return userRepository.save(newUser);
                    });
            });

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
            token,
            user.getUsername(),
            user.getEmail(),
            user.getRole().name(),
            jwtService.getExpirationTime()
        );
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("No account found with that email address"));

        // Delete any existing tokens for this email
        passwordResetTokenRepository.deleteByEmail(email);

        // Generate token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setEmail(email);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        passwordResetTokenRepository.save(resetToken);

        // Build reset URL using the first allowed origin
        String baseUrl = allowedOrigins.split(",")[0].trim();
        String resetUrl = baseUrl + "/reset-password?token=" + token;

        emailService.sendPasswordResetLink(email, resetUrl);
    }

    @Transactional
    public void resetCredentials(String token, String newUsername, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndIsUsedFalse(token)
            .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Reset link has expired");
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Update username if provided and different
        if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(user.getUsername())) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(newUsername);
        }

        // Update password if provided
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    @Transactional
    public void changeCredentials(Long userId, String newUsername, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Update username if provided and different
        if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(user.getUsername())) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(newUsername);
        }

        // Update password if provided
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100 + random.nextInt(900); // 3 digit code
        return String.valueOf(code);
    }

    private String generateRandomPassword() {
        return java.util.UUID.randomUUID().toString();
    }
}
