package com.hvac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class DeviceRequest {
    @NotBlank(message = "Device name is required")
    private String deviceName;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Device ID is required")
    private String deviceId;

    private String accessPassword;

    private boolean isLicensed = true;

    private boolean requireEmailVerification = false;

    private List<String> allowedEmails;

    private String allowedEmailDomain;
}
