package com.hvac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeviceAssignRequest {
    @NotBlank(message = "Device ID is required")
    private String deviceId;

    private String accessPassword;
}
