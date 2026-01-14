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
    console.log(`👉 Dashboard: http://localhost:4001`);
    console.log(`👉 Command Center: http://localhost:4001/command-center`);
});
