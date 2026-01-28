# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flux IoT is an IoT cold chain monitoring platform. It consists of:
1. **Backend Server** (`server.js`) - Node.js/Express server that receives sensor data from ESP32 devices
2. **Dashboard** (`/dashboard`) - Next.js web application for fleet monitoring and management

## Commands

- **Start server:** `npm start` (runs on port 4000, binds to 0.0.0.0)
- **Start dashboard:** `cd dashboard && npm run dev` (runs on port 3000)
- **Install dependencies:** `npm install` (root) and `cd dashboard && npm install`

## Architecture

### Backend Server (`server.js`)

Express server with Socket.IO for real-time communication:

**REST Endpoints:**
- `POST /api/data` - Receives JSON sensor data from ESP32 devices
- `GET /api/fleet/status` - Returns all device statuses, alerts, and summary stats
- `GET /api/freezer/:device_id/history` - Historical readings for a device
- `POST /api/freezer/chat` - AI assistant for fleet analysis (Gemini-powered)
- `GET /api/fleet/export/csv` - Export fleet data as CSV
- `GET /api/fleet/export/pdf` - Generate PDF fleet report
- `GET /api/fleet/summary` - Aggregated fleet statistics
- `GET /api/fleet/:device_id/monthly` - Monthly metrics for compliance reports
- `POST /api/fleet/reports/pdf` - Generate compliance PDF report
- `POST /api/fleet/reports/infographic` - Generate visual infographic report

**WebSocket Events:**
- `initialFleetData` - Sent on connection with current fleet state
- `fleetUpdate` - Emitted when any device data changes
- `freezerData` - Individual freezer reading received

### Dashboard (`/dashboard`)

Next.js 14 application with App Router, Tailwind CSS, and shadcn/ui components.

---

## Freezer Dashboard (`/freezer`)

The main fleet monitoring interface at `/freezer` provides real-time visibility into all cold chain assets.

### Page Structure

```
/freezer                    # Main dashboard - FreezerDashboard
/freezer/reports           # Compliance reports - FleetReportsPage
/freezer/docs              # API documentation - DocsPage
```

### Main Dashboard Components

**Layout:**
- `FreezerSidebar` - Left navigation with links to dashboard, reports, docs, and settings
- `FleetHeader` - Top header with title, connection status, alert count, and search trigger
- `CommandPalette` - Keyboard-accessible command palette (Cmd+K) for quick device search

**Main Content Area (Left Column):**
1. **Stats Row** - Six stat cards showing:
   - Total Units (device count)
   - Healthy (devices with no issues)
   - Warning (door open or high frost)
   - Critical (faults or high temperature)
   - Avg Temp (fleet average cabinet temperature)
   - Avg Power (fleet average compressor power)

2. **Fleet Map** (`FleetMap`) - Mapbox GL map displaying:
   - Device markers with color-coded status (green/yellow/red)
   - Click to select device and open detail modal
   - Zoom and fullscreen controls

3. **Fleet Status Table** (`FleetStatusTable`) - Sortable table with:
   - Device ID, location, temperature, power, door status, frost level
   - Status badges (Healthy/Warning/Critical)
   - Click row to open detail modal

**Right Column:**
1. **Alert Panel** (`AlertPanel`) - Active alerts grouped by type:
   - High temperature alerts
   - Door open alerts
   - Fault alerts
   - High frost alerts

2. **AI Chat** (`FreezerChat`) - Chat interface for fleet analysis:
   - Natural language queries about fleet status
   - Powered by Gemini API via `/api/freezer/chat`

**Modal:**
- `FreezerDetailModal` - Detailed device view with:
  - Current readings (temperature, power, COP, frost level)
  - Historical temperature chart
  - Device metadata (location, coordinates)
  - Fault status and alerts

### Data Flow

```
ESP32 Devices
     │
     ▼ POST /api/data
┌─────────────┐
│  server.js  │ ◄─── Stores in memory, triggers alerts
└─────────────┘
     │
     ▼ Socket.IO (fleetUpdate, freezerData)
┌─────────────┐
│ useFleetData│ ◄─── React hook manages state
└─────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Dashboard Components               │
│  - FleetMap                         │
│  - FleetStatusTable                 │
│  - AlertPanel                       │
│  - StatCards                        │
└─────────────────────────────────────┘
```

