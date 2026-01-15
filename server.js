require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure multer for firmware uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 4000;
const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ["http://localhost:4001", "http://localhost:3000"];

const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGINS,
        methods: ["GET", "POST"]
    }
});
const MAX_HISTORY = 100;

// In-memory storage
const sensorHistory = [];      // Weather station data
const carHistory = [];         // Car telemetry data
const masterHistory = [];      // Combined timeline for unified chat

// Subzero Fleet storage
const freezerHistory = {};     // { device_id: [readings] } - Per-device telemetry
const fleetStatus = {};        // { device_id: latestReading } - Latest per device
let lastFleetDataReceived = null;

// Firmware storage for OTA updates
const firmwareStore = {
    // device_type: { version, buffer, uploadedAt, size }
};

let lastSensorDataReceived = null;
let lastCarDataReceived = null;

// Initialize Gemini
const GEMINI_KEY = process.env.GEMINI_API_KEY;
console.log("🔑 GEMINI_API_KEY:", GEMINI_KEY ? `Found (${GEMINI_KEY.slice(0, 8)}...${GEMINI_KEY.slice(-4)})` : "❌ NOT FOUND");

let genAI = null;
let model = null;

if (GEMINI_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    console.log("✅ Gemini model initialized: gemini-3-flash-preview");
} else {
    console.log("⚠️ Gemini not initialized - API key missing");
}

// Middleware
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

// Helper to add timestamp
function addTimestamp(data) {
    return {
        ...data,
        server_timestamp: new Date().toISOString()
    };
}

// Helper to add to master history
function addToMasterHistory(data, type) {
    masterHistory.push({
        ...data,
        _type: type,
        _received: new Date().toISOString()
    });
    if (masterHistory.length > MAX_HISTORY * 2) {
        masterHistory.shift();
    }
}

// ==================== UNIFIED DATA ENDPOINT ====================

app.post('/api/data', (req, res) => {
    const data = addTimestamp(req.body);
    const sensorType = data.sensor_type;

    console.log("-----------------------------------------");

    if (sensorType === 'car_telemetry') {
        console.log("🏎️ CAR TELEMETRY:", data);

        // Normalize to match existing car dashboard format
        const normalizedCar = {
            sensor_id: data.device_id || 'CAR_OBD_01',
            speed_kmh: data.speed_kmh,
            rpm: data.rpm,
            throttle_pos_pct: data.throttle_pos,
            coolant_temp_c: data.coolant_temp_c || 90, // Default if not provided
            timestamp: data.server_timestamp,
            raw_timestamp: data.timestamp
        };

        carHistory.push(normalizedCar);
        if (carHistory.length > MAX_HISTORY) carHistory.shift();

        lastCarDataReceived = new Date();
        io.emit('carData', normalizedCar);
        addToMasterHistory(normalizedCar, 'car');

    } else if (sensorType === 'weather_station') {
        console.log("🌦️ WEATHER STATION:", data);

        // Normalize to match existing sensor dashboard format
        const normalizedWeather = {
            sensor_id: data.device_id || 'METEO_UNIT_01',
            temperature: data.temp_c,
            pressure: data.pressure_hpa,
            timestamp: data.server_timestamp,
            raw_timestamp: data.timestamp
        };

        sensorHistory.push(normalizedWeather);
        if (sensorHistory.length > MAX_HISTORY) sensorHistory.shift();

        lastSensorDataReceived = new Date();
        io.emit('sensorData', normalizedWeather);
        addToMasterHistory(normalizedWeather, 'weather');

    } else if (sensorType === 'freezer') {
        console.log("🧊 FREEZER:", data.device_id, data.temp_cabinet + "°C", data.fault);

        // Normalize freezer data
        const normalizedFreezer = {
            device_id: data.device_id,
            lat: data.lat,
            lon: data.lon,
            location_name: data.location_name,
            temp_cabinet: data.temp_cabinet,
            temp_ambient: data.temp_ambient,
            door_open: data.door_open,
            defrost_on: data.defrost_on,
            compressor_power_w: data.compressor_power_w,
            compressor_freq_hz: data.compressor_freq_hz,
            frost_level: data.frost_level,
            cop: data.cop,
            fault: data.fault,
            fault_id: data.fault_id,
            timestamp: data.server_timestamp,
            raw_timestamp: data.timestamp
        };

        // Initialize device history if new
        if (!freezerHistory[data.device_id]) {
            freezerHistory[data.device_id] = [];
            console.log(`🆕 New freezer registered: ${data.device_id} (${data.location_name})`);
        }

        // Store reading in device history
        freezerHistory[data.device_id].push(normalizedFreezer);
        if (freezerHistory[data.device_id].length > MAX_HISTORY) {
            freezerHistory[data.device_id].shift();
        }

        // Update fleet status (latest per device)
        fleetStatus[data.device_id] = normalizedFreezer;
        lastFleetDataReceived = new Date();

        // Emit socket events
        io.emit('freezerData', normalizedFreezer);
        io.emit('fleetUpdate', fleetStatus);
        addToMasterHistory(normalizedFreezer, 'freezer');

    } else {
        // Legacy support: route based on fields present
        if (data.speed_kmh !== undefined || data.rpm !== undefined) {
            console.log("🏎️ CAR DATA (legacy):", data);
            carHistory.push(data);
            if (carHistory.length > MAX_HISTORY) carHistory.shift();
            lastCarDataReceived = new Date();
            io.emit('carData', data);
            addToMasterHistory(data, 'car');
        } else if (data.temperature !== undefined || data.pressure !== undefined) {
            console.log("🌦️ SENSOR DATA (legacy):", data);
            sensorHistory.push(data);
            if (sensorHistory.length > MAX_HISTORY) sensorHistory.shift();
            lastSensorDataReceived = new Date();
            io.emit('sensorData', data);
            addToMasterHistory(data, 'weather');
        } else {
            console.log("❓ UNKNOWN DATA TYPE:", data);
        }
    }

    console.log("-----------------------------------------");
    res.json({ status: "success", message: "Data routed successfully" });
});

