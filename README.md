# Smart HVAC IoT-Enabled Units

A secure, production-ready MVP for monitoring and controlling HVAC units via IoT technology.

## Features

- **User Authentication**: JWT-based authentication with 2FA (email verification)
- **HVAC Monitoring**: Real-time telemetry data (temperature, humidity, power, etc.)
- **Remote Control**: System ON/OFF, cooling/heating modes, fan speed, temperature setpoint
- **Rule-Based Fault Detection**: Overcurrent, overvoltage, overheating, filter choke, sensor failure
- **Simple Predictions**: Runtime estimation, energy usage prediction, efficiency scoring
- **MQTT Communication**: Real-time device communication via external MQTT broker
- **Google OAuth 2.0**: Optional Google Sign-In support

## Tech Stack

- **Backend**: Spring Boot 3.2 (Java 17)
- **Frontend**: Next.js 14 (React 18, TypeScript)
- **Database**: PostgreSQL
- **MQTT Broker**: External (provided)
- **Authentication**: JWT + 2FA
- **Charts**: Recharts
- **Icons**: LineIcons

## Project Structure

```
├── backend/                 # Spring Boot backend
│   ├── src/main/java/com/hvac/
│   │   ├── config/         # Configuration classes
│   │   ├── controller/     # REST controllers
│   │   ├── dto/            # Data transfer objects
│   │   ├── entity/         # JPA entities
│   │   ├── mqtt/           # MQTT service
│   │   ├── repository/     # JPA repositories
│   │   ├── scheduler/      # Scheduled tasks
│   │   ├── security/       # Security configuration
│   │   └── service/        # Business logic
│   └── src/main/resources/
│       └── application.properties
├── customer_portal/        # Customer Next.js app
│   └── src/
│       ├── app/           # App router pages
│       └── lib/           # Utilities and API
├── admin_panel/           # Admin Next.js app
│   └── src/
│       ├── app/           # App router pages
│       └── lib/           # Utilities and API
├── esp32/                 # ESP32 firmware
│   └── hvac_controller.ino
└── README.md
```

## Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

## Quick Start

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE hvac_db;
```

### 2. Backend Setup

```bash
cd backend

# Configure environment variables (or use defaults)
export DB_USERNAME=postgres
export DB_PASSWORD=postgres

# Build and run
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`.

### 3. Customer Portal Setup

```bash
cd customer_portal

# Install dependencies
npm install

# Run development server
npm run dev
```

The customer portal will be available at `http://localhost:3000`.

### 4. Admin Panel Setup

```bash
cd admin_panel

# Install dependencies
npm install

# Run development server
npm run dev
```

The admin panel will be available at `http://localhost:3001`.

## Default Credentials

### Admin Account
- **Email**: isira.aw@gmail.com
- **Password**: 000000

Note: 2FA verification code will be logged in the console if email is not configured.

## Environment Variables

### Backend (`application.properties`)

