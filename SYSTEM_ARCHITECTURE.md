# ResQLink: System Architecture & Workflow Guide

ResQLink is an offline-first disaster response and coordination network. It bridges the gap between stranded victims, field rescuers, and central emergency command bases using a three-tier architecture: IoT hardware sensor nodes, an offline-ready mobile mesh client, and an AI-driven web command dashboard.

---

## 🗺️ 1. High-Level System Architecture

The diagram below outlines the interactions between the **Hardware Tier** (telemetry monitoring), the **Edge Mobile Mesh Network** (offline victim/rescuer sync), and the **Central Command Tier** (Next.js Dashboard + Supabase).

```mermaid
graph TD
    %% Tier Styling
    classDef hardware fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef mobile fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef cloud fill:#efe8ff,stroke:#6200ea,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    %% Hardware Tier
    subgraph Hardware ["IoT Telemetry Node (ESP32)"]
        ESP32[ESP32 Microcontroller]:::hardware
        Sensors[Sensor Array: Seismic, Rain, Water Level, Temperature, AQI]:::hardware
        ESP32 -->|1. Reads Data| Sensors
    end

    %% Mobile Mesh Tier
    subgraph Mobile ["Edge P2P Mobile Mesh (Flutter Client)"]
        VictimPhone[Victim Device - RELAY_PENDING]:::mobile
        RelayPhone[Relay/Volunteer Device - COMMAND_PENDING]:::mobile
        CommandPhone[Mobile Command Node - DISPATCHED]:::mobile
        
        VictimPhone <-->|2a. Google Nearby Connections Bluetooth/Wi-Fi Mesh| RelayPhone
        RelayPhone <-->|2b. Local State Handshake & Sync| CommandPhone
    end

    %% Central Command Tier
    subgraph Cloud ["Central Command Base (Next.js Web / Cloud)"]
        Supabase[(Supabase DB: Requests, Resources, Telemetry)]:::cloud
        NextJS[Next.js Dashboard Application]:::cloud
        API_Route[API Routes: /api/requests, /api/ai-summary, /api/config]:::cloud
    end

    %% External Services
    subgraph External ["External Services"]
        Gemini[Gemini AI LLM API]:::external
        OpenWeather[OpenWeatherMap API]:::external
        OSRM[OSRM Routing Server]:::external
    end

    %% Inter-tier connections
    ESP32 -->|3. REST HTTP Post| Supabase
    CommandPhone -->|4. Syncs SOS Alerts| Supabase
    NextJS <-->|5. Real-time REST/WS State| Supabase
    NextJS -->|6. Localized Coordinates| OpenWeather
    NextJS -->|7. Multi-Point Coordinates| OSRM
    NextJS -->|8. Situation Telemetry Vectors| Gemini
    API_Route <--> NextJS
```

---

## 🛰️ 2. Tier Breakdown & Components

### A. Telemetry Hardware Layer (ESP32)
Deployed at critical topographical regions (rivers, slopes, landslide zones).
* **Controller**: ESP32 Microcontroller with built-in Wi-Fi/Bluetooth stack.
* **Peripherals & Sensors**:
  * **Rainfall Gauge & Water Level Sensor**: Detects flash flooding.
  * **Seismic Sensor**: Detects landslides and structural failures.
  * **DHT22 & Gas Sensor**: Monitors heatwaves, humidity, and wildfire gas concentrations.
* **Intake Logic**: Collects sensor readings, builds a JSON packet, injects auth tokens, and performs an HTTP POST request to the Supabase REST endpoint.

### B. Mobile Mesh Layer (Flutter App)
An offline-first ad-hoc communication client designed for regions with complete grid collapse.
* **Google Nearby Connections**: Handles peer discovery, connection handshakes, and packet transfers via peer-to-peer Bluetooth and Wi-Fi Direct interfaces.
* **Hive Local DB**: Lightweight, high-performance Key-Value storage that retains local SOS reports and status tables when offline.
* **Device Roles**:
  1. **Victim**: Submits panic requests (what supplies are needed, affected headcount, GPS position).
  2. **Relay**: Volunteers who physically travel. They act as "data mules," gathering SOS logs from victims and transferring them to command.
  3. **Command**: Localized command posts that coordinate rescues.

