package com.hvac.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "fault_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaultLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "fault_type", nullable = false)
    private FaultType faultType;

    @Column(name = "description")
    private String description;

    @Column(name = "severity")
    private String severity;

    @Column(name = "value")
    private String value;

    @Column(name = "threshold")
    private String threshold;

    @Column(name = "is_resolved")
    private boolean isResolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum FaultType {
        OVERCURRENT,
        PHASE_FAILURE,
        OVERHEATING,
        FILTER_CHOKE,
        SENSOR_FAILURE,
        DEVICE_OFFLINE,
        LOW_VOLTAGE,
        HIGH_VOLTAGE
    }
}
