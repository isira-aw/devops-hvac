package com.hvac.config;

import com.hvac.entity.User;
import com.hvac.entity.User.UserRole;
import com.hvac.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Create default admin if not exists
        String defaultAdminEmail = "isira.aw@gmail.com";
        String defaultAdminPassword = "000000";

        if (!userRepository.existsByEmail(defaultAdminEmail)) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail(defaultAdminEmail);
            admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);

            userRepository.save(admin);
            logger.info("Default admin user created with email: {}", defaultAdminEmail);
        } else {
            logger.info("Default admin user already exists");
        }
    }
}