// ==================== WEATHER ENDPOINTS ====================

function buildSensorContext() {
    if (sensorHistory.length === 0) {
        return "No weather station data has been received yet.";
    }

    const latest = sensorHistory[sensorHistory.length - 1];
    const oldest = sensorHistory[0];

    const temps = sensorHistory.map(d => d.temperature).filter(t => t !== undefined);
    const pressures = sensorHistory.map(d => d.pressure).filter(p => p !== undefined);

    if (temps.length === 0 || pressures.length === 0) {
        return "Weather data is incomplete.";
    }

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;

    return `
Weather Station (${latest.sensor_id}):
- Temperature: ${latest.temperature}°C
- Pressure: ${latest.pressure} hPa
- Last reading: ${latest.timestamp}

Stats (${sensorHistory.length} readings):
- Temp range: ${Math.min(...temps).toFixed(1)}°C to ${Math.max(...temps).toFixed(1)}°C (avg: ${avgTemp.toFixed(1)}°C)
- Pressure range: ${Math.min(...pressures).toFixed(1)} to ${Math.max(...pressures).toFixed(1)} hPa
    `.trim();
}

app.get('/api/history', (req, res) => {
    res.json({
        history: sensorHistory,
        lastDataReceived: lastSensorDataReceived
    });
});

app.post('/api/chat', async (req, res) => {
    console.log("💬 Chat request received");
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!model) {
        console.log("❌ Gemini model not initialized");
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildSensorContext();
        const prompt = `You are an AI assistant for a weather station dashboard. Help users understand their sensor data.

Context:
${context}

User: ${message}

Provide a helpful, concise response.`;

        console.log("🤖 Calling Gemini API...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("✅ Gemini response received");
        res.json({ response: text });
    } catch (error) {
        console.error("❌ Gemini API error:", error.message);
        console.error("Full error:", JSON.stringify(error, null, 2));
        res.status(500).json({ error: "Failed to generate response: " + error.message });
    }
});

app.get('/api/status', (req, res) => {
    const now = new Date();
    const isOnline = lastSensorDataReceived && (now - lastSensorDataReceived) < 30000;
    res.json({ isOnline, lastDataReceived: lastSensorDataReceived, readingsCount: sensorHistory.length });
});

// ==================== CAR ENDPOINTS ====================

