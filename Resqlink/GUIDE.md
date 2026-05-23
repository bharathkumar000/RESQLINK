# ResQ Link Offline Mesh Network - Hackathon Guide

This directory contains a complete Flutter mobile application designed to showcase a store-and-forward ad-hoc peer-to-peer mesh network for emergency distress signals.

The application operates completely offline without Wi-Fi routers, cellular internet, or centralized servers. It leverages Google's **Nearby Connections API** (automatically switching between Bluetooth Low Energy and Wi-Fi Direct) to discover surrounding nodes and synchronize distress signals bidirectionally.

---

## 🛠️ Project Setup

### 1. Prerequisites
- **Flutter SDK**: Ensure Flutter is installed (`flutter doctor`).
- **Devices**: You need at least **two** (preferably **three**) physical Android devices for a real-time mesh demonstration (Nearby Connections requires physical hardware for Wi-Fi Direct/Bluetooth chipsets; emulators are not supported).

### 2. Installation
Navigate to this directory and install dependencies:
```bash
cd resqlink_mobile
flutter pub get
```

### 3. Permissions
The app is pre-configured with the required permissions in `android/app/src/main/AndroidManifest.xml`.
On startup, the app will request:
- **Location Services** (required by Android for scanning Wi-Fi/Bluetooth beacons)
- **Bluetooth & Bluetooth Admin** (for discovering/advertising)
- **Wi-Fi State & Change Wi-Fi State** (for high-speed peer-to-peer data transport)

---

## 📱 App Features & Role Selection

Rather than compiling three different apps, we built a **Role Switcher** directly in the App Bar. Install the same APK on all three devices and choose their roles:

1. **Victim (Phone A)**: Creates the initial SOS distress signal. Displays a live stepper showing the status progression (Created → Relay Pending → Relay Verified → Dispatch Active → ETA).
2. **Relay (Phone B)**: Act as a walking human mesh router (volunteer, emergency drone, or patrol vehicle). Reviews distress signals, with options to **ACCEPT**, **REJECT**, or **ESCALATE**.
3. **Command Center (Phone C)**: Receives verified requests from Relay nodes. Shows emergency statistics and provides controls to **DISPATCH** rescue units with a calculated ETA.

---

## 🔁 Sync & Conflict Resolution Protocol (How it works under the hood)

To prevent routing loops, duplication, or infinite cascading messages, the application implements a conflict-resolution model using timestamps:

- Every SOS object contains a `lastUpdated` ISO timestamp.
- When two devices establish a peer connection, they exchange their entire local SOS registry.
- **Deduplication**: If a device receives an SOS ID that it does not possess, it saves it.
- **Conflict Resolution**: If the device already has that SOS ID, it compares the incoming `lastUpdated` time with the local one. The entry with the newer timestamp overrides the older one.
- **Cascade**: If any local state is changed, the node immediately broadcasts its updated registry to all other active connections, causing updates to ripple through the network.

---

## 🎭 Hackathon Live Demo Script

Follow this step-by-step guide to run a live demonstration in front of judges:

### Preparation
1. Install the app on three Android phones (A, B, and C).
2. Open the app on each phone and set their roles:
   - **Phone A**: Set role to **Victim** (Device name: `Victim Node`)
   - **Phone B**: Set role to **Relay** (Device name: `Relay Node`)
   - **Phone C**: Set role to **Command** (Device name: `HQ Command`)
3. Turn **OFF** Cellular Data and Wi-Fi Internet on all three phones (go completely offline).
4. Turn **ON** the **Mesh Signal** toggle at the bottom of all three apps.

---

### Step 1: Create Distress Signal (Phone A)
- On **Phone A (Victim)**, enter:
  - Name: `Stranded Group`
  - Location: `Sector 4, Building B, Roof`
  - Need: `Medical Kit & Food`
  - Stranded: `4 People`
- Tap **SEND OFFLINE SOS SIGNAL**.
- *Status visible on Phone A:* `RELAY_PENDING` (First step in the progress indicator).

---

### Step 2: Hops to Relay (Phone A ➔ Phone B)
- Place **Phone A** near **Phone B**.
- They will automatically discover each other, handshake, and connect.
- Once connected, **Phone B** will receive the SOS alert.
- Tap **ACCEPT** on **Phone B**.
- *Status updated locally on Phone B:* Changes to `COMMAND_PENDING`.

---

### Step 3: Hops to Command (Phone B ➔ Phone C)
- Walk **Phone B** away from Phone A towards **Phone C** (simulating a volunteer walking/driving from a disaster zone back towards a command base).
- Once **Phone B** is near **Phone C**, they will connect.
- **Phone C** immediately receives the verified SOS request.
- On **Phone C**, tap **DISPATCH TEAM**.
- An input dialog will appear. Enter an ETA: `12 Mins` and tap dispatch.
- *Status updated locally on Phone C:* Changes to `DISPATCHED` (ETA: `12 Mins`).

---

### Step 4: Status Returns to Victim (Phone C ➔ Phone B ➔ Phone A)
- Walk **Phone B** back towards **Phone A**.
- Once in range, **Phone B** receives the updated status (`DISPATCHED`, ETA: `12 Mins`) from Phone C's sync history, and immediately forwards it to **Phone A**.
- **Phone A**'s screen automatically updates:
  - Stepper advances to **Rescue Sent**.
  - A green alert box appears showing: **"Rescue Team En Route! ETA: 12 Mins"**.