### Key Hook: `useFleetData`

Located at `dashboard/src/hooks/use-fleet-data.ts`, this hook:

1. **Connects to Socket.IO** via `getSocket()` from `lib/socket.ts`
2. **Listens for events:**
   - `initialFleetData` - Populates initial device state
   - `freezerData` - Updates individual device readings
   - `fleetUpdate` - Batch updates all devices
3. **Manages state:**
   - `devices` - Record of all devices keyed by device_id
   - `alerts` - Array of devices with active alerts
   - `isConnected` - Socket connection status
   - `isOnline` - Whether data received within 30 seconds
4. **Provides computed values:**
   - `deviceList` - Array of all devices
   - `healthyCount`, `warningCount`, `criticalCount`
5. **Exposes helpers:**
   - `selectDevice(id)` - Select a device for detail view
   - `getDeviceStatus(device)` - Returns "healthy" | "warning" | "critical"
   - `hasAlert(device)` - Boolean if device has any alert condition

### Device Status Logic

```typescript
// Critical: fault or high temperature
if (device.fault !== "NORMAL" || device.temp_cabinet > -5) return "critical";

// Warning: door open or high frost
if (device.door_open || device.frost_level > 0.5) return "warning";

// Healthy: all normal
return "healthy";
```

### FreezerReading Interface

```typescript
interface FreezerReading {
  device_id: string;        // e.g., "SUBZ_001"
  lat: number;              // GPS latitude
  lon: number;              // GPS longitude
  location_name: string;    // Human-readable location
  temp_cabinet: number;     // Cabinet temperature (°C)
  temp_ambient: number;     // Ambient temperature (°C)
  door_open: boolean;       // Door sensor status
  defrost_on: boolean;      // Defrost cycle active
  compressor_power_w: number; // Power consumption (watts)
  compressor_freq_hz: number; // Compressor frequency
  frost_level: number;      // Frost buildup (0-1)
  cop: number;              // Coefficient of Performance
  fault: string;            // Fault code or "NORMAL"
  fault_id: number;         // Numeric fault identifier
  timestamp: string;        // ISO timestamp
}
```

### Reports Page (`/freezer/reports`)

Generates audit-ready compliance reports:

1. **Report Generator:**
   - Select device (or "All Assets")
   - Select month/year
   - Choose format: PDF, CSV, or both (ZIP)
   - Generate infographic (single device only)

2. **Key Metrics Preview:**
   - MKT (Mean Kinetic Temperature) with pass/marginal/fail status
   - Efficiency score with interpretation
   - Door open events count
   - Fault events count

3. **Report History:**
   - List of previously generated reports
   - Shows compliance status (Pass/Warn/Fail)
   - Download previous reports

### API Docs Page (`/freezer/docs`)

Interactive API documentation with:
- Endpoint descriptions and parameters
- Response examples with syntax highlighting
- Copy-to-clipboard functionality
- WebSocket connection examples

## Environment Variables

```env
# Server
GEMINI_API_KEY=xxx           # For AI chat functionality
MAPBOX_ACCESS_TOKEN=xxx      # For fleet map

# Dashboard
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_MAPBOX_TOKEN=xxx
```

## Key Files

```
/server.js                              # Main backend server
/dashboard/src/app/freezer/page.tsx     # Main dashboard page
/dashboard/src/hooks/use-fleet-data.ts  # Real-time data hook
/dashboard/src/lib/socket.ts            # Socket.IO client
/dashboard/src/components/
  ├── fleet-map.tsx                     # Mapbox fleet map
  ├── fleet-status-table.tsx            # Device table
  ├── alert-panel.tsx                   # Active alerts
  ├── freezer-chat.tsx                  # AI chat assistant
  ├── freezer-detail-modal.tsx          # Device detail modal
  ├── freezer-sidebar.tsx               # Navigation sidebar
  └── fleet-header.tsx                  # Page header
```