function buildCarContext() {
    if (carHistory.length === 0) {
        return "No car telemetry data has been received yet.";
    }

    const latest = carHistory[carHistory.length - 1];
    const speeds = carHistory.map(d => d.speed_kmh).filter(s => s !== undefined);
    const rpms = carHistory.map(d => d.rpm).filter(r => r !== undefined);

    if (speeds.length === 0) {
        return "Car data is incomplete.";
    }

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const avgRpm = rpms.length > 0 ? rpms.reduce((a, b) => a + b, 0) / rpms.length : 0;

    return `
Car Telemetry (${latest.sensor_id}):
- Speed: ${latest.speed_kmh} km/h
- RPM: ${latest.rpm}
- Throttle: ${latest.throttle_pos_pct}%
- Last reading: ${latest.timestamp}

Stats (${carHistory.length} readings):
- Speed: avg ${avgSpeed.toFixed(1)} km/h, max ${Math.max(...speeds)} km/h
- RPM: avg ${avgRpm.toFixed(0)}, max ${Math.max(...rpms)}
    `.trim();
}

app.get('/api/car/history', (req, res) => {
    res.json({
        history: carHistory,
        lastDataReceived: lastCarDataReceived
    });
});

app.post('/api/car/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        const context = buildCarContext();
        const prompt = `You are an AI assistant for a car OBD dashboard. Help users understand their vehicle data.

Context:
${context}

User: ${message}

Provide a helpful, concise response about driving patterns, vehicle health, or performance.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ response: text });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

app.get('/api/car/status', (req, res) => {
    const now = new Date();
    const isOnline = lastCarDataReceived && (now - lastCarDataReceived) < 30000;
    res.json({ isOnline, lastDataReceived: lastCarDataReceived, readingsCount: carHistory.length });
});

// ==================== UNIFIED CHAT ENDPOINT ====================

function buildUnifiedContext() {
    const weatherContext = buildSensorContext();
    const carContext = buildCarContext();

    // Build recent timeline
    const recentEvents = masterHistory.slice(-20).map(event => {
        const time = new Date(event._received).toLocaleTimeString();
        if (event._type === 'car') {
            return `[${time}] 🏎️ Car: ${event.speed_kmh} km/h, ${event.rpm} RPM`;
        } else {
            return `[${time}] 🌦️ Weather: ${event.temperature}°C, ${event.pressure} hPa`;
        }
    }).join('\n');

    return `
=== SYSTEM OVERVIEW ===

--- WEATHER STATION ---
${weatherContext}

--- CAR TELEMETRY ---
${carContext}

--- RECENT TIMELINE ---
${recentEvents || "No events yet"}
    `.trim();
}

app.post('/api/unified-chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        const context = buildUnifiedContext();
        const prompt = `You are an AI assistant for a unified IoT command center. You have access to BOTH weather station data AND car telemetry data. You can:
- Report on individual systems
- Correlate data between systems (e.g., how weather affects driving)
- Provide insights across all sensors
- Alert on anomalies in either system

Current System Context:
${context}

User Question: ${message}

Provide a comprehensive, insightful response. If the user asks about correlations or comparisons, analyze both datasets together.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        res.json({
            response: text,
            context: {
                weatherReadings: sensorHistory.length,
                carReadings: carHistory.length,
                totalEvents: masterHistory.length
            }
        });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

app.get('/api/unified/status', (req, res) => {
    const now = new Date();
    res.json({
        weather: {
            isOnline: lastSensorDataReceived && (now - lastSensorDataReceived) < 30000,
            lastDataReceived: lastSensorDataReceived,
            readingsCount: sensorHistory.length
        },
        car: {
            isOnline: lastCarDataReceived && (now - lastCarDataReceived) < 30000,
            lastDataReceived: lastCarDataReceived,
            readingsCount: carHistory.length
        },
        totalEvents: masterHistory.length
    });
});

app.get('/api/unified/history', (req, res) => {
    res.json({
        weather: sensorHistory,
        car: carHistory,
        timeline: masterHistory.slice(-50)
    });
});

// ==================== SUBZERO FLEET ENDPOINTS ====================

function buildFleetContext() {
    const devices = Object.values(fleetStatus);
    if (devices.length === 0) {
        return "No freezer fleet data has been received yet.";
    }

    // Categorize devices by status
    const critical = devices.filter(d => d.fault !== 'NORMAL' || d.temp_cabinet > -5);
    const warning = devices.filter(d => d.door_open || d.frost_level > 0.5);
    const healthy = devices.filter(d => d.fault === 'NORMAL' && !d.door_open && d.temp_cabinet <= -10);

    // Build device summaries
    const deviceSummaries = devices.map(d => {
        let status = '🟢 OK';
        if (d.fault !== 'NORMAL' || d.temp_cabinet > -5) status = '🔴 CRITICAL';
        else if (d.door_open || d.frost_level > 0.5) status = '🟡 WARNING';

        return `${d.device_id} (${d.location_name}): ${d.temp_cabinet}°C, ${d.fault}${d.door_open ? ' [DOOR OPEN]' : ''} ${status}`;
    }).join('\n');

    // Calculate fleet-wide stats
    const temps = devices.map(d => d.temp_cabinet);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const powers = devices.map(d => d.compressor_power_w);
    const totalPower = powers.reduce((a, b) => a + b, 0);

    return `
SUBZERO FLEET STATUS
====================
Total Units: ${devices.length}
🟢 Healthy: ${healthy.length}
🟡 Warning: ${warning.length}
🔴 Critical: ${critical.length}

Fleet Stats:
- Average Cabinet Temp: ${avgTemp.toFixed(1)}°C
- Total Power Draw: ${totalPower.toFixed(0)}W
- Last Update: ${new Date(lastFleetDataReceived).toLocaleTimeString()}

Unit Details:
${deviceSummaries}
    `.trim();
}

// Get fleet status (all devices' latest readings)
app.get('/api/fleet/status', (req, res) => {
    const now = new Date();
    const isOnline = lastFleetDataReceived && (now - lastFleetDataReceived) < 30000;

    // Calculate alerts
    const devices = Object.values(fleetStatus);
    const alerts = devices.filter(d =>
        d.fault !== 'NORMAL' ||
        d.door_open ||
        d.temp_cabinet > -5 ||
        d.frost_level > 0.5
    );

    res.json({
        devices: fleetStatus,
        alerts: alerts,
        summary: {
            total: devices.length,
            healthy: devices.filter(d => d.fault === 'NORMAL' && !d.door_open && d.temp_cabinet <= -10).length,
            warning: devices.filter(d => d.door_open || d.frost_level > 0.5).length,
            critical: devices.filter(d => d.fault !== 'NORMAL' || d.temp_cabinet > -5).length
        },
        isOnline,
        lastDataReceived: lastFleetDataReceived
    });
});

// Get specific device history
app.get('/api/freezer/:device_id/history', (req, res) => {
    const { device_id } = req.params;
    const history = freezerHistory[device_id] || [];

    res.json({
        device_id,
        history,
        latest: fleetStatus[device_id] || null,
        readingsCount: history.length
    });
});

// Fleet AI chat
app.post('/api/freezer/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!model) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildFleetContext();
        const prompt = `You are an AI assistant for the Subzero freezer fleet monitoring system. You help operators monitor and diagnose issues across a fleet of commercial freezers.

Your responsibilities:
- Monitor temperature anomalies (freezers should be below -15°C)
- Alert on door-open events (causes temperature rise)
- Track compressor health (power consumption, frequency)
- Monitor frost buildup (may need defrost cycle)
- Identify failing units before complete breakdown

Current Fleet Context:
${context}

Operator Question: ${message}

Provide a helpful, actionable response. If there are critical issues, prioritize them. Use the freezer IDs and locations when referring to specific units.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        res.json({
            response: text,
            context: {
                totalDevices: Object.keys(fleetStatus).length,
                alertCount: Object.values(fleetStatus).filter(d =>
                    d.fault !== 'NORMAL' || d.door_open || d.temp_cabinet > -5
                ).length
            }
        });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

// Fleet status summary
app.get('/api/fleet/summary', (req, res) => {
    const devices = Object.values(fleetStatus);
    if (devices.length === 0) {
        return res.json({ message: "No fleet data available" });
    }

    const temps = devices.map(d => d.temp_cabinet);
    const powers = devices.map(d => d.compressor_power_w);

    res.json({
        deviceCount: devices.length,
        temperature: {
            average: temps.reduce((a, b) => a + b, 0) / temps.length,
            min: Math.min(...temps),
            max: Math.max(...temps)
        },
        power: {
            total: powers.reduce((a, b) => a + b, 0),
            average: powers.reduce((a, b) => a + b, 0) / powers.length
        },
        alerts: {
            doorOpen: devices.filter(d => d.door_open).length,
            highTemp: devices.filter(d => d.temp_cabinet > -10).length,
            faults: devices.filter(d => d.fault !== 'NORMAL').length,
            highFrost: devices.filter(d => d.frost_level > 0.5).length
        }
    });
});

// ==================== FIRMWARE OTA ENDPOINTS ====================

// Upload firmware (called by GitHub Actions)
app.post('/api/firmware/upload', upload.single('firmware'), (req, res) => {
    // Verify auth token
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.FIRMWARE_UPLOAD_TOKEN;

    if (!expectedToken) {
        return res.status(500).json({ error: "Server not configured for firmware uploads" });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { device_type, version } = req.body;
    const firmware = req.file;

    if (!device_type || !version || !firmware) {
        return res.status(400).json({ error: "Missing device_type, version, or firmware file" });
    }

    // Store firmware in memory
    firmwareStore[device_type] = {
        version,
        buffer: firmware.buffer,
        uploadedAt: new Date().toISOString(),
        size: firmware.size
    };

    console.log(`✅ Firmware uploaded: ${device_type} v${version} (${firmware.size} bytes)`);
    io.emit('firmwareUpdate', { device_type, version, uploadedAt: firmwareStore[device_type].uploadedAt });

    res.json({
        success: true,
        message: `Firmware ${device_type} v${version} uploaded successfully`,
        size: firmware.size
    });
});

// Check for firmware updates (called by ESP32)
app.get('/api/firmware/:device_type/check', (req, res) => {
    const { device_type } = req.params;
    const { current_version } = req.query;

    const firmware = firmwareStore[device_type];

    if (!firmware) {
        return res.json({
            update_available: false,
            message: "No firmware available for this device type"
        });
    }

    const updateAvailable = current_version !== firmware.version;

    res.json({
        update_available: updateAvailable,
        current_version: current_version || "unknown",
        latest_version: firmware.version,
        size: firmware.size,
        uploaded_at: firmware.uploadedAt
    });
});

// Download firmware (called by ESP32 for OTA update)
app.get('/api/firmware/:device_type/download', (req, res) => {
    const { device_type } = req.params;
    const firmware = firmwareStore[device_type];

    if (!firmware) {
        return res.status(404).json({ error: "No firmware available" });
    }

    console.log(`📥 Firmware download: ${device_type} v${firmware.version}`);

    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': firmware.size,
        'Content-Disposition': `attachment; filename="${device_type}.bin"`,
        'X-Firmware-Version': firmware.version
    });

    res.send(firmware.buffer);
});

// Get firmware status (for dashboard)
app.get('/api/firmware/status', (req, res) => {
    const status = {};

    for (const [deviceType, firmware] of Object.entries(firmwareStore)) {
        status[deviceType] = {
            version: firmware.version,
            size: firmware.size,
            uploadedAt: firmware.uploadedAt
        };
    }

    res.json(status);
});

// ==================== DEBUG ENDPOINT ====================

app.get('/api/debug', (req, res) => {
    res.json({
        gemini: {
            apiKeyPresent: !!GEMINI_KEY,
            apiKeyPreview: GEMINI_KEY ? `${GEMINI_KEY.slice(0, 8)}...` : null,
            modelInitialized: !!model
        },
        cors: CORS_ORIGINS,
        firmware: {
            uploadTokenPresent: !!process.env.FIRMWARE_UPLOAD_TOKEN
        }
    });
});

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
    console.log('📱 Dashboard client connected:', socket.id);

    socket.emit('initialData', {
        history: sensorHistory,
        lastDataReceived: lastSensorDataReceived
    });

    socket.emit('initialCarData', {
        history: carHistory,
        lastDataReceived: lastCarDataReceived
    });

    // Send fleet data for Subzero dashboard
    socket.emit('initialFleetData', {
        devices: fleetStatus,
        history: freezerHistory,
        lastDataReceived: lastFleetDataReceived
    });

    socket.on('disconnect', () => {
        console.log('📴 Dashboard client disconnected:', socket.id);
    });
});

// ==================== START SERVER ====================

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log("🚀 IoT Server running!");
    console.log(`👉 Unified endpoint: http://192.168.1.183:${PORT}/api/data`);
    console.log(`   - sensor_type: 'car_telemetry' → Car Dashboard`);
    console.log(`   - sensor_type: 'weather_station' → Weather Dashboard`);
    console.log(`   - sensor_type: 'freezer' → Subzero Fleet Dashboard`);
    console.log(`👉 Dashboard: http://localhost:4001`);
    console.log(`👉 Command Center: http://localhost:4001/command-center`);
    console.log(`👉 Subzero Fleet: http://localhost:4001/freezer`);
});
