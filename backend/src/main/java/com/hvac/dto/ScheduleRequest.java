package com.hvac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScheduleRequest {
    @NotBlank(message = "Device ID is required")
    private String deviceId;

    private String name;

    @NotBlank(message = "Start time is required")
    private String startTime; // HH:mm format

    @NotBlank(message = "End time is required")
    private String endTime; // HH:mm format

    @NotBlank(message = "Days of week is required")
    private String daysOfWeek; // MON,TUE,WED...

    private boolean systemOn = true;
    private String mode = "COOLING";
    private Double temperatureSetpoint = 24.0;
    private String fanSpeed = "MED";
}
