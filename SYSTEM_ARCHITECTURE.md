# <img src="./public/logo.png" width="40" height="40" align="absmiddle"> 📡 ResQLink — Complete System Architecture & Workflow Document

> **Last Updated**: May 2026 | **Version**: 4.1
> A unified, beautifully elaborated reference covering every module, technology, protocol, and data pipeline in the ResQLink disaster response platform.

---

## 🗺️ 1. Full-Stack Unified Architecture

```mermaid
flowchart LR
    classDef hw fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b
    classDef fw fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
    classDef mob fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c
    classDef db fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100
    classDef web fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238
    classDef ext fill:#fce4ec,stroke:#c62828,stroke-width:2px,color:#b71c1c

    subgraph HW ["TIER 1 — IoT Hardware Station (ESP32)"]
        direction TB
        subgraph Sensors ["Sensors Array"]
            DHT11["DHT11<br/>(Pin 14)"]:::hw
            MPU6050["MPU6050<br/>(I2C)"]:::hw
            WATER["Water Level<br/>(Pin 25)"]:::hw
            SOIL["Soil Moisture<br/>(Pin 26)"]:::hw
            RAIN["Rain Gauge<br/>(Pin 33)"]:::hw
        end
        ESP32["ESP32 DevKit V1"]:::fw
        ENGINE["Alert Rule Engine"]:::fw
        Sensors --> ESP32
        ESP32 --> ENGINE
    end

    subgraph MOBILE ["TIER 2 — Offline Mobile Mesh (Flutter App)"]
        direction TB
        LOGIN_M["Login Auth"]:::mob
        VICTIM["Victim SOS Panel"]:::mob
        RELAY["Mesh Relay"]:::mob
        COMMAND_M["Command UI"]:::mob
        HIVE[("Hive Local DB")]:::mob
        NEARBY["Google Nearby<br/>(Bluetooth/Wi-Fi)"]:::mob
        LOGIN_M --> VICTIM & RELAY & COMMAND_M
        VICTIM <--> HIVE
        RELAY <--> HIVE
        COMMAND_M <--> HIVE
        VICTIM & RELAY & COMMAND_M <--> NEARBY
    end

    subgraph CLOUD ["TIER 3 — Cloud & Persistence"]
        direction TB
        SUPA_DB[("Supabase DB")]:::db
        JSON_DB[("requests.json")]:::db
        TELE_API["Telegram Bot API"]:::db
    end

    subgraph WEB ["TIER 4 — Web Command Dashboard (Next.js)"]
        direction TB
        DASH["Admin Dashboard"]:::web
        MAP_W["Tactical Leaflet Map"]:::web
        AI_PANEL["AI Situation Panel"]:::web
        API_REQ["/api/requests"]:::web
        API_AI["/api/ai-summary"]:::web
        DASH --> MAP_W & AI_PANEL
        DASH <--> API_REQ
        AI_PANEL --> API_AI
    end

    subgraph EXT ["TIER 5 — External Services"]
        direction TB
        OLLAMA["Ollama (Gemma4)"]:::ext
        OWM["OpenWeatherMap"]:::ext
        OSRM["Project OSRM"]:::ext
        TELE_APP["Telegram App"]:::ext
    end

    %% Cross-Tier Connections (Structured to prevent clutter)
    ENGINE -->|Critical Alerts| TELE_API
    ENGINE -->|Telemetry| SUPA_DB
    
    HIVE -->|Sync Bridge| API_REQ
    
    SUPA_DB -->|Realtime Sub| DASH
    JSON_DB <--> API_REQ
    
    API_AI -->|Prompts| OLLAMA
    MAP_W -->|Routing| OSRM
    DASH -->|Weather| OWM
    
    TELE_API <--> TELE_APP
```

---

## 🛠️ 2. Complete Technology Stack

### Tier 1 — IoT Hardware (ESP32 Firmware)

