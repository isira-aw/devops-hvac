# Predictions & Analysis - Technical Documentation

This document explains how the **Predictions & Analysis** feature works in the HVAC Customer Portal, including the mathematical equations and calculations used.

## Overview

The Predictions & Analysis panel provides real-time insights about the HVAC system's performance, energy consumption, and maintenance needs. It operates independently of the historical data date range and always displays **current/live** data.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   PostgreSQL    │
│   (Next.js)     │     │  (Spring Boot)   │     │   Database      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │  GET /predictions     │  Query telemetry
        │◀──────────────────────│  Calculate metrics
        │                       │
```

## Data Flow

1. **Frontend** calls `GET /api/customer/devices/{deviceId}/predictions`
2. **Backend** fetches latest telemetry and 24-hour historical data
3. **PredictionService** calculates all metrics using mathematical equations
4. **Response** returned to frontend for display

## API Endpoint

```
GET /api/customer/devices/{deviceId}/predictions

Response:
{
  "deviceId": "string",
  "estimatedRuntime": number,      // hours
  "dailyEnergyPrediction": number, // kWh
  "monthlyEnergyPrediction": number, // kWh
  "efficiencyScore": number,       // 0-100%
  "maintenanceRecommendation": "string"
}
```

---

## Calculations & Equations

### 1. Efficiency Score (0-100%)

The efficiency score is calculated by starting at 100% and subtracting penalties based on various factors.

```
Efficiency Score = 100 - (Temperature Penalty + Filter Penalty + Airflow Penalty + Power Factor Penalty)
```

#### 1.1 Temperature Delta Penalty

Measures how well the system is transferring heat based on the difference between return and supply air temperatures.

```
Optimal Delta = 8°C (constant)
Actual Delta = |Return Air Temp - Supply Air Temp|

If Actual Delta < Optimal Delta:
    Penalty = (Optimal Delta - Actual Delta) × 5
Else:
    Penalty = 0
```

**Example:**
- Return Air: 24°C, Supply Air: 18°C
- Actual Delta = |24 - 18| = 6°C
- Penalty = (8 - 6) × 5 = 10 points

#### 1.2 Filter Condition Penalty

```
Filter Condition    | Penalty
--------------------|--------
CLEAN               | 0
DIRTY               | 15
CLOGGED             | 30
```

#### 1.3 Airflow Status Penalty

```
Airflow Status      | Penalty
--------------------|--------
NORMAL              | 0
RESTRICTED          | 20
```

#### 1.4 Power Factor Penalty

Power factor measures electrical efficiency (ratio of real power to apparent power).

```
Apparent Power = Voltage × Current (VA)
Power Factor = Real Power (W) / Apparent Power (VA)

If Power Factor < 0.85:
    Penalty = (0.85 - Power Factor) × 50
Else:
    Penalty = 0
```

**Example:**
- Voltage: 230V, Current: 10A, Real Power: 2000W
- Apparent Power = 230 × 10 = 2300 VA
- Power Factor = 2000 / 2300 = 0.87
- Penalty = 0 (since 0.87 > 0.85)

#### Complete Efficiency Calculation Example

```
Starting Score: 100

Temperature:
  - Supply: 16°C, Return: 22°C
  - Delta = 6°C (less than optimal 8°C)
  - Penalty = (8 - 6) × 5 = 10

Filter: DIRTY
  - Penalty = 15

Airflow: NORMAL
  - Penalty = 0

Power Factor: 0.82
  - Penalty = (0.85 - 0.82) × 50 = 1.5

Final Score = 100 - 10 - 15 - 0 - 1.5 = 73.5%
```

---

### 2. Estimated Runtime (Hours)

Calculates how long the system can continue running based on remaining capacity and current load.

```
Max Capacity = 100 kWh (constant)
Current Load = Power (W) / 1000  (convert to kW)
Remaining Capacity = Max Capacity - Current Energy Usage (kWh)

Estimated Runtime = Remaining Capacity / Current Load
```

**Example:**
- Current Power: 2000W (2kW)
- Current Energy Used: 45 kWh
- Remaining Capacity = 100 - 45 = 55 kWh
- Estimated Runtime = 55 / 2 = **27.5 hours**

---

### 3. Daily Energy Prediction (kWh)

Based on the average hourly energy consumption over the last 24 hours.

```sql
-- Database Query
SELECT AVG(energy_kwh) FROM telemetry
WHERE device_id = ?
AND timestamp > (NOW() - INTERVAL 24 HOUR)
```

```
Average Hourly Energy = Query Result
Daily Energy Prediction = Average Hourly Energy × 24
```

**Example:**
- Average hourly energy from last 24 hours: 1.5 kWh
- Daily Prediction = 1.5 × 24 = **36 kWh/day**

---

### 4. Monthly Energy Prediction (kWh)

Simple extrapolation from daily prediction.

```
Monthly Energy Prediction = Daily Energy Prediction × 30
```

**Example:**
- Daily Prediction: 36 kWh
- Monthly Prediction = 36 × 30 = **1,080 kWh/month**

---

### 5. Estimated Monthly Cost ($)

Frontend calculation based on monthly energy prediction.

```
Electricity Rate = $0.12/kWh (configurable)
Monthly Cost = Monthly Energy Prediction × Electricity Rate
```

**Example:**
- Monthly Energy: 1,080 kWh
- Monthly Cost = 1,080 × $0.12 = **$129.60**

---

### 6. Maintenance Recommendation

Generated based on the efficiency score and specific conditions.

```
Efficiency Score    | Recommendation
--------------------|------------------------------------------------
≥ 90%               | "System operating optimally. No maintenance required."
70% - 89%           | Check filter condition:
                    |   - If DIRTY: "Consider replacing air filter soon."
                    |   - Else: "System efficiency is good. Monitor for changes."
