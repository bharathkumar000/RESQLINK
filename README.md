# 📡 ResQLink: Hybrid LoRa-Based Disaster Monitoring, Communication & Emergency Power System

> **IEEE Region 10 Humanitarian Technology Activities (HTA) Makers DIY Project Competition Entry**
> **WINNERS PES HACKATHON**
> 
> ResQLink is a low-cost, open-source, and fully off-grid disaster resilience ecosystem covering disaster monitoring, emergency communication, tactical rescue dispatching, and localized power recovery.

---

## 🏗️ Unified System Architecture

```text
                           ☁️ Cloud Dashboard
                     (Next.js + Supabase + Maps)
                                    ▲
                                    │ Internet (When Available)
                                    │
                         ┌───────────────────────┐
                         │  Command & Control HQ │
                         └───────────────────────┘
                                    ▲
                                    │
                            LoRa Gateway Station
                                    ▲
 ══════════════════════════════════════════════════════════════

           LONG RANGE LoRa MESH NETWORK (5–10 km)

  Sensor Node ◄────► Relay Node ◄────► Rescue Hub ◄────► Gateway
       ▲                  ▲                 ▲
       │                  │                 │
       │                  │                 │
  Flood Sensors      Landslide        Portable Emergency
  Fire Sensors         Sensors          Communication Hub

       ▲                                   ▲
       │                                   │
       └──────────── Bluetooth / Wi-Fi ─────┘
                       ▲              ▲
                       │              │
                Victim Phone     Volunteer Phone
```

---

## ⚡ The 4 Pillars of ResQLink

ResQLink addresses the entire disaster lifecycle through four operational modules:

### 1. 🌊 Disaster Monitoring & Early Warning (Before)
*   **Flood Alarm Nodes:** Deployed near rivers and dams. Combines ESP32, ultrasonic water depth sensors, rain gauges, and solar-charged batteries.
*   **Landslide Alert Nodes:** Deployed on vulnerable hillsides. Leverages **MPU6050 accelerometers** for ground shift vibration and soil moisture probes to detect liquid saturation.
*   **Edge Threat Engine:** Evaluates data on-node. Critical threats trigger instant, high-priority LoRa broadcasts.

### 2. 📡 Hybrid Offline Communication Mesh (During)
*   **BLE Discovery:** The mobile app uses Bluetooth Low Energy (BLE) to discover nearby victim devices and local LoRa nodes without cellular networks.
*   **Wi-Fi Direct Transfer:** High-bandwidth file transfer (e.g., medical forms, offline map imagery, coordinates) between smartphones and local ESP32 stations.
*   **LoRa Mesh Backhaul:** ESP32 nodes relay compressed emergency data (GPS, health status, battery levels) node-to-node across several kilometers to Command HQ.

### 3. 🔋 Portable Emergency Power Hubs (After & Recovery)
*   **Ruggedized Power Hub:** A portable, solar-powered field station designed for deployment in grid-down zones.
*   **Features:** Includes 50W Solar Panel, battery charge controller, 20Ah–50Ah Li-Po cells, USB-C ports for victim device charging, emergency lights, and an integrated ESP32 gateway node.

### 💻 4. Tactical Command & Rescue Dashboard
*   **Edge Dashboard:** Can run in offline-mode on a Raspberry Pi local server or online on a Next.js + Supabase platform.
*   **Features:** Live map visualization of flood levels, landslide sensors, active rescue teams, and victim locations. Features priority-weighted rescue routing and bidirectional status updates.

---

## 📂 Repository Structure

*   [src/](file:///Users/bharathkumara/Desktop/RESQLINK-main/src) — Web Command Dashboard (Next.js & Leaflet Maps)
*   [Resqlink/](file:///Users/bharathkumara/Desktop/RESQLINK-main/Resqlink) — Flutter Offline Mobile Mesh Application
*   [hardware/](file:///Users/bharathkumara/Desktop/RESQLINK-main/hardware) — ESP32 firmware (`espcode.c++`), circuit diagrams, and system layouts
*   [IEEE_SUBMISSION_GUIDE.md](file:///Users/bharathkumara/Desktop/RESQLINK-main/IEEE_SUBMISSION_GUIDE.md) — Step-by-step IEEE Region 10 competition template & Bill of Materials
*   [TECHNOLOGY_INNOVATIONS.md](file:///Users/bharathkumara/Desktop/RESQLINK-main/TECHNOLOGY_INNOVATIONS.md) — Implementation guides for LoRa mesh, deep sleep, and edge command servers

---

## 🏆 IEEE Competition Theme Alignment

| Challenge Requirement | ResQLink Implementation | Status |
| :--- | :--- | :--- |
| **🌊 Flood Detection Alarms** | Ultrasonic depth monitoring + precipitation analysis + LoRa alert routing | **Implemented** |
| **⛰️ Landslide Monitoring Networks** | MPU6050 seismic acceleration + soil saturation telemetry | **Implemented** |
| **📡 Long-Range Emergency Mesh** | Hybrid BLE (discovery) + Wi-Fi Direct (local transfer) + LoRa Mesh (backhaul) | **Implemented** |
| **🔋 Portable Power Hubs** | Solar harvesting, multi-channel USB charging, and integrated gateway | **Designed / Proposed** |

---

## Getting Started (Web Dashboard)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
