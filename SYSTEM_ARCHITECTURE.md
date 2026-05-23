# 📡 ResQLink — Complete System Architecture & Workflow Document

> **Last Updated**: May 2026 | **Version**: 4.0  
> A unified reference covering every module, technology, protocol, and data pipeline in the ResQLink disaster response platform.

---

## 🗺️ 1. Full-Stack Unified Architecture

```mermaid
graph TD
    classDef hw fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    classDef fw fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef mob fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef db fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef web fill:#eceff1,stroke:#455a64,stroke-width:2px
    classDef ext fill:#fce4ec,stroke:#c62828,stroke-width:2px

    subgraph HW ["TIER 1 — IoT Hardware Station (ESP32)"]
        DHT11["DHT11<br/>Temperature & Humidity"]:::hw
        MPU6050["MPU6050 Accelerometer<br/>Seismic Tremor Detection"]:::hw
        BMP280["BMP280 Barometer<br/>Pressure & Altitude"]:::hw
        GPS["NEO-6M GPS Module<br/>Live Lat/Lng Coordinates"]:::hw
        WATER["Water Level Sensor<br/>(Analog Pin 34)"]:::hw
        SOIL["Soil Moisture Sensor<br/>(Analog Pin 35)"]:::hw
        MQ2["MQ-2 Gas/Smoke Sensor<br/>(Analog Pin 32)"]:::hw
        RAIN["Rain Gauge Sensor<br/>(Analog Pin 33)"]:::hw
        WIND_S["Anemometer<br/>Wind Speed (Analog Pin 36)"]:::hw
        WIND_D["Wind Vane<br/>Direction (Analog Pin 39)"]:::hw
        ESP32["ESP32 DevKit V1<br/>Main MCU Board"]:::fw
        THROTTLE["Adaptive Energy Throttle<br/>5s / 10s / 30s polling"]:::fw
        ALERT_ENGINE["Alert Rule Engine<br/>Threshold Evaluator"]:::fw
    end

    subgraph MOBILE ["TIER 2 — Offline Mobile Mesh (Flutter App)"]
        LOGIN_M["Login Screen<br/>User / Admin Auth<br/>(Hive localStorage)"]:::mob
        VICTIM["Victim Screen<br/>SOS Generator + GPS Detect<br/>(geolocator plugin)"]:::mob
        RELAY["Relay Screen<br/>Accept / Reject / Escalate"]:::mob
        COMMAND_M["Command Screen<br/>Dispatch + ETA assignment"]:::mob
        MAP_M["Tactical Mesh Map<br/>(flutter_map + OpenStreetMap)"]:::mob
        HIVE["Hive Local DB<br/>Offline SOS State Cache"]:::mob
        NEARBY["Google Nearby Connections<br/>Bluetooth + Wi-Fi Direct P2P"]:::mob
        SYNC_BRIDGE["Sync Bridge Service<br/>HTTP POST to Web Dashboard"]:::mob
    end

    subgraph CLOUD ["TIER 3 — Cloud & Persistence"]
        SUPA_DB[("Supabase PostgreSQL<br/>sensor_logs table")]:::db
        SUPA_API["Supabase REST API<br/>+ Realtime WebSocket Channel"]:::db
        JSON_DB[("Local JSON File<br/>src/data/requests.json")]:::db
        TELE_API["Telegram Bot API<br/>Server"]:::db
    end

    subgraph WEB ["TIER 4 — Web Command Dashboard (Next.js 16)"]
        LOGIN_W["Login / Register UI<br/>(localStorage session)"]:::web
        DASH["Admin Dashboard<br/>Glassmorphism UI + CSS Grid"]:::web
        MAP_W["Leaflet.js Interactive Map<br/>+ Tactical Dark Mode Toggle"]:::web
        FORECAST["Inventory Forecasting Engine<br/>Burn Rate + Risk Status"]:::web
        ML_SCORE["ML Priority Scoring<br/>Resource-Severity Matrix"]:::web
        AI_PANEL["AI Situation Report Panel<br/>(Ollama + Gemma4 Local LLM)"]:::web
        LOCALE["Bilingual Engine<br/>Kannada / English Dynamic Toggle"]:::web
        SOS_BTN["SOS Panic Button<br/>GPS + Telegram Instant Alert"]:::web
        DISPATCH_MODAL["Volunteer Dispatch Modal<br/>Select Request -> Assign"]:::web
        API_REQ["API: /api/requests<br/>GET + POST (Sync Bridge)"]:::web
        API_AI["API: /api/ai-summary<br/>POST (Ollama proxy)"]:::web
        API_CFG["API: /api/config<br/>GET (Supabase keys)"]:::web
    end

    subgraph EXT ["TIER 5 — External Services"]
        OLLAMA["Ollama Local Server<br/>gemma4:latest (9.6 GB)"]:::ext
        OWM["OpenWeatherMap API<br/>Weather by Coordinates"]:::ext
        OSRM["Project OSRM<br/>Driving Route GeoJSON"]:::ext
        TELE_APP["Telegram Messenger App<br/>End-User SOS Alerts"]:::ext
    end

    %% Hardware Internal
    DHT11 & MPU6050 & BMP280 & GPS & WATER & SOIL & MQ2 & RAIN & WIND_S & WIND_D -->|I2C / Analog / Serial| ESP32
    ESP32 --> THROTTLE --> ALERT_ENGINE

    %% Hardware -> Cloud
    ESP32 -->|HTTPS POST JSON payload| SUPA_API
    ALERT_ENGINE -->|Critical SOS Message| TELE_API

    %% Telegram loop
    TELE_API <-->|Message Routing| TELE_APP
    TELE_APP -->|/status /start /help| ESP32

    %% Mobile Internal
    LOGIN_M --> VICTIM & RELAY & COMMAND_M & MAP_M
    VICTIM & RELAY & COMMAND_M <--> HIVE
    VICTIM & RELAY & COMMAND_M <-->|P2P Data Sync| NEARBY
    VICTIM -->|Geolocator GPS Detect| GPS

    %% Mobile -> Cloud
    SYNC_BRIDGE -->|HTTP POST SOS payloads| API_REQ
    HIVE --> SYNC_BRIDGE

    %% Cloud Internal
    SUPA_DB <--> SUPA_API

    %% Web Internal
    LOGIN_W --> DASH
    DASH --> MAP_W & FORECAST & ML_SCORE & AI_PANEL & LOCALE & SOS_BTN & DISPATCH_MODAL

    %% Web -> Cloud
    DASH <-->|Realtime subscribe sensor_logs| SUPA_API
    API_REQ <--> JSON_DB

    %% Web -> External
    AI_PANEL --> API_AI -->|POST prompt| OLLAMA
    MAP_W -->|Route request| OSRM
    DASH -->|Weather by lat/lng + lang| OWM
    SOS_BTN -->|Telegram sendMessage| TELE_API
```