50% - 69%           | "Schedule maintenance check. Filter may need replacement."
< 50%               | "Urgent maintenance required. System efficiency is low."
```

---

## Frontend Implementation

### Auto-Refresh Mechanism

```typescript
// Refresh predictions every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    loadCurrentData();
  }, 30000);

  return () => clearInterval(interval);
}, [isAuthenticated, loadCurrentData]);
```

### Efficiency Label Mapping

```typescript
const getEfficiencyLabel = (score: number) => {
  if (score >= 90) return { label: 'Excellent', color: 'green' };
  if (score >= 70) return { label: 'Good', color: 'blue' };
  if (score >= 50) return { label: 'Fair', color: 'yellow' };
  return { label: 'Poor', color: 'red' };
};
```

---

## Backend Implementation

### PredictionService.java (Key Methods)

```java
public PredictionResponse getPredictions(String deviceId) {
    // Get latest telemetry
    TelemetryData latest = telemetryService.getLatestTelemetry(deviceId);

    // Calculate metrics
    double runtime = calculateRuntime(latest);
    double dailyEnergy = calculateDailyEnergy(deviceId);
    double efficiency = calculateEfficiencyScore(latest);
    String maintenance = generateRecommendation(latest, efficiency);

    return new PredictionResponse(
        deviceId, runtime, dailyEnergy,
        dailyEnergy * 30, efficiency, maintenance
    );
}

private double calculateEfficiencyScore(TelemetryData data) {
    double score = 100.0;

    // Temperature delta factor
    double delta = Math.abs(data.getReturnAirTemp() - data.getSupplyAirTemp());
    if (delta < OPTIMAL_DELTA) {
        score -= (OPTIMAL_DELTA - delta) * 5;
    }

    // Filter condition factor
    if ("DIRTY".equals(data.getFilterCondition())) score -= 15;
    if ("CLOGGED".equals(data.getFilterCondition())) score -= 30;

    // Airflow factor
    if ("RESTRICTED".equals(data.getAirflowStatus())) score -= 20;

    // Power factor
    double pf = data.getPowerWatts() / (data.getVoltage() * data.getCurrent());
    if (pf < 0.85) score -= (0.85 - pf) * 50;

    return Math.max(0, Math.min(100, score));
}
```

---

## Database Schema (Telemetry)

```sql
CREATE TABLE telemetry (
    id BIGINT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,

    -- Environmental
    supply_air_temp DOUBLE,
    return_air_temp DOUBLE,
    room_temp DOUBLE,
    humidity DOUBLE,
    outdoor_temp DOUBLE,

    -- Electrical
    line_voltage DOUBLE,
    current_amps DOUBLE,
    power_watts DOUBLE,
    energy_kwh DOUBLE,

    -- Mechanical
    compressor_on BOOLEAN,
    fan_speed VARCHAR(10),
    airflow_status VARCHAR(20),
    filter_condition VARCHAR(20),

    INDEX idx_device_timestamp (device_id, timestamp)
);
```

---

## Constants & Configuration

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_CAPACITY_KWH` | 100 | Maximum energy capacity for runtime calculation |
| `OPTIMAL_EFFICIENCY_DELTA` | 8°C | Optimal temperature difference |
| `ELECTRICITY_RATE` | $0.12/kWh | Default electricity rate |
| `REFRESH_INTERVAL` | 30 seconds | Auto-refresh interval |
| `GOOD_POWER_FACTOR` | 0.85 | Threshold for good power factor |

---

## Summary of Equations

| Metric | Formula |
|--------|---------|
| **Efficiency Score** | `100 - Σ(penalties)` |
| **Temp Penalty** | `(8 - actual_delta) × 5` if delta < 8 |
| **Power Factor Penalty** | `(0.85 - PF) × 50` if PF < 0.85 |
| **Runtime** | `(100 - energy_used) / (power_watts / 1000)` |
| **Daily Energy** | `AVG(24h energy) × 24` |
| **Monthly Energy** | `daily × 30` |
| **Monthly Cost** | `monthly_kwh × $0.12` |

---

## File Locations

| Component | Path |
|-----------|------|
| Frontend Page | `customer_portal/src/app/[deviceId]/history/page.tsx` |
| Backend Service | `backend/src/main/java/com/hvac/service/PredictionService.java` |
| API Controller | `backend/src/main/java/com/hvac/controller/CustomerController.java` |
| Response DTO | `backend/src/main/java/com/hvac/dto/PredictionResponse.java` |
| Telemetry Entity | `backend/src/main/java/com/hvac/entity/Telemetry.java` |
