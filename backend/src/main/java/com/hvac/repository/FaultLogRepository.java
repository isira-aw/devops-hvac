package com.hvac.repository;

import com.hvac.entity.FaultLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FaultLogRepository extends JpaRepository<FaultLog, Long> {

    List<FaultLog> findByDeviceIdOrderByCreatedAtDesc(String deviceId);

    Page<FaultLog> findByDeviceIdOrderByCreatedAtDesc(String deviceId, Pageable pageable);

    List<FaultLog> findByDeviceIdAndIsResolvedFalseOrderByCreatedAtDesc(String deviceId);

    Page<FaultLog> findByIsResolvedFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(f) FROM FaultLog f WHERE f.isResolved = false")
    long countUnresolvedFaults();

    @Query("SELECT COUNT(f) FROM FaultLog f WHERE f.deviceId = :deviceId AND f.isResolved = false")
    long countUnresolvedFaultsByDevice(String deviceId);

    List<FaultLog> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since);
}
