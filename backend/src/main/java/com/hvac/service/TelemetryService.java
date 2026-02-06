package com.hvac.service;

import com.hvac.dto.TelemetryData;
import com.hvac.entity.Telemetry;
import com.hvac.repository.TelemetryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;

    public TelemetryService(TelemetryRepository telemetryRepository) {
        this.telemetryRepository = telemetryRepository;
    }

    public TelemetryData getLatestTelemetry(String deviceId) {
        Optional<Telemetry> latest = telemetryRepository.findTopByDeviceIdOrderByTimestampDesc(deviceId);
        return latest.map(TelemetryData::fromEntity).orElse(null);
    }

    public List<TelemetryData> getRecentTelemetry(String deviceId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return telemetryRepository.findByDeviceIdOrderByTimestampDesc(deviceId, pageable)
            .stream()
            .map(TelemetryData::fromEntity)
            .collect(Collectors.toList());
    }

    public List<TelemetryData> getTelemetryBetween(String deviceId, LocalDateTime start, LocalDateTime end) {
        return telemetryRepository.findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(deviceId, start, end)
            .stream()
            .map(TelemetryData::fromEntity)
            .collect(Collectors.toList());
    }

    public Page<TelemetryData> getDeviceTelemetry(String deviceId, Pageable pageable) {
        return telemetryRepository.findByDeviceIdOrderByTimestampDesc(deviceId, pageable)
            .map(TelemetryData::fromEntity);
    }

    public Double getTotalEnergyUsage(String deviceId, LocalDateTime since) {
        Double total = telemetryRepository.getTotalEnergyUsage(deviceId, since);
        return total != null ? total : 0.0;
    }

    public Double getAverageEnergyUsage(String deviceId, LocalDateTime since) {
        Double avg = telemetryRepository.getAverageEnergyUsage(deviceId, since);
        return avg != null ? avg : 0.0;
    }
}
