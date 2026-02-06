package com.hvac.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false, unique = true)
    private String deviceId;

    @Column(name = "device_name", nullable = false)
    private String deviceName;

    @Column(nullable = false)
    private String location;

    @Column(name = "access_password")
    private String accessPassword;

    @Column(name = "is_licensed")
    private boolean isLicensed = true;

    @Column(name = "require_email_verification")
    private boolean requireEmailVerification = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "device_allowed_emails", joinColumns = @JoinColumn(name = "device_id"))
    @Column(name = "email")
    private List<String> allowedEmails;

    @Column(name = "allowed_email_domain")
    private String allowedEmailDomain;

    @Column(name = "is_online")
    private boolean isOnline = false;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Column(name = "system_on")
    private boolean systemOn = false;

    @Column(name = "mode")
    private String mode = "COOLING";

    @Column(name = "fan_speed")
    private String fanSpeed = "LOW";

    @Column(name = "temperature_setpoint")
    private Double temperatureSetpoint = 24.0;

    @Column(name = "config_version")
    private Long configVersion = 0L;

    /**
     * Gets the config version, returning 0 if null (for existing records).
     */
    public Long getConfigVersion() {
        return configVersion != null ? configVersion : 0L;
    }

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
