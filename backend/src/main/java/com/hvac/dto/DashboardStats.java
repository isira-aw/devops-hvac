package com.hvac.dto;

import lombok.Data;

@Data
public class DashboardStats {
    private long totalDevices;
    private long onlineDevices;
    private long licensedDevices;
    private long totalUsers;
    private long unresolvedFaults;
    private Double totalEnergyToday;
}