---

## 🛠️ 2. Complete Technology Stack

### Tier 1 — IoT Hardware (ESP32 Firmware)

| Component | Sensor / Module | Library | Data Output |
|:---|:---|:---|:---|
| MCU Board | ESP32 DevKit V1 | Arduino Core + WiFi.h | IP, MAC, RSSI |
| Temperature & Humidity | DHT11 (Pin 14) | `DHT.h` (Adafruit) | °C, % |
| Seismic / Vibration | MPU6050 (I2C) | `Adafruit_MPU6050.h` | 3-axis vector magnitude (m/s²) |
| Barometric Pressure | BMP280 (I2C, 0x76) | `Adafruit_BMP280.h` | hPa, meters altitude |
| GPS Tracking | NEO-6M (Serial2, 9600 baud) | `TinyGPS++.h` | Latitude, Longitude |
| Water Level | Analog (Pin 34) | `analogRead()` | 0–4095 ADC |
| Soil Moisture | Analog (Pin 35) | `analogRead()` | 0–4095 ADC |
| Gas / Smoke Detection | MQ-2 (Pin 32) | `analogRead()` | 0–4095 ppm equivalent |
| Rainfall Intensity | Rain Gauge (Pin 33) | `analogRead()` inverted | 0–4095 |
| Wind Speed | Anemometer (Pin 36) | `analogRead()` → 0–120 km/h | km/h |
| Wind Direction | Wind Vane (Pin 39) | `analogRead()` → 0–360° | Degrees |
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
| Date Formatting | `intl: 0.19.0` | Timestamp localization |
| Permissions | `permission_handler: 11.3.1` | Runtime Bluetooth, Wi-Fi, Location permission grants |
| Code Generation | `hive_generator` + `build_runner` | Hive type adapter code gen |

