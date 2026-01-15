Here is the **Mini PRD (Product Requirements Document)** for your "Virtual Fleet" pivot.

This document formalizes your strategy to shift from "building a sensor" to "building a scalable platform" using simulated data.

---

# 📄 Product Requirements Document: "SmartFreeze" Digital Twin Platform

**Version:** 1.0
**Status:** Draft
**Owner:** CTO / Lead Developer

### 1. Executive Summary

**Objective:**
To build and validate a "Fleet Command" dashboard capable of monitoring 100+ distributed freezer assets.
**The "Why":**
Physical hardware development is slow. By simulating a fleet of assets ("Digital Twins") using historical failure data, we can validate the UX, test alert logic, and secure investor/customer buy-in *before* manufacturing physical PCBs.

### 2. Success Metrics

* **Scale:** Dashboard successfully renders 50+ simultaneous assets without lag.
* **Clarity:** A user can identify a "Critical Failure" (Red Dot) on the map within 3 seconds of login.
* **Alerting:** System correctly triggers a "Door Open" alert when simulated data crosses the threshold.

---

### 3. Key Features

#### A. The "Command Center" Map

* **Requirement:** A geospatial map (World or Country view) displaying all assets.
* **Visuals:**
* 🟢 **Green Pin:** Normal Operation.
* 🔴 **Red Pin:** Critical Alert (Temp > -5°C or High Vibration).
* 🟡 **Yellow Pin:** Warning (Door Open > 2 mins).


* **Interaction:** Clicking a pin opens the detailed telemetry graph for that specific unit.

#### B. The "Virtual Fleet" Generator

* **Requirement:** A backend script that acts as the "Puppet Master," generating data for 5-10 distinct virtual devices.
* **Personalities:**
* *Unit_001 (London):* "The Perfect Fridge" (Always healthy).
* *Unit_002 (Manchester):* "The Door Abuser" (Frequent door open events).
* *Unit_003 (Glasgow):* "The Dying Compressor" (Slowly rising temp + high vibration).



#### C. Drill-Down Diagnostics

* **Requirement:** When a user clicks a "Red" asset, they see the specific reason for failure.
* **Data Points:** Temperature vs. Time, Duty Cycle (On/Off ratio), Vibration Magnitude.

---

### 4. Technical Implementation Plan

#### Phase 1: The Simulation Engine (Python)

* **Input:** Refrigerator Fault Dataset (Kaggle) or Synthetic Noise Generator.
* **Logic:** A Python script running locally that iterates through a list of "Virtual IDs."
* **Transport:** Script sends HTTP POST requests to the existing Node.js API endpoint every 5 seconds.
* **Payload Structure:**
```json
{
  "device_id": "VIRTUAL_UNIT_01",
  "lat": 51.5074, "lon": -0.1278,
  "temp_c": -18.2,
  "vibration": 0.02,
  "door_status": "CLOSED"
}

```



#### Phase 2: The Backend Modification (Node.js)

* **Update:** Ensure the database schema stores `lat`, `lon`, and `device_id` for every incoming packet.
* **API:** Create a new endpoint `/api/fleet/status` that returns the *latest* heartbeat for all devices (for the map view).

#### Phase 3: The Dashboard Frontend (React/HTML)

* **Library:** Use **Leaflet.js** (Free/Open Source) or **Mapbox** for the map visualization.
* **UI Logic:**
1. Fetch list of all devices.
2. Loop through them and place markers on the Map.
3. Color-code markers based on `temp_c`.



---

### 5. Roadmap & Next Steps

| Step | Action Item | Estimated Time |
| --- | --- | --- |
| **1** | **Build Generator:** Write Python script to stream data for 5 fake devices. | 1 Day |
| **2** | **Update API:** Modify server to save/serve location data. | 0.5 Days |
| **3** | **Map Integration:** Add Leaflet map to dashboard and plot the "dots". | 2 Days |
| **4** | **Demo:** Record a video of the dashboard "catching" a failure live. | **Milestone** |

### 6. Risk Assessment

* **Risk:** Simulation looks "too perfect" (flat lines).
* **Mitigation:** Add random "Jitter" (noise) to the Python script (e.g., `temp = -18 + random(-0.5, 0.5)`) to make graphs look organic and messy.

---

