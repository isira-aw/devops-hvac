package com.hvac.dto;

import lombok.Data;

@Data
public class ControlCommand {
    private String deviceId;
    private Boolean systemOn;
    private String mode; // COOLING, HEATING
    private String fanSpeed; // LOW, MED, HIGH
    private Double temperatureSetpoint;
}