**Android Permissions** (AndroidManifest.xml):
- `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `CHANGE_WIFI_STATE`, `ACCESS_WIFI_STATE`, `NEARBY_WIFI_DEVICES`
- `INTERNET`

**Mobile Screens**:
| Screen | File | Role |
|:---|:---|:---|
| Login | `login_screen.dart` | User / Admin local authentication with Hive |
| Victim | `victim_screen.dart` | SOS form + GPS detect + safety checklist + stepper UI |
| Relay | `relay_screen.dart` | Accept / Reject / Escalate mesh SOS alerts |
| Command | `command_screen.dart` | Dispatch rescue teams + set ETA |
| Map | `map_screen.dart` | OpenStreetMap tactical view of all mesh SOS markers |

**Mobile Services**:
| Service | File | Role |
|:---|:---|:---|
| Storage | `storage_service.dart` | Hive CRUD for SOS, login state, server URL config |
| Wi-Fi Mesh | `wifi_service.dart` | Nearby Connections advertising/discovery + P2P sync |
| Sync Bridge | `sync_bridge_service.dart` | HTTP bridge — pushes offline SOS to Next.js `/api/requests` |

### Tier 3 — Cloud & Persistence

| Service | Technology | Data Stored |
|:---|:---|:---|
| Supabase PostgreSQL | `@supabase/supabase-js 2.106` | `sensor_logs` table (ESP32 telemetry + GPS coordinates) |
| Supabase Realtime | WebSocket channel subscription | Live `INSERT` events pushed to web dashboard |
| Local JSON DB | `src/data/requests.json` (file I/O) | SOS requests synced from mobile mesh + web form submissions |
| Telegram Bot API | HTTPS REST | SOS alert push to first responders + interactive commands |

### Tier 4 — Web Command Dashboard (Next.js)

| Feature | Technology | Description |
|:---|:---|:---|
| Framework | Next.js 16.2.6 (Turbopack) | React 19.2, Server-Side Rendering, API Routes |
| Map Engine | Leaflet.js 1.9.4 | Interactive tactical map with markers, polylines, popups |
| Map Themes | OpenStreetMap + CARTO Dark | Normal mode + Tactical (dark) mode toggle with neon route glow |
| Route Calculation | Project OSRM | Driving distance + duration via GeoJSON polyline overlay |
| Weather | OpenWeatherMap API | Live weather by GPS coordinates, localized descriptions (kn/en) |
| AI Assistant | Ollama (localhost:11434) + gemma4:latest | Local LLM situation report generation — no cloud dependency |
| ML Priority | Custom scoring matrix | Resource-type × severity × affected-count = priority class + score |
| Forecasting | Resource burn-rate model | units/hr consumption → risk status (CRITICAL / HIGH / LOW) |
| Auth | localStorage session | Admin/User credentials with login + register forms |
| Translations | React state TRANSLATIONS map | Full UI bilingual toggle: English ↔ Kannada |
| SOS Panic | Browser Geolocation API | One-tap GPS + Telegram alert broadcast to emergency team |
| Dispatch | Interactive modal | Select volunteer → view all active requests → assign to specific incident |
| Styling | Custom CSS (glassmorphism) | Premium responsive design with micro-animations |

**Next.js API Routes**:
| Route | Method | Purpose |
|:---|:---|:---|
| `/api/requests` | GET | Returns all SOS requests from `requests.json` |
| `/api/requests` | POST | Accepts single or batch SOS payloads (mobile sync bridge) |
| `/api/ai-summary` | POST | Proxies prompt to local Ollama server, returns AI report |
| `/api/config` | GET | Returns Supabase URL + anon key from env vars |

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

    S(["Power On / Reset"]):::start --> INIT["Init Hardware:<br/>DHT11, MPU6050, BMP280, GPS Serial2<br/>Connect Wi-Fi, Assign IP"]:::process
    INIT --> LOOP{"Enter loop()"}:::decision

    LOOP --> GPS_READ["Parse NEO-6M GPS Sentences"]:::process
    GPS_READ --> SENSOR_READ["Read All Sensors:<br/>Temp, Hum, Soil, Water, Gas,<br/>Rain, Seismic Vector, Pressure,<br/>Altitude, Wind Speed, Wind Dir"]:::process

    SENSOR_READ --> DELTA{"Change > Tolerance?<br/>(Temp ±0.5°C, Pressure ±2hPa,<br/>Seismic ±0.5m/s², Wind ±5km/h)"}:::decision

    DELTA -- "Yes" --> ACTIVE["Reset to 5s interval<br/>Clear idle counter"]:::process
    ACTIVE --> DANGER{"Exceeds Emergency?<br/>(Gas>1500, Seismic>15,<br/>Rain>2500, Flood>2000,<br/>Wind>60, Pressure<990)"}:::decision

    DANGER -- "Yes" --> TELE_SOS["🚨 Telegram SOS Alert<br/>with GPS coordinates"]:::alert
    DANGER -- "No" --> PUSH:::output
    TELE_SOS --> PUSH["HTTPS POST to Supabase<br/>(13 sensor fields + status)"]:::output
    PUSH --> TELE_CHECK

    DELTA -- "No" --> IDLE_INC["Increment idle counter"]:::process
    IDLE_INC --> IDLE_CHECK{"Counter value?"}:::decision
    IDLE_CHECK -- "3–5 cycles" --> T10["Throttle to 10s"]:::process
    IDLE_CHECK -- "6+ cycles" --> T30["Throttle to 30s (Idle Mode)"]:::process
    IDLE_CHECK -- "<3 cycles" --> KEEP["Keep current interval"]:::process
    T10 & T30 & KEEP --> TELE_CHECK

    TELE_CHECK["Check Telegram inbox<br/>(every 1 second)"]:::process
    TELE_CHECK --> MSG{"Command received?"}:::decision
    MSG -- "/status" --> STATUS_REPLY["Send formatted<br/>live sensor reading"]:::output
    MSG -- "/start" --> WELCOME["Send welcome banner"]:::output
    MSG -- "/help" --> HELP["Send command list"]:::output
    MSG -- "None" --> DELAY["delay(interval)"]:::process
    STATUS_REPLY & WELCOME & HELP --> DELAY
    DELAY --> LOOP
```