### C. Web Dashboard Layer (Next.js)
The brain of the rescue operations.
* **Leaflet Maps & OSRM**: Visualizes incident sites, live sensor locations, and overlays routing lines for rescuers.
* **Machine Learning & Forecasting**: Predicts resource burn rates and exhaustion thresholds (alerting dispatchers when critical items like medical kits or boats are nearing zero).
* **AI Summary Generator**: Aggregates all sensor data and requests, translating them into compiled emergency summaries.
* **Dynamic Translation Engine**: Translates all titles, forecasts, and AI summaries on the fly into Kannada (`kn`) and English (`en`).

---

## 🔄 3. Core Operational Workflows

### 3.1. Telemetry Pipeline & Forecasting Workflow
Monitors environmental vitals and predicts resource runtimes.

```mermaid
sequenceDiagram
    autonumber
    actor ESP32 as IoT ESP32 Sensor Node
    participant DB as Supabase DB
    participant Web as Next.js Dashboard
    actor Dispatcher as Dispatcher (Admin)

    ESP32->>DB: Send environmental telemetry (seismic, water levels, rainfall)
    DB-->>Web: Live push notification/telemetry update
    Web->>Web: Map updates sensor icon color based on warnings (e.g. Red warning if Water Level > Threshold)
    Web->>Web: Re-calculate resource burn rate based on active requests
    Note over Web: Burn Rate = (active requests * 0.8) + 1.2 units/hr
    Web->>Web: Re-calculate Available Quantity Left
    Web-->>Dispatcher: Display available quantities in raw units (e.g. 350 units)
    Web->>Web: Set risk badge: CRITICAL (if hours left < 12) or HIGH (if hours left < 24)
```

---

### 3.2. Offline Mobile Mesh Sync Protocol
Propagates SOS requests and resolution feedback between stranded victims and central HQ.

```mermaid
sequenceDiagram
    autonumber
    actor Victim as Stranded Victim (Device A)
    actor Relay as Volunteer Relay (Device B)
    actor HQ as Mobile Command Node (Device C)
    participant Cloud as Supabase DB (HQ Cloud)

    Note over Victim: Local SOS Created<br/>Status: RELAY_PENDING
    Victim->>Relay: [Offline P2P Sync] Send SOS payload
    Note over Relay: Relay inspects request<br/>Taps ACCEPT<br/>Status: COMMAND_PENDING
    Relay->>HQ: [Offline P2P Sync] Push accepted SOS payload
    Note over HQ: HQ assigns rescue team<br/>Taps DISPATCH (Enter ETA)<br/>Status: DISPATCHED
    HQ->>Cloud: [Online REST Push] Upload alerts database
    HQ->>Relay: [Offline P2P Sync] Push DISPATCHED status + ETA back
    Relay->>Victim: [Offline P2P Sync] Sync updated status back
    Note over Victim: App Stepper advances to "Rescue Sent"<br/>Displays dispatch ETA
```

---

### 3.3. Incident Allocation & Volunteer Dispatch
Enables dispatchers to assign on-duty volunteers to specific active incidents.

```mermaid
sequenceDiagram
    autonumber
    actor Disp as Dispatcher (Admin)
    participant UI as Web Dashboard UI
    participant DB as Supabase DB
    actor Vol as Field Volunteer

    Disp->>UI: Clicks "Dispatch" next to an Available Volunteer
    UI->>UI: Opens "Select Incident Request for Dispatch" Modal
    UI->>Disp: Displays What (resources needed) & Where (coordinates/address)
    Disp->>UI: Reviews incidents and clicks "Dispatch" on a specific request
    UI->>DB: Update Volunteer status to "BUSY"
    UI->>UI: Close Modal & trigger Success Toast
    Note over Vol: Rescuer receives specific incident route and directions
```

---

### 3.4. Multi-Language AI Summarization Workflow
Translates real-time telemetry into compiled situational logs.

```mermaid
sequenceDiagram
    autonumber
    actor Disp as Dispatcher (Admin)
    participant UI as Web Dashboard UI
    participant Server as Next.js API (/api/ai-summary)
    participant Gemini as Gemini AI Service

    Disp->>UI: Taps "Generate Situation Report" (Language: Kannada/English)
    UI->>Server: POST telemetry snapshot + requests list + target lang (kn / en)
    Server->>Gemini: Prompt LLM to analyze disaster vectors and respond in target language
    Gemini-->>Server: Return generated JSON report
    Server-->>UI: Return situation report string
    UI-->>Disp: Displays translated status summary in AI panel
```
