package com.hvac.service;

import com.hvac.dto.ControlCommand;
import com.hvac.dto.ScheduleRequest;
import com.hvac.entity.Schedule;
import com.hvac.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final DeviceService deviceService;

    public ScheduleService(ScheduleRepository scheduleRepository, DeviceService deviceService) {
        this.scheduleRepository = scheduleRepository;
        this.deviceService = deviceService;
    }

    @Transactional
    public Schedule createSchedule(ScheduleRequest request) {
        Schedule schedule = new Schedule();
        schedule.setDeviceId(request.getDeviceId());
        schedule.setName(request.getName());
        schedule.setStartTime(LocalTime.parse(request.getStartTime()));
        schedule.setEndTime(LocalTime.parse(request.getEndTime()));
        schedule.setDaysOfWeek(request.getDaysOfWeek());
        schedule.setSystemOn(request.isSystemOn());
        schedule.setMode(request.getMode());
        schedule.setTemperatureSetpoint(request.getTemperatureSetpoint());
        schedule.setFanSpeed(request.getFanSpeed());
        schedule.setActive(true);

        return scheduleRepository.save(schedule);
    }

    public List<Schedule> getDeviceSchedules(String deviceId) {
        return scheduleRepository.findByDeviceId(deviceId);
    }

    public List<Schedule> getActiveSchedules() {
        return scheduleRepository.findByIsActiveTrue();
    }

    @Transactional
    public void deleteSchedule(Long scheduleId) {
        scheduleRepository.deleteById(scheduleId);
    }

    @Transactional
    public void toggleSchedule(Long scheduleId, boolean active) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setActive(active);
        scheduleRepository.save(schedule);
    }

    public void executeSchedule(Schedule schedule) {
        ControlCommand command = new ControlCommand();
        command.setDeviceId(schedule.getDeviceId());
        command.setSystemOn(schedule.isSystemOn());
        command.setMode(schedule.getMode());
        command.setFanSpeed(schedule.getFanSpeed());
        command.setTemperatureSetpoint(schedule.getTemperatureSetpoint());

        deviceService.sendControlCommand(schedule.getDeviceId(), command);
    }
}
