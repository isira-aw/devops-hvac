package com.hvac.service;

import com.hvac.dto.ControlCommand;
import com.hvac.dto.DeviceRequest;
import com.hvac.dto.DeviceResponse;
import com.hvac.entity.Device;
import com.hvac.entity.DeviceAssignment;
import com.hvac.entity.User;
import com.hvac.mqtt.MqttService;
import com.hvac.repository.DeviceAssignmentRepository;
import com.hvac.repository.DeviceRepository;
import com.hvac.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final DeviceAssignmentRepository deviceAssignmentRepository;
    private final UserRepository userRepository;
    private final MqttService mqttService;

    public DeviceService(
            DeviceRepository deviceRepository,
            DeviceAssignmentRepository deviceAssignmentRepository,
            UserRepository userRepository,
            @Lazy MqttService mqttService) {
        this.deviceRepository = deviceRepository;
        this.deviceAssignmentRepository = deviceAssignmentRepository;
        this.userRepository = userRepository;
        this.mqttService = mqttService;
    }

    @Transactional
    public DeviceResponse registerDevice(DeviceRequest request) {
        if (deviceRepository.existsByDeviceId(request.getDeviceId())) {
            throw new RuntimeException("Device ID already exists");
        }

        Device device = new Device();
        device.setDeviceId(request.getDeviceId());
        device.setDeviceName(request.getDeviceName());
        device.setLocation(request.getLocation());
        device.setAccessPassword(request.getAccessPassword());
        device.setLicensed(request.isLicensed());
        device.setRequireEmailVerification(request.isRequireEmailVerification());
        device.setAllowedEmails(request.getAllowedEmails());
        device.setAllowedEmailDomain(request.getAllowedEmailDomain());

        Device saved = deviceRepository.save(device);
        return DeviceResponse.fromEntity(saved);
    }

    @Transactional
    public DeviceResponse updateDevice(String deviceId, DeviceRequest request) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (request.getDeviceName() != null)
            device.setDeviceName(request.getDeviceName());
        if (request.getLocation() != null)
            device.setLocation(request.getLocation());
        if (request.getAccessPassword() != null)
            device.setAccessPassword(request.getAccessPassword());
        device.setLicensed(request.isLicensed());
        device.setRequireEmailVerification(request.isRequireEmailVerification());
        if (request.getAllowedEmails() != null)
            device.setAllowedEmails(request.getAllowedEmails());
        if (request.getAllowedEmailDomain() != null)
            device.setAllowedEmailDomain(request.getAllowedEmailDomain());

        Device saved = deviceRepository.save(device);
        return DeviceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<DeviceResponse> getAllDevices(Pageable pageable) {
        return deviceRepository.findAll(pageable)
                .map(DeviceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DeviceResponse getDevice(String deviceId) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        return DeviceResponse.fromEntity(device);
    }

    @Transactional
    public void deleteDevice(String deviceId) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        deviceRepository.delete(device);
    }

    @Transactional
    public void assignDeviceToUser(Long userId, String deviceId, String accessPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Check if device is licensed
        if (!device.isLicensed()) {
            throw new RuntimeException("Device is not licensed");
        }

        // Check if email verification is required
        if (device.isRequireEmailVerification()) {
            boolean emailAllowed = false;

            // Check allowed emails list
            if (device.getAllowedEmails() != null && !device.getAllowedEmails().isEmpty()) {
                emailAllowed = device.getAllowedEmails().contains(user.getEmail());
            }

            // Check email domain
            if (!emailAllowed && device.getAllowedEmailDomain() != null && !device.getAllowedEmailDomain().isEmpty()) {
                emailAllowed = user.getEmail().endsWith("@" + device.getAllowedEmailDomain());
            }

            if (!emailAllowed) {
                throw new RuntimeException("Your email is not authorized for this device");
            }
        }

        // Verify access password if required
        if (device.getAccessPassword() != null && !device.getAccessPassword().isEmpty()) {
            if (accessPassword == null || !device.getAccessPassword().equals(accessPassword)) {
                throw new RuntimeException("Invalid access password");
            }
        }

        // Check if already assigned
        if (deviceAssignmentRepository.existsByUserAndDevice(user, device)) {
            throw new RuntimeException("Device already assigned to this user");
        }

        DeviceAssignment assignment = new DeviceAssignment();
        assignment.setUser(user);
        assignment.setDevice(device);
        deviceAssignmentRepository.save(assignment);
    }

    @Transactional
    public void unassignDevice(Long userId, String deviceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        deviceAssignmentRepository.deleteByUserAndDevice(user, device);
    }

    @Transactional(readOnly = true)
    public List<DeviceResponse> getUserDevices(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return deviceAssignmentRepository.findDevicesByUser(user)
                .stream()
                .map(DeviceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public boolean isDeviceAssignedToUser(Long userId, String deviceId) {
        List<String> userDeviceIds = deviceAssignmentRepository.findDeviceIdsByUserId(userId);
        return userDeviceIds.contains(deviceId);
    }

    public void sendControlCommand(String deviceId, ControlCommand command) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.isLicensed()) {
            throw new RuntimeException("Device is not licensed");
        }

        command.setDeviceId(deviceId);
        mqttService.sendControlCommand(deviceId, command);
    }

    @Transactional
    public DeviceResponse updateDeviceByCustomer(Long userId, String deviceId, DeviceRequest request) {
        // Verify user has access
        if (!isDeviceAssignedToUser(userId, deviceId)) {
            throw new RuntimeException("Device not assigned to user");
        }

        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Customer can only update limited fields
        if (request.getDeviceName() != null)
            device.setDeviceName(request.getDeviceName());
        if (request.getLocation() != null)
            device.setLocation(request.getLocation());
        if (request.getAccessPassword() != null)
            device.setAccessPassword(request.getAccessPassword());

        Device saved = deviceRepository.save(device);
        return DeviceResponse.fromEntity(saved);
    }

    @Transactional
    public void updateLicense(String deviceId, boolean isLicensed) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        device.setLicensed(isLicensed);
        deviceRepository.save(device);
    }
}
