package com.hvac.controller;

import com.hvac.dto.*;
import com.hvac.entity.FaultLog;
import com.hvac.entity.User;
import com.hvac.repository.FaultLogRepository;
import com.hvac.repository.UserRepository;
import com.hvac.service.AuthService;
import com.hvac.service.DashboardService;
import com.hvac.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DeviceService deviceService;
    private final DashboardService dashboardService;
    private final AuthService authService;
    private final FaultLogRepository faultLogRepository;
    private final UserRepository userRepository;

    public AdminController(
            DeviceService deviceService,
            DashboardService dashboardService,
            AuthService authService,
            FaultLogRepository faultLogRepository,
            UserRepository userRepository
    ) {
        this.deviceService = deviceService;
        this.dashboardService = dashboardService;
        this.authService = authService;
        this.faultLogRepository = faultLogRepository;
        this.userRepository = userRepository;
    }

    // Dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getAdminDashboardStats());
    }

    // Device Management
    @PostMapping("/devices")
    public ResponseEntity<?> registerDevice(@Valid @RequestBody DeviceRequest request) {
        try {
            DeviceResponse response = deviceService.registerDevice(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/devices")
    public ResponseEntity<Page<DeviceResponse>> getAllDevices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(deviceService.getAllDevices(pageable));
    }

    @GetMapping("/devices/{deviceId}")
    public ResponseEntity<?> getDevice(@PathVariable String deviceId) {
        try {
            return ResponseEntity.ok(deviceService.getDevice(deviceId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/devices/{deviceId}")
    public ResponseEntity<?> updateDevice(
            @PathVariable String deviceId,
            @Valid @RequestBody DeviceRequest request
    ) {
        try {
            DeviceResponse response = deviceService.updateDevice(deviceId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/devices/{deviceId}")
    public ResponseEntity<?> deleteDevice(@PathVariable String deviceId) {
        try {
            deviceService.deleteDevice(deviceId);
            return ResponseEntity.ok(Map.of("message", "Device deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/devices/{deviceId}/license")
    public ResponseEntity<?> updateLicense(
            @PathVariable String deviceId,
            @RequestBody Map<String, Boolean> body
    ) {
        try {
            Boolean isLicensed = body.get("isLicensed");
            if (isLicensed == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "isLicensed is required"));
            }
            deviceService.updateLicense(deviceId, isLicensed);
            return ResponseEntity.ok(Map.of("message", "License updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin Management
    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.registerAdmin(request);
            return ResponseEntity.ok(Map.of("message", "Admin created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admins")
    public ResponseEntity<Page<User>> getAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(dashboardService.getAdmins(pageable));
    }

    @DeleteMapping("/admins/{adminId}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long adminId) {
        try {
            userRepository.deleteById(adminId);
            return ResponseEntity.ok(Map.of("message", "Admin deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Users (Customers)
    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(dashboardService.getCustomers(pageable));
    }

    // Faults
    @GetMapping("/faults")
    public ResponseEntity<Page<FaultLog>> getAllFaults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(faultLogRepository.findAll(pageable));
    }

    @GetMapping("/faults/unresolved")
    public ResponseEntity<Page<FaultLog>> getUnresolvedFaults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(faultLogRepository.findByIsResolvedFalseOrderByCreatedAtDesc(pageable));
    }
}