```properties
# Database
DB_USERNAME=postgres
DB_PASSWORD=postgres

# MQTT (pre-configured)
MOSQUITTO_HOST=trolley.proxy.rlwy.net
MOSQUITTO_PORT=26703
MOSQUITTO_USERNAME=hvac-monitoring-system
MOSQUITTO_PASSWORD=di1u5ydet0z049vbbl08cofp6vhya45l

# JWT
JWT_SECRET=your-secret-key

# Email (for 2FA)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## MQTT Topics

| Topic Pattern | Direction | Description |
|--------------|-----------|-------------|
| `hvac/{device_id}/telemetry` | Device → Backend | Sensor data |
| `hvac/{device_id}/control` | Backend → Device | Control commands |
| `hvac/{device_id}/status` | Device → Backend | Device status/heartbeat |

### Telemetry Payload Example

```json
{
  "supplyAirTemp": 14.5,
  "returnAirTemp": 22.3,
  "roomTemp": 24.1,
  "humidity": 55.0,
  "outdoorTemp": 32.0,
  "lineVoltage": 220.5,
  "currentAmps": 8.2,
  "powerWatts": 1808.1,
  "energyKwh": 15.5,
  "compressorOn": true,
  "fanSpeed": "MED",
  "airflowStatus": "NORMAL",
  "filterCondition": "CLEAN"
}
```

### Control Command Payload Example

```json
{
  "systemOn": true,
  "mode": "COOLING",
  "fanSpeed": "HIGH",
  "temperatureSetpoint": 22.0
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new customer |
| POST | `/api/auth/login` | Initiate login (sends 2FA code) |
| POST | `/api/auth/verify` | Verify 2FA code and get token |
| POST | `/api/auth/google` | Google OAuth login |

### Customer APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/devices` | Get assigned devices |
| POST | `/api/customer/devices/assign` | Assign device to account |
| DELETE | `/api/customer/devices/{id}/unassign` | Unassign device |
| GET | `/api/customer/devices/{id}/status` | Get device status |
| GET | `/api/customer/devices/{id}/telemetry` | Get telemetry history |
| POST | `/api/customer/devices/{id}/control` | Send control command |
| GET | `/api/customer/devices/{id}/predictions` | Get predictions |
| GET | `/api/customer/devices/{id}/faults` | Get fault logs |

### Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard stats |
| GET | `/api/admin/devices` | List all devices (paginated) |
| POST | `/api/admin/devices` | Register new device |
| PUT | `/api/admin/devices/{id}` | Update device |
| DELETE | `/api/admin/devices/{id}` | Delete device |
| PATCH | `/api/admin/devices/{id}/license` | Update license status |
| GET | `/api/admin/admins` | List admins |
| POST | `/api/admin/admins` | Create admin |
| DELETE | `/api/admin/admins/{id}` | Delete admin |

## ESP32 Setup

1. Install Arduino IDE with ESP32 board support
2. Install required libraries:
   - WiFi (built-in)
   - PubSubClient
   - ArduinoJson
3. Open `esp32/hvac_controller.ino`
4. Update WiFi credentials and Device ID
5. Upload to ESP32

### Hardware Connections

| Function | GPIO Pin |
|----------|----------|
| Supply Temp Sensor | GPIO34 |
| Return Temp Sensor | GPIO35 |
| Room Temp Sensor | GPIO32 |
| Humidity Sensor | GPIO33 |
| Voltage Sensor | GPIO25 |
| Current Sensor | GPIO26 |
| Compressor Relay | GPIO16 |
| Fan Low Relay | GPIO17 |
| Fan Med Relay | GPIO18 |
| Fan High Relay | GPIO19 |
| Cooling Relay | GPIO21 |
| Heating Relay | GPIO22 |
| Status LED | GPIO2 |

## Fault Detection Rules

| Fault Type | Condition |
|------------|-----------|
| Overcurrent | Current > 20A |
| Low Voltage | Voltage < 200V |
| High Voltage | Voltage > 250V |
| Overheating | Supply temp > 40°C |
| Filter Choke | Filter condition = CLOGGED |
| Sensor Failure | Invalid/null readings |
| Device Offline | No heartbeat for 5 minutes |

## Data Retention

- Telemetry data is automatically deleted after **7 days**
- Fault logs are retained indefinitely
- Verification codes expire after **10 minutes**

## Security

- JWT tokens expire after **6 hours**
- All APIs (except auth) require valid JWT
- Admin APIs require ADMIN role
- Device access validated per user
- CORS configured for frontend origins

## Color Theme

- Primary: `#094166`
- Background: `#FCF6F5`
- Text: White/Black

## License

MIT License


-------------Create the Tunnel---------------------

# Syntax: ssh -L [LocalPort]:[RemoteHost]:[RemotePort] [User]@[ServerIP]
ssh -L 5433:127.0.0.1:5432 root@64.227.144.94

Keep this terminal window open. It acts as the bridge.
If you encounter an "address already in use" error, change 5433 to 5434 or another free port.
Step 2: Connect via PgAdmin4
Now configure PgAdmin4 on your PC with these settings:

Host name/address: localhost (Yes, really! The tunnel makes it look local)
Port: 5433 (maps to server's 5432)
Maintenance database: hvac_db
Username: postgres
Password: 123456789 (from your .gitlab-ci.yml)

# PostgreSQL Database
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5433/hvac_db}

---------------------------------------------------