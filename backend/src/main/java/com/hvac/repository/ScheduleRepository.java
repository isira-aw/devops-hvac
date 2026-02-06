package com.hvac.repository;

import com.hvac.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByDeviceIdAndIsActiveTrue(String deviceId);

    List<Schedule> findByDeviceId(String deviceId);

    List<Schedule> findByIsActiveTrue();
}
