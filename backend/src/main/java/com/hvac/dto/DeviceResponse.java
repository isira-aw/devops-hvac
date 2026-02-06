package com.hvac.dto;

import com.hvac.entity.Device;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DeviceResponse {
    private Long id;
    private String deviceId;
    private String deviceName;
    private String location;
    private String accessPassword;
    private boolean isLicensed;
    private boolean requireEmailVerification;
    private List<String> allowedEmails;
    private String allowedEmailDomain;
    private boolean isOnline;
    private LocalDateTime lastHeartbeat;
    private boolean systemOn;
    private String mode;
    private String fanSpeed;
    private Double temperatureSetpoint;
    private LocalDateTime createdAt;

    public static DeviceResponse fromEntity(Device device) {
        DeviceResponse response = new DeviceResponse();
        response.setId(device.getId());
        response.setDeviceId(device.getDeviceId());
        response.setDeviceName(device.getDeviceName());
        response.setLocation(device.getLocation());
        response.setAccessPassword(device.getAccessPassword());
        response.setLicensed(device.isLicensed());
        response.setRequireEmailVerification(device.isRequireEmailVerification());
        response.setAllowedEmails(device.getAllowedEmails());
        response.setAllowedEmailDomain(device.getAllowedEmailDomain());
        response.setOnline(device.isOnline());
        response.setLastHeartbeat(device.getLastHeartbeat());
        response.setSystemOn(device.isSystemOn());
        response.setMode(device.getMode());
        response.setFanSpeed(device.getFanSpeed());
        response.setTemperatureSetpoint(device.getTemperatureSetpoint());
        response.setCreatedAt(device.getCreatedAt());
        return response;
    }
}
