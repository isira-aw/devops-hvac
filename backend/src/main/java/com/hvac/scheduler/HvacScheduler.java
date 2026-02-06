package com.hvac.scheduler;

import com.hvac.entity.Device;
import com.hvac.entity.Schedule;
import com.hvac.repository.DeviceRepository;
import com.hvac.repository.TelemetryRepository;
import com.hvac.repository.VerificationCodeRepository;
import com.hvac.service.FaultDetectionService;
import com.hvac.service.ScheduleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Component
public class HvacScheduler {

    private static final Logger logger = LoggerFactory.getLogger(HvacScheduler.class);

    private final TelemetryRepository telemetryRepository;
    private final DeviceRepository deviceRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final ScheduleService scheduleService;
    private final FaultDetectionService faultDetectionService;

    @Value("${telemetry.retention.days:7}")
    private int retentionDays;

    public HvacScheduler(
            TelemetryRepository telemetryRepository,
            DeviceRepository deviceRepository,
            VerificationCodeRepository verificationCodeRepository,
            ScheduleService scheduleService,
            FaultDetectionService faultDetectionService
    ) {
        this.telemetryRepository = telemetryRepository;
        this.deviceRepository = deviceRepository;
        this.verificationCodeRepository = verificationCodeRepository;
        this.scheduleService = scheduleService;
        this.faultDetectionService = faultDetectionService;
    }

    // Delete telemetry older than 7 days - runs daily at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void cleanupOldTelemetry() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        int deleted = telemetryRepository.deleteOlderThan(threshold);
        logger.info("Deleted {} telemetry records older than {} days", deleted, retentionDays);
    }

    // Delete expired verification codes - runs every hour
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredVerificationCodes() {
        verificationCodeRepository.deleteExpiredCodes(LocalDateTime.now());
        logger.debug("Cleaned up expired verification codes");
    }

    // Check device heartbeats - runs every minute
    @Scheduled(fixedRate = 60000)
    public void checkDeviceHeartbeats() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);
        List<Device> offlineDevices = deviceRepository.findDevicesWithOldHeartbeat(threshold);

        for (Device device : offlineDevices) {
            if (device.isOnline()) {
                device.setOnline(false);
                deviceRepository.save(device);
                faultDetectionService.logDeviceOffline(device.getDeviceId());
                logger.warn("Device {} marked as offline", device.getDeviceId());
            }
        }
    }

    // Execute schedules - runs every minute
    @Scheduled(fixedRate = 60000)
    public void executeSchedules() {
        LocalTime now = LocalTime.now();
        DayOfWeek today = LocalDateTime.now().getDayOfWeek();
        String todayShort = today.getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase();

        List<Schedule> activeSchedules = scheduleService.getActiveSchedules();

        for (Schedule schedule : activeSchedules) {
            if (schedule.getDaysOfWeek().contains(todayShort)) {
                // Check if current time matches start time (within 1 minute)
                if (isWithinMinute(now, schedule.getStartTime())) {
                    logger.info("Executing schedule {} for device {}", schedule.getName(), schedule.getDeviceId());
                    try {
                        scheduleService.executeSchedule(schedule);
                    } catch (Exception e) {
                        logger.error("Failed to execute schedule {}: {}", schedule.getId(), e.getMessage());
                    }
                }
            }
        }
    }

    private boolean isWithinMinute(LocalTime now, LocalTime target) {
        return now.getHour() == target.getHour() && now.getMinute() == target.getMinute();
    }
}
