package com.hvac.dto;

import lombok.Data;

@Data
public class PredictionResponse {
    private String deviceId;
    private Double estimatedRuntime; // hours remaining
    private Double dailyEnergyPrediction; // kWh
    private Double monthlyEnergyPrediction; // kWh
    private Double efficiencyScore; // 0-100
    private String maintenanceRecommendation;
}