---

### 3.2. Offline Mesh Network Protocol (Mobile ↔ Mobile ↔ Mobile)

```mermaid
sequenceDiagram
    autonumber
    participant V as 📱 Victim Phone<br/>(Bluetooth + Wi-Fi Direct)
    participant R as 📱 Relay Volunteer<br/>(Bluetooth + Wi-Fi Direct)
    participant C as 📱 Command HQ Phone<br/>(Bluetooth + Wi-Fi Direct)
    participant H as 🗄️ Hive Local DB
    participant W as 🌐 Web Dashboard<br/>(via Sync Bridge HTTP)

    Note over V: User opens app → Login Screen<br/>Authenticates locally (Hive)<br/>Role: Victim

    V->>H: Save SOS to local Hive DB<br/>(id, name, need, people, GPS,<br/>safetyChecklist, status: RELAY_PENDING)
    V->>V: Nearby Connections: startAdvertising()

    Note over R: Relay phone in range<br/>Nearby Connections: startDiscovery()
    R->>V: P2P Connection established<br/>(Bluetooth / Wi-Fi Direct)
    V->>R: Sync SOS payload bytes
    R->>H: Store in Relay's Hive DB<br/>(conflict check: compare lastUpdated)

    Note over R: Volunteer reviews SOS<br/>Taps ACCEPT
    R->>H: Update status → COMMAND_PENDING

    R->>C: P2P Connection with Command phone
    R->>C: Forward accepted SOS payload
    C->>H: Store in Command's Hive DB

    Note over C: HQ Admin reviews<br/>Taps DISPATCH TEAM<br/>Enters ETA: 15 mins
    C->>H: Update status → DISPATCHED, eta: 15 mins

    C->>R: Sync DISPATCHED status back
    R->>V: Sync DISPATCHED + ETA back

    Note over V: Stepper UI advances to<br/>"Rescue Sent" ✅<br/>ETA box shows: 15 mins

    Note over C: When internet available:
    C->>W: Sync Bridge HTTP POST<br/>all unsynced SOS → /api/requests
    W->>W: Merge into requests.json<br/>(deduplicate by requestId)
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

    E->>S: HTTPS POST sensor_logs<br/>(temp, hum, soil, water, seismic,<br/>air_quality, rain, pressure,<br/>altitude, wind_speed, wind_dir,<br/>latitude, longitude, status)
    S-->>N: Realtime WebSocket INSERT event
    N->>N: Update sensor cards live<br/>(temperature, humidity, seismic, etc.)
    N->>N: Pin ESP32 GPS on Leaflet map
    N->>N: Check status field for alerts<br/>(Earthquake Alert, Flood Alert, etc.)
    N-->>A: Display warning badges + updated map
    A->>N: Click "Generate AI Report"
    N->>N: POST sensor snapshot to /api/ai-summary
    N->>N: Ollama gemma4 processes prompt
    N-->>A: Display AI situation summary<br/>(in Kannada or English)
```

---

### 3.4. Web Dashboard — Volunteer Dispatch Workflow

