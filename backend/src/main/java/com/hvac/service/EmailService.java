package com.hvac.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:no-reply@yourdomain.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:HVAC System}")
    private String senderName;

    public EmailService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendVerificationCode(String toEmail, String code) {
        try {
            if (brevoApiKey == null || brevoApiKey.isEmpty()) {
                logger.warn("Brevo API key not configured, verification code for {}: {}", toEmail, code);
                return;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            String body = String.format("""
                {
                  "sender": { "name": "%s", "email": "%s" },
                  "to": [{ "email": "%s" }],
                  "subject": "HVAC System - Verification Code",
                  "htmlContent": "<div style='font-family:Arial,sans-serif;padding:20px'><h2>Verification Code</h2><p>Your verification code is:</p><h1 style='color:#2563eb;letter-spacing:4px'>%s</h1><p>This code will expire in 10 minutes.</p><p>If you did not request this code, please ignore this email.</p></div>"
                }
                """, senderName, senderEmail, toEmail, code);

            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Verification code sent to: {}", toEmail);
            } else {
                logger.error("Brevo API returned status {}: {}", response.getStatusCode(), response.getBody());
                logger.info("Verification code for {}: {}", toEmail, code);
            }
        } catch (Exception e) {
            logger.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            logger.info("Verification code for {}: {}", toEmail, code);
        }
    }
}