| Component | Sensor / Module | Library | Data Output |
|:---|:---|:---|:---|
| MCU Board | ESP32 DevKit V1 | Arduino Core + WiFi.h | IP, MAC, RSSI |
| Temperature & Humidity | DHT11 (Pin 14) | `DHT.h` (Adafruit) | °C, % |
| Seismic / Vibration | MPU6050 (I2C) | `Adafruit_MPU6050.h` | 3-axis vector magnitude (m/s²) |
| Water Level | Analog (Pin 25) | `analogRead()` | 0–4095 ADC |
| Soil Moisture | Analog (Pin 26) | `analogRead()` | 0–4095 ADC |
| Rainfall Intensity | Rain Gauge (Pin 33) | `analogRead()` inverted | 0–4095 |
| Alert Messaging | Telegram Bot | `UniversalTelegramBot.h` | SOS push + /status commands |
| Database Sync | Supabase REST | `HTTPClient.h` + `ArduinoJson.h` | HTTPS POST JSON |
| Secure Transport | TLS/SSL | `WiFiClientSecure.h` | Encrypted HTTPS |

### Tier 2 — Offline Mobile App (Flutter)

| Component | Package | Purpose |
|:---|:---|:---|
| Framework | Flutter SDK 3.x | Cross-platform Android native build |
| P2P Mesh Network | `nearby_connections: 4.3.0` | Google Nearby Connections — Bluetooth + Wi-Fi Direct ad-hoc mesh |
| Offline Database | `hive: 2.2.3` + `hive_flutter: 1.1.0` | Local key-value NoSQL cache for SOS state persistence |
| GPS Location | `geolocator: 11.0.0` | Native GPS coordinate detection on victim devices |
| Mapping | `flutter_map: 6.1.0` + `latlong2: 0.9.0` | OpenStreetMap tile rendering with SOS markers |
| HTTP Client | `http: 1.2.0` | Sync Bridge — POST mesh data to web dashboard API |
| Unique IDs | `uuid: 4.3.3` | Generate unique SOS distress signal identifiers |

**Android Permissions** (AndroidManifest.xml):
- `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `CHANGE_WIFI_STATE`, `ACCESS_WIFI_STATE`, `NEARBY_WIFI_DEVICES`, `INTERNET`

### Tier 3 & 4 — Cloud, Web Command (Next.js) & Persistence

| Feature | Technology | Description |
|:---|:---|:---|
| Framework | Next.js 16.2.6 (Turbopack) | React 19.2, Server-Side Rendering, API Routes |
| Map Engine | Leaflet.js 1.9.4 | Interactive tactical map with markers, polylines, popups |
| Map Themes | OpenStreetMap + CARTO Dark | Normal mode + Tactical (dark) mode toggle |
| AI Assistant | Ollama (localhost:11434) | Local Gemma4 LLM situation report generation |
| Database | Supabase (PostgreSQL) | Realtime `sensor_logs` tracking hardware telemetry |
| Mesh Sync DB| `requests.json` | Local file DB deduplicating mobile mesh SyncBridge posts |
| ML Priority | Custom scoring matrix | Resource-type × severity × affected-count = priority class |
| Translations | React state TRANSLATIONS | Full UI bilingual toggle: English ↔ Kannada |
| SOS Panic | Browser Geolocation API | One-tap GPS + Telegram alert broadcast to emergency team |
| Dispatch | Interactive modal | Select volunteer → view all active requests → assign |

### Tier 5 — External Services

| Service | Endpoint | Usage |
|:---|:---|:---|
| Ollama (Local) | `http://localhost:11434/api/generate` | Gemma4 9.6GB local LLM — AI situation summaries |
| OpenWeatherMap | `api.openweathermap.org/data/2.5/weather` | Weather conditions by lat/lng + language param |
| Project OSRM | `router.project-osrm.org/route/v1/driving/` | Multi-point driving route with GeoJSON geometry |
| Telegram Bot | `api.telegram.org/bot{token}/sendMessage` | Emergency SOS alert push + interactive /status commands |

---

## 🔄 3. Detailed Workflow Diagrams

### 3.1. ESP32 Firmware Execution Loop

