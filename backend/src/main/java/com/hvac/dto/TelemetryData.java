package com.hvac.dto;

import com.hvac.entity.Telemetry;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TelemetryData {
    private String deviceId;

    // Environmental
    private Double supplyAirTemp;
    private Double returnAirTemp;
    private Double roomTemp;
    private Double humidity;
    private Double outdoorTemp;

    // Electrical
    private Double lineVoltage;
    private Double currentAmps;
    private Double powerWatts;
    private Double energyKwh;

    // Mechanical
    private Boolean compressorOn;
    private String fanSpeed;
    private String airflowStatus;
    private String filterCondition;

    private LocalDateTime timestamp;

    public static TelemetryData fromEntity(Telemetry telemetry) {
        TelemetryData data = new TelemetryData();
        data.setDeviceId(telemetry.getDeviceId());
        data.setSupplyAirTemp(telemetry.getSupplyAirTemp());
        data.setReturnAirTemp(telemetry.getReturnAirTemp());
        data.setRoomTemp(telemetry.getRoomTemp());
        data.setHumidity(telemetry.getHumidity());
        data.setOutdoorTemp(telemetry.getOutdoorTemp());
        data.setLineVoltage(telemetry.getLineVoltage());
        data.setCurrentAmps(telemetry.getCurrentAmps());
        data.setPowerWatts(telemetry.getPowerWatts());
        data.setEnergyKwh(telemetry.getEnergyKwh());
        data.setCompressorOn(telemetry.getCompressorOn());
        data.setFanSpeed(telemetry.getFanSpeed());
        data.setAirflowStatus(telemetry.getAirflowStatus());
        data.setFilterCondition(telemetry.getFilterCondition());
        data.setTimestamp(telemetry.getTimestamp());
        return data;
    }
}
