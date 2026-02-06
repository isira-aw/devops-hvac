package com.hvac.controller;

import com.hvac.dto.*;
import com.hvac.entity.FaultLog;
import com.hvac.entity.Schedule;
import com.hvac.repository.FaultLogRepository;
import com.hvac.security.CustomUserDetails;
import com.hvac.service.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final DeviceService deviceService;
    private final TelemetryService telemetryService;
    private final PredictionService predictionService;
    private final ScheduleService scheduleService;
    private final FaultLogRepository faultLogRepository;

    public CustomerController(
            DeviceService deviceService,
            TelemetryService telemetryService,
            PredictionService predictionService,
            ScheduleService scheduleService,
            FaultLogRepository faultLogRepository
    ) {
        this.deviceService = deviceService;
        this.telemetryService = telemetryService;
        this.predictionService = predictionService;
        this.scheduleService = scheduleService;
        this.faultLogRepository = faultLogRepository;
    }

    // Device Management
    @GetMapping("/devices")
    public ResponseEntity<List<DeviceResponse>> getMyDevices(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<DeviceResponse> devices = deviceService.getUserDevices(userDetails.getUserId());
        return ResponseEntity.ok(devices);
    }

    @PostMapping("/devices/assign")
    public ResponseEntity<?> assignDevice(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DeviceAssignRequest request
    ) {
        try {
            deviceService.assignDeviceToUser(
                userDetails.getUserId(),
                request.getDeviceId(),
                request.getAccessPassword()
            );
            return ResponseEntity.ok(Map.of("message", "Device assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/devices/{deviceId}/unassign")
    public ResponseEntity<?> unassignDevice(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId
    ) {
        try {
            deviceService.unassignDevice(userDetails.getUserId(), deviceId);
            return ResponseEntity.ok(Map.of("message", "Device unassigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/devices/{deviceId}")
    public ResponseEntity<?> updateDevice(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId,
            @Valid @RequestBody DeviceRequest request
    ) {
        try {
            DeviceResponse response = deviceService.updateDeviceByCustomer(
                userDetails.getUserId(),
                deviceId,
                request
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Device Status & Telemetry
    @GetMapping("/devices/{deviceId}/status")
    public ResponseEntity<?> getDeviceStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            DeviceResponse device = deviceService.getDevice(deviceId);
            TelemetryData latestTelemetry = telemetryService.getLatestTelemetry(deviceId);
            return ResponseEntity.ok(Map.of(
                "device", device,
                "telemetry", latestTelemetry != null ? latestTelemetry : Map.of()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/devices/{deviceId}/telemetry")
    public ResponseEntity<?> getTelemetry(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "100") int limit
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        List<TelemetryData> telemetry = telemetryService.getRecentTelemetry(deviceId, limit);
        return ResponseEntity.ok(telemetry);
    }

    @GetMapping("/devices/{deviceId}/telemetry/history")
    public ResponseEntity<?> getTelemetryHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        LocalDateTime start = from != null ? LocalDateTime.parse(from) : LocalDateTime.now().minusDays(1);
        LocalDateTime end = to != null ? LocalDateTime.parse(to) : LocalDateTime.now();

        List<TelemetryData> telemetry = telemetryService.getTelemetryBetween(deviceId, start, end);
        return ResponseEntity.ok(telemetry);
    }

    // Control
    @PostMapping("/devices/{deviceId}/control")
    public ResponseEntity<?> sendControl(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId,
            @RequestBody ControlCommand command
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            deviceService.sendControlCommand(deviceId, command);
            return ResponseEntity.ok(Map.of("message", "Control command sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Predictions
    @GetMapping("/devices/{deviceId}/predictions")
    public ResponseEntity<?> getPredictions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        PredictionResponse predictions = predictionService.getPredictions(deviceId);
        return ResponseEntity.ok(predictions);
    }

    // Faults
    @GetMapping("/devices/{deviceId}/faults")
    public ResponseEntity<?> getDeviceFaults(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<FaultLog> faults = faultLogRepository.findByDeviceIdOrderByCreatedAtDesc(deviceId, pageable);
        return ResponseEntity.ok(faults);
    }

    // Schedules
    @GetMapping("/devices/{deviceId}/schedules")
    public ResponseEntity<?> getDeviceSchedules(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        List<Schedule> schedules = scheduleService.getDeviceSchedules(deviceId);
        return ResponseEntity.ok(schedules);
    }

    @PostMapping("/devices/{deviceId}/schedules")
    public ResponseEntity<?> createSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String deviceId,
            @Valid @RequestBody ScheduleRequest request
    ) {
        if (!deviceService.isDeviceAssignedToUser(userDetails.getUserId(), deviceId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        try {
            request.setDeviceId(deviceId);
            Schedule schedule = scheduleService.createSchedule(request);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/schedules/{scheduleId}")
    public ResponseEntity<?> deleteSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduleId
    ) {
        try {
            scheduleService.deleteSchedule(scheduleId);
            return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // User Profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(Map.of(
            "id", userDetails.getUserId(),
            "username", userDetails.getUsername(),
            "email", userDetails.getEmail(),
            "role", userDetails.getRole()
        ));
    }
}
