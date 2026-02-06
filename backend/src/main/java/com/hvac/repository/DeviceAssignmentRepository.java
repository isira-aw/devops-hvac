package com.hvac.repository;

import com.hvac.entity.Device;
import com.hvac.entity.DeviceAssignment;
import com.hvac.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceAssignmentRepository extends JpaRepository<DeviceAssignment, Long> {
    List<DeviceAssignment> findByUser(User user);
    List<DeviceAssignment> findByDevice(Device device);
    Optional<DeviceAssignment> findByUserAndDevice(User user, Device device);
    boolean existsByUserAndDevice(User user, Device device);
    void deleteByUserAndDevice(User user, Device device);

    @Query("SELECT da.device FROM DeviceAssignment da WHERE da.user = :user")
    List<Device> findDevicesByUser(User user);

    @Query("SELECT da.device.deviceId FROM DeviceAssignment da WHERE da.user.id = :userId")
    List<String> findDeviceIdsByUserId(Long userId);
}
