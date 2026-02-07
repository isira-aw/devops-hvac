package com.hvac.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetLink(String toEmail, String resetUrl) {
        try {
            if (fromEmail == null || fromEmail.isEmpty()) {
                logger.warn("Email not configured, password reset link for {}: {}", toEmail, resetUrl);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("HVAC System - Password & Username Recovery");
            message.setText(
                "You requested to reset your credentials.\n\n" +
                "Click the link below to set a new username and password:\n\n" +
                resetUrl + "\n\n" +
                "This link will expire in 30 minutes.\n\n" +
                "If you did not request this, please ignore this email."
            );

            mailSender.send(message);
            logger.info("Password reset link sent to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            logger.info("Password reset link for {}: {}", toEmail, resetUrl);
        }
    }

    public void sendVerificationCode(String toEmail, String code) {
        try {
            if (fromEmail == null || fromEmail.isEmpty()) {
                logger.warn("Email not configured, verification code for {}: {}", toEmail, code);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("HVAC System - Verification Code");
            message.setText(
                "Your verification code is: " + code + "\n\n" +
                "This code will expire in 10 minutes.\n\n" +
                "If you did not request this code, please ignore this email."
            );

            mailSender.send(message);
            logger.info("Verification code sent to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            // Log the code for development purposes
            logger.info("Verification code for {}: {}", toEmail, code);
        }
    }
}