```mermaid
flowchart TD
    classDef start fill:#cfd8dc,stroke:#37474f,stroke-dasharray: 5 5
    classDef process fill:#e1f5fe,stroke:#0288d1
    classDef decision fill:#fff9c4,stroke:#fbc02d
    classDef output fill:#ffe0b2,stroke:#f57c00
    classDef alert fill:#ffcdd2,stroke:#c62828

    S(["Power On / Reset"]):::start --> INIT["Init Hardware:<br/>DHT11, MPU6050, Connect Wi-Fi"]:::process
    INIT --> LOOP{"Enter loop()"}:::decision

    LOOP --> SENSOR_READ["Read Sensors:<br/>Temp, Hum, Soil, Water, Rain, Seismic"]:::process

    SENSOR_READ --> DELTA{"Significant Change?"}:::decision

    DELTA -- "Yes" --> ACTIVE["Reset to 5s interval"]:::process
    ACTIVE --> DANGER{"Exceeds Emergency Thresholds?<br/>(Seismic>15, Rain>2500, Flood>2000)"}:::decision

    DANGER -- "Yes" --> TELE_SOS["🚨 Telegram SOS Alert"]:::alert
    DANGER -- "No" --> PUSH:::output
    TELE_SOS --> PUSH["HTTPS POST to Supabase"]:::output
    PUSH --> TELE_CHECK

    DELTA -- "No" --> IDLE_INC["Increment idle counter"]:::process
    IDLE_INC --> IDLE_CHECK{"Idle Counter Check"}:::decision
    IDLE_CHECK -- "3–5 cycles" --> T10["Throttle to 10s"]:::process
    IDLE_CHECK -- "6+ cycles" --> T30["Throttle to 30s (Idle Mode)"]:::process
    T10 & T30 --> TELE_CHECK
    IDLE_CHECK -- "<3 cycles" --> KEEP["Keep current interval"]:::process
    KEEP --> TELE_CHECK

    TELE_CHECK["Check Telegram inbox"]:::process
    TELE_CHECK --> MSG{"Command received?"}:::decision
    MSG -- "/status" --> STATUS_REPLY["Send formatted live readings"]:::output
    MSG -- "None" --> DELAY["delay(interval)"]:::process
    STATUS_REPLY --> DELAY
    DELAY --> LOOP
```

---

### 3.2. Offline Mesh Network Protocol (Mobile)

```mermaid
sequenceDiagram
    autonumber
    participant V as 📱 Victim (Bluetooth/Wi-Fi)
    participant R as 📱 Relay Volunteer
    participant C as 📱 Command HQ
    participant W as 🌐 Web Dashboard

    V->>V: Save SOS locally + startAdvertising()
    R->>V: P2P Connection established
    V->>R: Sync SOS payload (Status: RELAY_PENDING)
    R->>R: Tap ACCEPT → Status: COMMAND_PENDING
    R->>C: P2P Connect + Forward SOS
    C->>C: Tap DISPATCH → Status: DISPATCHED
    C->>R: Sync status back
    R->>V: Sync status back (Victim sees ETA)
    Note over C: When internet available:
    C->>W: Sync Bridge HTTP POST → /api/requests
```

---

### 3.3. Supabase Realtime Telemetry Pipeline (Hardware → Web)

```mermaid
sequenceDiagram
    autonumber
    participant E as 🔌 ESP32 Station
    participant S as 🗄️ Supabase PostgreSQL
    participant N as 🖥️ Next.js Dashboard
    participant A as 👤 Admin Dispatcher

    E->>S: HTTPS POST sensor_logs<br/>(temp, hum, soil, water, seismic, rain, status)
    S-->>N: Realtime WebSocket INSERT event
    N->>N: Update sensor UI + check thresholds
    N-->>A: Display visual warning badges
    A->>N: Click "Generate AI Report"
    N->>N: POST sensor snapshot to /api/ai-summary
    N->>N: Ollama gemma4 processes prompt
    N-->>A: Display Situation Summary
```

---

## 📊 4. Data Models

### ESP32 → Supabase Payload
```json
{
  "temperature": 24.5,
  "humidity": 62.0,
  "soil_moisture": 2100,
  "water_level": 120.0,
  "seismic": 0.05,
  "rain_level": 0,
  "status": "Updated"
}
```

### Alert Thresholds (ESP32 Rule Engine)
| Condition | Sensor | Threshold | Alert Status |
|:---|:---|:---|:---|
| Earthquake | MPU6050 | Seismic vector > 15 m/s² | `Earthquake Alert` |
| Heavy Rainfall | Rain Gauge | Rain > 2500 | `Heavy Rain Alert` |
| Flood | Water Level | Water level > 2000 | `Flood Alert` |
| Drought | DHT11 + Soil | Temp > 45°C AND Soil > 3800 | `Drought` |
