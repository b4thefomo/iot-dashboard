<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFreeze Fleet Map</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/topojson-client@3"></script>

    <style>
        /* --- 1. LIGHT MODE THEME --- */
        :root {
            /* Foundation Colors */
            --bg-color: #f8f9fa;       /* Off-white background */
            --card-surface: #ffffff;   /* Pure white cards */
            --text-primary: #1e293b;   /* Deep Navy text */
            --text-secondary: #64748b; /* Slate Gray text */
            
            /* Map Specifics */
            --map-ocean: #dbeafe;        /* Pale Blue Water */
            --map-land: #ffffff;         /* White Land */
            --map-border: #94a3b8;       /* Slate Borders */
            --grid-line: rgba(0, 0, 0, 0.05); /* Faint technical grid */

            /* Asset Status Colors */
            --status-critical: #dc2626;  /* Professional Red */
            --status-warning: #d97706;   /* Amber */
            --status-healthy: #059669;   /* Emerald Green */
            
            /* Effects */
            --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg-color);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* --- 2. HEADER --- */
        header {
            padding: 1rem 2rem;
            background: var(--card-surface);
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow-soft);
            z-index: 10;
        }

        h1 { font-size: 1.2rem; font-weight: 600; letter-spacing: -0.5px; }
        
        .stats { display: flex; gap: 1.5rem; font-size: 0.9rem; }
        .stat-item { display: flex; align-items: center; gap: 0.5rem; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }

        /* --- 3. MAP CONTAINER (THE HYBRID RENDERER) --- */
        .map-wrapper {
            flex: 1;
            position: relative;
            overflow: hidden;
            background-color: var(--map-ocean);
            /* Technical Grid Pattern */
            background-image: 
                linear-gradient(var(--grid-line) 1px, transparent 1px),
                linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        /* The SVG Layer (Land & Borders) */
        svg {
            display: block;
            width: 100%;
            height: 100%;
            pointer-events: all; /* Allows panning/zooming */
        }

        .country {
            fill: var(--map-land);
            stroke: var(--map-border);
            stroke-width: 0.5px;
            transition: fill 0.2s;
        }
        .country:hover { fill: #f1f5f9; }

        /* The Overlay Layer (HTML Markers) */
        #map-overlays {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; /* Let clicks pass through to map */
        }

        /* --- 4. MARKERS & ANIMATIONS --- */
        .marker {
            position: absolute;
            width: 12px; 
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            transform: translate(-50%, -50%); /* Center on coordinate */
            cursor: pointer;
            pointer-events: auto; /* Re-enable clicks for markers */
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }

        .marker:hover {
            transform: translate(-50%, -50%) scale(1.5);
            z-index: 100;
        }

        /* Status Coloring */
        .marker.healthy { background: var(--status-healthy); }
        .marker.warning { background: var(--status-warning); }
        .marker.critical { background: var(--status-critical); z-index: 50; }

        /* Pulse Animation for Critical/Warning */
        .pulse-ring {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 100%; height: 100%;
            border-radius: 50%;
            border: 1px solid;
            opacity: 0;
            animation: ripple 2s infinite;
        }

        .marker.critical .pulse-ring { border-color: var(--status-critical); }
        .marker.warning .pulse-ring { border-color: var(--status-warning); }

        @keyframes ripple {
            0% { width: 100%; height: 100%; opacity: 0.8; }
            100% { width: 400%; height: 400%; opacity: 0; }
        }

        /* --- 5. TOOLTIPS --- */
        .marker-tooltip {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0.5rem 0.8rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            border: 1px solid #e2e8f0;
        }

        .marker:hover .marker-tooltip { opacity: 1; }

    </style>
</head>
<body>

    <header>
        <h1>Global Asset Monitor</h1>
        <div class="stats">
            <div class="stat-item"><div class="dot" style="background:var(--status-healthy)"></div> 98 Healthy</div>
            <div class="stat-item"><div class="dot" style="background:var(--status-warning)"></div> 1 Warning</div>
            <div class="stat-item"><div class="dot" style="background:var(--status-critical)"></div> 1 Critical</div>
        </div>
    </header>

    <div class="map-wrapper" id="map-container">
        <svg id="map-svg"></svg>
        <div id="map-overlays"></div>
    </div>

    <script>
        // --- CONFIGURATION ---
        // Sample "Fake Fleet" Data - Connect this to your Python script later
        const FLEET_DATA = [
            { id: "UNIT-001", lat: 51.5074, lon: -0.1278, status: "healthy", temp: -18.5, loc: "London, UK" },
            { id: "UNIT-002", lat: 40.7128, lon: -74.0060, status: "healthy", temp: -19.2, loc: "New York, USA" },
            { id: "UNIT-003", lat: 35.6762, lon: 139.6503, status: "warning", temp: -12.0, loc: "Tokyo, JP" }, // Door open?
            { id: "UNIT-004", lat: -33.8688, lon: 151.2093, status: "critical", temp: -5.0, loc: "Sydney, AU" }, // Broken!
            { id: "UNIT-005", lat: 52.5200, lon: 13.4050, status: "healthy", temp: -18.0, loc: "Berlin, DE" },
        ];

        // --- MAP SETUP ---
        const svg = d3.select("#map-svg");
        const container = document.getElementById("map-container");
        const overlays = document.getElementById("map-overlays");
        
        let width = container.clientWidth;
        let height = container.clientHeight;

        // 1. Define Projection (Mercator for standard flat map)
        // We center it slightly to avoid cutting off New Zealand
        const projection = d3.geoMercator()
            .scale(width / 6.5) 
            .translate([width / 2, height / 1.5]);

        const path = d3.geoPath().projection(projection);

        // Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8]) // Max zoom 8x
            .on("zoom", (event) => {
                // Transform SVG (Land)
                svg.selectAll("g").attr("transform", event.transform);
                // Transform HTML Markers (Keep size, move position)
                updateMarkers(event.transform);
            });

        svg.call(zoom);

        // --- RENDER MAP ---
        async function initMap() {
            // Load lightweight world data (TopoJSON)
            // Using a public CDN for the standard world-110m dataset
            const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
            
            const countries = topojson.feature(world, world.objects.countries);

            // Draw Countries
            const g = svg.append("g");
            g.selectAll("path")
                .data(countries.features)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", path);

            // Initial Render of Markers
            renderMarkers();
        }

        // --- RENDER MARKERS (HTML Divs) ---
        function renderMarkers() {
            overlays.innerHTML = ""; // Clear existing

            FLEET_DATA.forEach(unit => {
                // 1. Calculate X/Y from Lat/Lon
                const [x, y] = projection([unit.lon, unit.lat]);

                // 2. Create Marker Element
                const el = document.createElement("div");
                el.className = `marker ${unit.status}`;
                
                // Store original coordinates for zooming logic
                el.dataset.x = x;
                el.dataset.y = y;

                // Set initial position
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;

                // 3. Add Pulse Ring if needed
                if (unit.status !== "healthy") {
                    const ring = document.createElement("div");
                    ring.className = "pulse-ring";
                    el.appendChild(ring);
                }

                // 4. Add Tooltip
                const tooltip = document.createElement("div");
                tooltip.className = "marker-tooltip";
                tooltip.innerHTML = `${unit.id}<br>${unit.loc}<br>Temp: ${unit.temp}°C`;
                el.appendChild(tooltip);

                // 5. Click Event (Mocking drill-down)
                el.addEventListener("click", (e) => {
                    e.stopPropagation(); // Don't drag map
                    alert(`Opening details for ${unit.id}...\nTemperature: ${unit.temp}°C`);
                });

                overlays.appendChild(el);
            });
        }

        // --- ZOOM SYNC LOGIC ---
        // This keeps the HTML markers aligned with the SVG map during zoom
        function updateMarkers(transform) {
            const markers = document.querySelectorAll(".marker");
            markers.forEach(m => {
                const ox = parseFloat(m.dataset.x);
                const oy = parseFloat(m.dataset.y);
                
                // Apply the same transform math D3 uses
                const nx = transform.applyX(ox);
                const ny = transform.applyY(oy);

                m.style.left = `${nx}px`;
                m.style.top = `${ny}px`;
            });
        }

        // Handle Window Resize
        window.addEventListener("resize", () => {
            width = container.clientWidth;
            height = container.clientHeight;
            projection.scale(width / 6.5).translate([width / 2, height / 1.5]);
            svg.selectAll("path").attr("d", path);
            renderMarkers();
        });

        // Start
        initMap();

    </script>
</body>
</html>
