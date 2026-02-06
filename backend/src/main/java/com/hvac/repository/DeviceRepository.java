package com.hvac.repository;

import com.hvac.entity.Device;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {
    Optional<Device> findByDeviceId(String deviceId);
    boolean existsByDeviceId(String deviceId);
    Page<Device> findByIsLicensed(boolean isLicensed, Pageable pageable);

    @Query("SELECT d FROM Device d WHERE d.lastHeartbeat < :threshold")
    List<Device> findDevicesWithOldHeartbeat(LocalDateTime threshold);

    @Query("SELECT COUNT(d) FROM Device d WHERE d.isOnline = true")
    long countOnlineDevices();

    @Query("SELECT COUNT(d) FROM Device d WHERE d.isLicensed = true")
    long countLicensedDevices();
}