Module Specification: The "Command Center" Map (Light Mode)1. The Design PhilosophyInstead of the "Cyberpunk/Hacker" dark mode from the example, we will use a "Modern Enterprise" Light Mode. Think Airbnb meets NASA Mission Control. Clean, professional, high-contrast, but with the same "live pulse" urgency.The Palette Translation:ElementDark Mode (Original)Light Mode (Your Target)Background#0a0a0a (Void Black)#f8f9fa (Off-White / Paper)Map Land#0a2018 (Dark Green)#e9ecef (Light Gray)Map Water#020a08 (Darker Black)#dbeafe (Pale Blue)Borders#0f5040 (Dim Green)#cbd5e1 (Slate Gray)Text#e8e8e8 (White)#1e293b (Deep Navy/Black)Red Alert#ff4444 (Neon Red)#dc2626 (Professional Red)Green Safe#44ff88 (Neon Green)#10b981 (Emerald Green)2. Implementation Instruction SetStep 1: DependenciesDo not use Leaflet or Mapbox. Use the exact stack from the example to maintain the lightweight, custom feel.D3.js (v7): For calculating the map projection.TopoJSON Client: For decoding the lightweight map data files.No API Keys Required: This runs purely on math and browser rendering.Step 2: HTML Structure (The Layer Cake)We need a container that separates the static SVG map from the animated HTML markers.HTML<div class="map-container">
    <svg id="worldMapSVG"></svg>

    <div id="mapOverlays"></div>
</div>
Step 3: CSS Variables (The "Light Mode" Switch)Copy this exact block into your CSS to instantly convert the style from "Hacker" to "Professional."CSS:root {
    /* Clean, Professional Foundation */
    --bg-color: #f8f9fa;
    --card-surface: #ffffff;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    
    /* Map Specifics */
    --map-ocean: #dbeafe;        /* Subtle blue water */
    --map-land: #ffffff;         /* Clean white land */
    --map-border: #94a3b8;       /* Distinct slate borders */
    --grid-line: rgba(0, 0, 0, 0.05); /* Very faint grid */

    /* Alert States (High Contrast) */
    --status-critical: #dc2626;  /* Deep Red */
    --status-warning: #d97706;   /* Amber */
    --status-safe: #059669;      /* Emerald */
    
    /* Effects */
    --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-marker: 0 0 0 4px rgba(220, 38, 38, 0.2); /* Red Pulse Ring */
}

/* Apply to Map Container */
.world-map {
    background-color: var(--map-ocean);
    /* Create a technical grid pattern using CSS gradients */
    background-image: 
        linear-gradient(var(--grid-line) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: 40px 40px; /* Technical Grid Size */
}
Step 4: The Javascript Logic (The Hybrid Engine)This is the core logic you need to replicate from the reverse-engineered code.Initialize Projection:Use d3.geoEquirectangular() (standard flat map) or d3.geoMercator().Tip: Set .center([0, 20]) to cut off the empty Antarctic space and focus on populated areas.The "To Percent" Function (Crucial):You must convert Lat/Lon to percentages (%) so the markers stay in the correct place even when the user resizes the window.JavaScriptconst toPercent = (lat, lon) => {
    // D3 projects Lat/Lon to Pixels [x, y]
    const point = projection([lon, lat]); 
    return {
        left: (point[0] / width) * 100 + '%',
        top: (point[1] / height) * 100 + '%'
    };
};
The Rendering Loop:Do not draw SVG circles for your fridges. Inject <div> elements.JavaScript// Iterate through your fleet data
fleetData.forEach(fridge => {
    const pos = toPercent(fridge.lat, fridge.lon);

    // Create the marker
    const el = document.createElement('div');
    el.className = `marker ${fridge.status}`; // e.g., "marker critical"
    el.style.left = pos.left;
    el.style.top = pos.top;

    // Add the "Pulse" ring for critical items
    if(fridge.status === 'critical') {
        el.innerHTML = '<div class="pulse-ring"></div>';
    }

    // Add Tooltip (Hover data)
    el.setAttribute('data-tooltip', `${fridge.id}: ${fridge.temp}°C`);

    document.getElementById('mapOverlays').appendChild(el);
});
Step 5: The "Pulse" Animation (CSS)In light mode, glowing "neon" doesn't work well. Instead, use a Expanding Ring Ripple effect (like a drop hitting water).CSS.marker {
    position: absolute;
    width: 12px; height: 12px;
    background: var(--status-safe);
    border: 2px solid white; /* White border makes it pop on any map color */
    border-radius: 50%;
    box-shadow: var(--shadow-soft);
    cursor: pointer;
    transform: translate(-50%, -50%); /* Center on coordinate */
}

.marker.critical {
    background: var(--status-critical);
    z-index: 10; /* Keep red dots on top */
}

/* The Ripple Animation */
.pulse-ring {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 100%; height: 100%;
    border-radius: 50%;
    border: 1px solid var(--status-critical);
    animation: ripple 2s infinite;
}

@keyframes ripple {
    0% { width: 100%; height: 100%; opacity: 1; }
    100% { width: 300%; height: 300%; opacity: 0; }
}