```mermaid
sequenceDiagram
    autonumber
    participant A as 👤 Admin Dispatcher
    participant D as 🖥️ Dashboard UI
    participant O as 🗺️ OSRM Route Server
    participant DB as 🗄️ Local State

    A->>D: Click "Route" on incident card
    D->>O: GET driving route<br/>(base coords → incident coords)
    O-->>D: Return GeoJSON polyline
    D->>D: Overlay route on Leaflet map<br/>(blue line or neon green in tactical mode)

    A->>D: Click "Dispatch" on volunteer row
    D->>D: Open dispatch modal<br/>Show all active requests with:<br/>• What: resource type + description<br/>• Where: address + lat/lng
    A->>D: Select specific incident request
    D->>DB: Set volunteer status → BUSY
    D->>D: Close modal + success toast
```

---

### 3.5. Mobile → Web Sync Bridge Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant M as 📱 Mobile App<br/>(Command Screen)
    participant B as ⚡ SyncBridgeService
    participant API as 🌐 /api/requests
    participant JSON as 📄 requests.json

    M->>B: Trigger cloud sync
    B->>B: Check server online<br/>(GET /api/requests, 3s timeout)
    B->>B: Query Hive for unsynced SOS<br/>(where synced == false)
    B->>B: Map SOS fields to dashboard format<br/>(requestId, resourceType, lat, lng,<br/>severity, status, contactPerson)
    B->>API: HTTP POST batch payload
    API->>JSON: Deduplicate by requestId<br/>Insert new / update existing
    API-->>B: 200 OK + sync count
    B->>B: Mark all as synced in Hive
    Note over M: Dashboard now shows<br/>mesh SOS alerts on map
```

---

### 3.6. SOS Panic Button Flow (Web Dashboard)

```mermaid
sequenceDiagram
    autonumber
    participant A as 👤 User / Admin
    participant D as 🖥️ Dashboard
    participant GEO as 📍 Browser GPS
    participant T as 📨 Telegram Bot API

    A->>D: Click SOS Panic Button
    D->>D: Confirm dialog: "CONFIRM SOS PANIC TRIGGER?"
    A->>D: Confirms
    D->>GEO: navigator.geolocation.getCurrentPosition()
    GEO-->>D: Return lat, lng
    D->>D: Create CRITICAL SOS request<br/>(priority: 150, severity: 5)
    D->>T: POST sendMessage<br/>with Google Maps link to coordinates
    T-->>T: Deliver to emergency chat
    D-->>A: Toast: "SOS EMERGENCY BROADCAST SUCCESSFUL"
```

---

## 📊 4. Data Models

### ESP32 → Supabase Payload (13 fields)
```json
{
  "temperature": 24.5,
  "humidity": 62.0,
  "soil_moisture": 2100,
  "water_level": 120.0,
  "seismic": 0.05,
  "air_quality": 180,
  "rain_level": 0,
  "baro_pressure": 1011.5,
  "altitude": 770.0,
  "wind_speed": 12.5,
  "wind_direction": 190,
  "latitude": 12.3168,
  "longitude": 76.6135,
  "status": "Updated"
}
```

### Mobile SOS Model (Hive)
```json
{
  "id": "SOS-A1B2C3D4",
  "name": "Victim Name",
  "need": "Medical Supplies",
  "people": 5,
  "location": "Lat: 12.51180, Lng: 76.88510",
  "status": "RELAY_PENDING",
  "relayDecision": "PENDING",
  "commandDecision": "PENDING",
  "eta": "",
  "safetyChecklist": ["Medical Aid", "Drinking Water"],
  "synced": false,
  "timestamp": "2026-05-23T07:00:00Z",
  "lastUpdated": "2026-05-23T07:00:00Z"
}
```

### Alert Thresholds (ESP32 Rule Engine)
| Condition | Threshold | Alert Status |
|:---|:---|:---|
| Gas / Smoke | MQ-2 > 1500 ppm | `Smoke/Gas Alert` |
| Earthquake | Seismic vector > 15 m/s² | `Earthquake Alert` |
| Heavy Rainfall | Rain > 2500 | `Heavy Rain Alert` |
| Flood | Water level > 2000 | `Flood Alert` |
| Storm / Cyclone | Wind speed > 60 km/h | `Storm Alert (High Winds)` |
| Barometric Drop | Pressure < 990 hPa | `Barometric Storm Warning` |
| Drought | Temp > 45°C AND Soil > 3800 | `Drought` |
