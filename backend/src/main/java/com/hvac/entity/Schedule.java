package com.hvac.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "name")
    private String name;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "days_of_week")
    private String daysOfWeek; // e.g., "MON,TUE,WED"

    @Column(name = "system_on")
    private boolean systemOn;

    @Column(name = "mode")
    private String mode;

    @Column(name = "temperature_setpoint")
    private Double temperatureSetpoint;

    @Column(name = "fan_speed")
    private String fanSpeed;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
