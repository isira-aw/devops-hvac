package com.hvac.service;

import com.hvac.entity.FaultLog;
import com.hvac.entity.FaultLog.FaultType;
import com.hvac.entity.Telemetry;
import com.hvac.repository.FaultLogRepository;
import org.springframework.stereotype.Service;

@Service
public class FaultDetectionService {

    // Thresholds
    private static final double MAX_CURRENT = 20.0; // Amps
    private static final double MIN_VOLTAGE = 200.0; // Volts
    private static final double MAX_VOLTAGE = 250.0; // Volts
    private static final double MAX_TEMPERATURE = 40.0; // Celsius
    private static final double VOLTAGE_IMBALANCE_THRESHOLD = 0.1; // 10%

    private final FaultLogRepository faultLogRepository;

    public FaultDetectionService(FaultLogRepository faultLogRepository) {
        this.faultLogRepository = faultLogRepository;
    }

    public void checkForFaults(String deviceId, Telemetry telemetry) {
        // Check overcurrent
        if (telemetry.getCurrentAmps() != null && telemetry.getCurrentAmps() > MAX_CURRENT) {
            logFault(deviceId, FaultType.OVERCURRENT,
                "Current exceeds threshold",
                "HIGH",
                String.valueOf(telemetry.getCurrentAmps()),
                String.valueOf(MAX_CURRENT));
        }

        // Check voltage
        if (telemetry.getLineVoltage() != null) {
            if (telemetry.getLineVoltage() < MIN_VOLTAGE) {
                logFault(deviceId, FaultType.LOW_VOLTAGE,
                    "Voltage below minimum threshold",
                    "MEDIUM",
                    String.valueOf(telemetry.getLineVoltage()),
                    String.valueOf(MIN_VOLTAGE));
            }
            if (telemetry.getLineVoltage() > MAX_VOLTAGE) {
                logFault(deviceId, FaultType.HIGH_VOLTAGE,
                    "Voltage above maximum threshold",
                    "HIGH",
                    String.valueOf(telemetry.getLineVoltage()),
                    String.valueOf(MAX_VOLTAGE));
            }
        }

        // Check overheating
        if (telemetry.getSupplyAirTemp() != null && telemetry.getSupplyAirTemp() > MAX_TEMPERATURE) {
            logFault(deviceId, FaultType.OVERHEATING,
                "Supply air temperature exceeds limit",
                "HIGH",
                String.valueOf(telemetry.getSupplyAirTemp()),
                String.valueOf(MAX_TEMPERATURE));
        }

        // Check filter condition
        if ("CLOGGED".equalsIgnoreCase(telemetry.getFilterCondition())) {
            logFault(deviceId, FaultType.FILTER_CHOKE,
                "Air filter is clogged",
                "MEDIUM",
                telemetry.getFilterCondition(),
                "CLEAN");
        }

        // Check sensor failure (null or invalid data)
        if (telemetry.getRoomTemp() == null ||
            telemetry.getRoomTemp() < -50 ||
            telemetry.getRoomTemp() > 100) {
            logFault(deviceId, FaultType.SENSOR_FAILURE,
                "Room temperature sensor failure",
                "MEDIUM",
                telemetry.getRoomTemp() != null ? String.valueOf(telemetry.getRoomTemp()) : "null",
                "Valid range: -50 to 100");
        }
    }

    public void logDeviceOffline(String deviceId) {
        logFault(deviceId, FaultType.DEVICE_OFFLINE,
            "Device heartbeat timeout",
            "HIGH",
            "No heartbeat",
            "Expected heartbeat");
    }

    private void logFault(String deviceId, FaultType type, String description,
                         String severity, String value, String threshold) {
        // Check if similar unresolved fault already exists
        var existingFaults = faultLogRepository.findByDeviceIdAndIsResolvedFalseOrderByCreatedAtDesc(deviceId);
        boolean alreadyExists = existingFaults.stream()
            .anyMatch(f -> f.getFaultType() == type);

        if (!alreadyExists) {
            FaultLog fault = new FaultLog();
            fault.setDeviceId(deviceId);
            fault.setFaultType(type);
            fault.setDescription(description);
            fault.setSeverity(severity);
            fault.setValue(value);
            fault.setThreshold(threshold);
            faultLogRepository.save(fault);
        }
    }
}
