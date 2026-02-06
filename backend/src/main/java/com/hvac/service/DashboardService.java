package com.hvac.service;

import com.hvac.dto.DashboardStats;
import com.hvac.entity.User;
import com.hvac.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class DashboardService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final FaultLogRepository faultLogRepository;
    private final TelemetryRepository telemetryRepository;

    public DashboardService(
            DeviceRepository deviceRepository,
            UserRepository userRepository,
            FaultLogRepository faultLogRepository,
            TelemetryRepository telemetryRepository
    ) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.faultLogRepository = faultLogRepository;
        this.telemetryRepository = telemetryRepository;
    }

    public DashboardStats getAdminDashboardStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalDevices(deviceRepository.count());
        stats.setOnlineDevices(deviceRepository.countOnlineDevices());
        stats.setLicensedDevices(deviceRepository.countLicensedDevices());
        stats.setTotalUsers(userRepository.count());
        stats.setUnresolvedFaults(faultLogRepository.countUnresolvedFaults());

        // Calculate total energy today
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        // This would need to aggregate across all devices
        stats.setTotalEnergyToday(0.0); // Simplified for MVP

        return stats;
    }

    public Page<User> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Page<User> getCustomers(Pageable pageable) {
        return userRepository.findByRole(User.UserRole.CUSTOMER, pageable);
    }

    public Page<User> getAdmins(Pageable pageable) {
        return userRepository.findByRole(User.UserRole.ADMIN, pageable);
    }
}
