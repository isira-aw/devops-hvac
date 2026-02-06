package com.hvac.service;

import com.hvac.dto.PredictionResponse;
import com.hvac.dto.TelemetryData;
import com.hvac.entity.Device;
import com.hvac.repository.DeviceRepository;
import com.hvac.repository.TelemetryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PredictionService {

    private static final double MAX_CAPACITY_KWH = 100.0; // Example capacity
    private static final double OPTIMAL_EFFICIENCY_DELTA = 8.0; // Temperature difference

    private final TelemetryRepository telemetryRepository;
    private final TelemetryService telemetryService;
    private final DeviceRepository deviceRepository;

    public PredictionService(
            TelemetryRepository telemetryRepository,
            TelemetryService telemetryService,
            DeviceRepository deviceRepository
    ) {
        this.telemetryRepository = telemetryRepository;
        this.telemetryService = telemetryService;
        this.deviceRepository = deviceRepository;
    }

    public PredictionResponse getPredictions(String deviceId) {
        PredictionResponse response = new PredictionResponse();
        response.setDeviceId(deviceId);

        // Get latest telemetry
        TelemetryData latest = telemetryService.getLatestTelemetry(deviceId);
        if (latest == null) {
            response.setEstimatedRuntime(0.0);
            response.setDailyEnergyPrediction(0.0);
            response.setMonthlyEnergyPrediction(0.0);
            response.setEfficiencyScore(0.0);
            response.setMaintenanceRecommendation("No data available");
            return response;
        }

        // Calculate estimated runtime
        // runtime = remaining_capacity / current_load
        double currentLoad = latest.getPowerWatts() != null ? latest.getPowerWatts() / 1000.0 : 1.0;
        double remainingCapacity = MAX_CAPACITY_KWH - (latest.getEnergyKwh() != null ? latest.getEnergyKwh() : 0);
        double estimatedRuntime = currentLoad > 0 ? remainingCapacity / currentLoad : 0;
        response.setEstimatedRuntime(Math.max(0, estimatedRuntime));

        // Calculate daily energy prediction (based on average usage)
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        Double dailyAvg = telemetryRepository.getAverageEnergyUsage(deviceId, oneDayAgo);
        double dailyPrediction = dailyAvg != null ? dailyAvg * 24 : 0;
        response.setDailyEnergyPrediction(dailyPrediction);

        // Calculate monthly energy prediction
        response.setMonthlyEnergyPrediction(dailyPrediction * 30);

        // Calculate efficiency score
        double efficiencyScore = calculateEfficiencyScore(latest);
        response.setEfficiencyScore(efficiencyScore);

        // Generate maintenance recommendation
        response.setMaintenanceRecommendation(generateRecommendation(latest, efficiencyScore));

        return response;
    }

    private double calculateEfficiencyScore(TelemetryData data) {
        double score = 100.0;

        // Factor 1: Temperature delta (supply vs return)
        if (data.getSupplyAirTemp() != null && data.getReturnAirTemp() != null) {
            double delta = Math.abs(data.getReturnAirTemp() - data.getSupplyAirTemp());
            if (delta < OPTIMAL_EFFICIENCY_DELTA) {
                score -= (OPTIMAL_EFFICIENCY_DELTA - delta) * 5;
            }
        }

        // Factor 2: Filter condition
        if ("DIRTY".equalsIgnoreCase(data.getFilterCondition())) {
            score -= 15;
        } else if ("CLOGGED".equalsIgnoreCase(data.getFilterCondition())) {
            score -= 30;
        }

        // Factor 3: Airflow status
        if ("RESTRICTED".equalsIgnoreCase(data.getAirflowStatus())) {
            score -= 20;
        }

        // Factor 4: Power factor (implied from voltage and current)
        if (data.getPowerWatts() != null && data.getLineVoltage() != null && data.getCurrentAmps() != null) {
            double apparentPower = data.getLineVoltage() * data.getCurrentAmps();
            if (apparentPower > 0) {
                double powerFactor = data.getPowerWatts() / apparentPower;
                if (powerFactor < 0.85) {
                    score -= (0.85 - powerFactor) * 50;
                }
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    private String generateRecommendation(TelemetryData data, double efficiencyScore) {
        if (efficiencyScore >= 90) {
            return "System operating optimally. No maintenance required.";
        } else if (efficiencyScore >= 70) {
            if ("DIRTY".equalsIgnoreCase(data.getFilterCondition())) {
                return "Consider replacing air filter soon.";
            }
            return "System efficiency is good. Monitor for changes.";
        } else if (efficiencyScore >= 50) {
            return "Schedule maintenance check. Filter may need replacement.";
        } else {
            return "Urgent maintenance required. System efficiency is low.";
        }
    }
}
