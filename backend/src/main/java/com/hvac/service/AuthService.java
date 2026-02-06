package com.hvac.service;

import com.hvac.dto.*;
import com.hvac.entity.User;
import com.hvac.entity.User.UserRole;
import com.hvac.entity.VerificationCode;
import com.hvac.repository.UserRepository;
import com.hvac.repository.VerificationCodeRepository;
import com.hvac.security.CustomUserDetails;
import com.hvac.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthService(
            UserRepository userRepository,
            VerificationCodeRepository verificationCodeRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.verificationCodeRepository = verificationCodeRepository;
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

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100 + random.nextInt(900); // 3 digit code
        return String.valueOf(code);
    }

    private String generateRandomPassword() {
        return java.util.UUID.randomUUID().toString();
    }
}
