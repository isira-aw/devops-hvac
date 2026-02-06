package com.hvac.repository;

import com.hvac.entity.Telemetry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {

    List<Telemetry> findByDeviceIdOrderByTimestampDesc(String deviceId);

    Page<Telemetry> findByDeviceIdOrderByTimestampDesc(String deviceId, Pageable pageable);

    List<Telemetry> findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(
        String deviceId, LocalDateTime start, LocalDateTime end);

    Optional<Telemetry> findTopByDeviceIdOrderByTimestampDesc(String deviceId);

    @Query("SELECT t FROM Telemetry t WHERE t.deviceId = :deviceId ORDER BY t.timestamp DESC LIMIT 100")
    List<Telemetry> findLatestByDeviceId(String deviceId);

    @Query("SELECT AVG(t.energyKwh) FROM Telemetry t WHERE t.deviceId = :deviceId AND t.timestamp >= :since")
    Double getAverageEnergyUsage(String deviceId, LocalDateTime since);

    @Query("SELECT SUM(t.energyKwh) FROM Telemetry t WHERE t.deviceId = :deviceId AND t.timestamp >= :since")
    Double getTotalEnergyUsage(String deviceId, LocalDateTime since);

    @Modifying
    @Transactional
    @Query("DELETE FROM Telemetry t WHERE t.timestamp < :threshold")
    int deleteOlderThan(LocalDateTime threshold);

    @Query("SELECT COUNT(t) FROM Telemetry t WHERE t.deviceId = :deviceId")
    long countByDeviceId(String deviceId);
}
