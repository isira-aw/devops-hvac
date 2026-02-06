package com.hvac.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry", indexes = {
    @Index(name = "idx_telemetry_device_timestamp", columnList = "device_id, timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Telemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    // Environmental
    @Column(name = "supply_air_temp")
    private Double supplyAirTemp;

    @Column(name = "return_air_temp")
    private Double returnAirTemp;

    @Column(name = "room_temp")
    private Double roomTemp;

    @Column(name = "humidity")
    private Double humidity;

    @Column(name = "outdoor_temp")
    private Double outdoorTemp;

    // Electrical
    @Column(name = "line_voltage")
    private Double lineVoltage;

    @Column(name = "current_amps")
    private Double currentAmps;

    @Column(name = "power_watts")
    private Double powerWatts;

    @Column(name = "energy_kwh")
    private Double energyKwh;

    // Mechanical
    @Column(name = "compressor_on")
    private Boolean compressorOn;

    @Column(name = "fan_speed")
    private String fanSpeed;

    @Column(name = "airflow_status")
    private String airflowStatus;

    @Column(name = "filter_condition")
    private String filterCondition;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
