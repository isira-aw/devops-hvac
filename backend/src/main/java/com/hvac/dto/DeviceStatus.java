package com.hvac.dto;

import lombok.Data;

/**
 * DTO for parsing device status messages from IoT devices.
 * The device reports its current confirmed state via MQTT.
 */
@Data
public class DeviceStatus {
    private Boolean online;
    private Boolean systemOn;
    private String mode;
    private String fanSpeed;
    private Double temperatureSetpoint;
}
