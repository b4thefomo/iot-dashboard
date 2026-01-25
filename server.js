require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase client initialized:", SUPABASE_URL);
} else {
    console.log("⚠️ Supabase not initialized - credentials missing");
}

// ==================== SUPABASE HELPER FUNCTIONS ====================

// Ensure device exists in database (auto-register new devices)
async function ensureDeviceExists(deviceData) {
    if (!supabase) return null;

    try {
        // Check if device exists
        const { data: existing } = await supabase
            .from('devices')
            .select('id')
            .eq('device_id', deviceData.device_id)
            .single();

        if (existing) return existing;

        // Get location ID based on location name
        const { data: location } = await supabase
            .from('locations')
            .select('id')
            .eq('name', deviceData.location_name)
            .single();

        // Create new device
        const { data: newDevice, error } = await supabase
            .from('devices')
            .insert({
                device_id: deviceData.device_id,
                location_id: location?.id || null,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Error creating device:", error.message);
            return null;
        }

        console.log(`📝 Device ${deviceData.device_id} registered in Supabase`);
        return newDevice;
    } catch (error) {
        console.error("❌ Supabase device error:", error.message);
        return null;
    }
}

// Store freezer reading in Supabase
async function storeReading(readingData) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('readings')
            .insert({
                device_id: readingData.device_id,
                timestamp: readingData.timestamp,
                temp_cabinet: readingData.temp_cabinet,
                temp_ambient: readingData.temp_ambient,
                compressor_power_w: readingData.compressor_power_w,
                compressor_freq_hz: readingData.compressor_freq_hz,
                frost_level: readingData.frost_level,
                cop: readingData.cop,
                door_open: readingData.door_open,
                defrost_on: readingData.defrost_on,
                fault: readingData.fault,
                fault_id: readingData.fault_id
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Error storing reading:", error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error("❌ Supabase reading error:", error.message);
        return null;
    }
}

// Create alert in Supabase
async function createAlert(deviceId, type, severity, message, readingId = null) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('alerts')
            .insert({
                device_id: deviceId,
                type,
                severity,
                message,
                reading_id: readingId
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Error creating alert:", error.message);
            return null;
        }

        console.log(`🚨 Alert created: ${type} for ${deviceId}`);
        return data;
    } catch (error) {
        console.error("❌ Supabase alert error:", error.message);
        return null;
    }
}

// Check conditions and create alerts if needed
async function checkAndCreateAlerts(readingData, readingId) {
    if (!supabase) return;

    const alerts = [];

    // Critical temperature
    if (readingData.temp_cabinet > -5) {
        alerts.push({
            type: 'TEMP_CRITICAL',
            severity: 'critical',
            message: `Critical temperature: ${readingData.temp_cabinet}°C (should be below -15°C)`
        });
    } else if (readingData.temp_cabinet > -10) {
        alerts.push({
            type: 'TEMP_HIGH',
            severity: 'warning',
            message: `High temperature: ${readingData.temp_cabinet}°C (should be below -15°C)`
        });
    }

    // Door open
    if (readingData.door_open) {
        alerts.push({
            type: 'DOOR_OPEN',
            severity: 'warning',
            message: 'Freezer door is open'
        });
    }

    // Fault detected
    if (readingData.fault && readingData.fault !== 'NORMAL') {
        alerts.push({
            type: 'FAULT',
            severity: 'critical',
            message: `Fault detected: ${readingData.fault}`
        });
    }

    // High frost
    if (readingData.frost_level > 0.5) {
        alerts.push({
            type: 'FROST_HIGH',
            severity: 'warning',
            message: `High frost level: ${(readingData.frost_level * 100).toFixed(0)}%`
        });
    }

    // Create alerts in database
    for (const alert of alerts) {
        await createAlert(readingData.device_id, alert.type, alert.severity, alert.message, readingId);
    }
}

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

// Home Freezer storage (for motion_sensor type from ESP32)
const homeFreezerHistory = []; // Temperature readings from home freezer
let lastHomeFreezerData = null;
let homeFreezerSimulatorRunning = false;
let homeFreezerSimulatorInterval = null;

// Home Freezer 2 storage (for second freezer with device_id: FREEZER_MAIN)
const homeFreezer2History = []; // Temperature readings from home freezer 2
let lastHomeFreezer2Data = null;

// Body Tracker storage (for body_tracker sensor type from ECG/accel chest strap)
const bodyTrackerHistory = []; // Body tracker readings
let lastBodyTrackerData = null;
let bodyTrackerSimulatorRunning = false;
let bodyTrackerSimulatorInterval = null;
let bodyTrackerMode = 'exercise'; // 'exercise', 'rest', 'sleep'
let bodyTrackerSessionState = {}; // Persisted session state

// Body Tracker daily stats for insights
const bodyTrackerDailyStats = {
    readings: [],
    lastReset: new Date().toDateString()
};

// Email configuration for reports
let emailConfig = {
    enabled: false,
    email: null,
    appPassword: null
};

// Firmware storage for OTA updates
const firmwareStore = {
    // device_type: { version, buffer, uploadedAt, size }
};

let lastSensorDataReceived = null;
let lastCarDataReceived = null;

// Initialize Gemini (new SDK)
const GEMINI_KEY = process.env.GEMINI_API_KEY;
console.log("🔑 GEMINI_API_KEY:", GEMINI_KEY ? `Found (${GEMINI_KEY.slice(0, 8)}...${GEMINI_KEY.slice(-4)})` : "❌ NOT FOUND");

let ai = null;
const GEMINI_MODEL = "gemini-3-flash-preview";

if (GEMINI_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    console.log("✅ Gemini AI initialized: " + GEMINI_MODEL);
} else {
    console.log("⚠️ Gemini not initialized - API key missing");
}

// ==================== ACTION PLANS STORAGE ====================

const ACTION_PLANS_FILE = path.join(__dirname, 'action-plans.json');

// Load action plans from file
function loadActionPlans() {
    try {
        if (fs.existsSync(ACTION_PLANS_FILE)) {
            const data = fs.readFileSync(ACTION_PLANS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("❌ Error loading action plans:", error.message);
    }
    return [];
}

// Save action plans to file
function saveActionPlans(plans) {
    try {
        fs.writeFileSync(ACTION_PLANS_FILE, JSON.stringify(plans, null, 2));
        return true;
    } catch (error) {
        console.error("❌ Error saving action plans:", error.message);
        return false;
    }
}

// Get active action plans
function getActiveActionPlans() {
    const plans = loadActionPlans();
    return plans.filter(p => p.status === 'active');
}

// ==================== TOOL DECLARATIONS ====================

const logActionPlanDeclaration = {
    name: 'log_action_plan',
    description: 'Creates and saves an action plan for addressing fleet issues. Use this when the operator requests an action plan or when critical issues need documented response steps.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'Brief title for the action plan (e.g., "Critical Temperature Response")'
            },
            priority: {
                type: Type.STRING,
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Priority level of the action plan'
            },
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        device_id: { type: Type.STRING, description: 'Device ID if applicable' },
                        action: { type: Type.STRING, description: 'Specific action to take' },
                        deadline: { type: Type.STRING, description: 'Suggested deadline' },
                        assignee: { type: Type.STRING, description: 'Suggested assignee or team' }
                    }
                },
                description: 'List of action items'
            },
            summary: {
                type: Type.STRING,
                description: 'Brief summary of why this plan was created'
            }
        },
        required: ['title', 'priority', 'items', 'summary']
    }
};

const getActionPlansDeclaration = {
    name: 'get_action_plans',
    description: 'Retrieves existing action plans. Use this when the operator asks about current plans, wants to review tasks, or you need context about ongoing work.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            status: {
                type: Type.STRING,
                enum: ['active', 'completed', 'all'],
                description: 'Filter by plan status'
            },
            limit: {
                type: Type.NUMBER,
                description: 'Maximum number of plans to retrieve'
            }
        },
        required: []
    }
};

const sendEmailDeclaration = {
    name: 'send_email',
    description: 'Sends an email notification to team members. Use this when the operator requests to notify the team, share a report, or alert about critical issues.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            to: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Email recipients (e.g., ["maintenance@company.com", "ops@company.com"])'
            },
            subject: {
                type: Type.STRING,
                description: 'Email subject line'
            },
            body: {
                type: Type.STRING,
                description: 'Email body content (plain text or simple HTML)'
            },
            priority: {
                type: Type.STRING,
                enum: ['normal', 'high'],
                description: 'Email priority'
            },
            attachReport: {
                type: Type.BOOLEAN,
                description: 'Whether to attach the current fleet status report'
            }
        },
        required: ['to', 'subject', 'body']
    }
};

// Tools array for Gemini
const fleetTools = [{
    functionDeclarations: [
        logActionPlanDeclaration,
        getActionPlansDeclaration,
        sendEmailDeclaration
    ]
}];

// ==================== TOOL EXECUTION HANDLERS ====================

async function executeLogActionPlan(args) {
    const plan = {
        id: `plan_${Date.now()}`,
        title: args.title,
        priority: args.priority,
        items: args.items || [],
        summary: args.summary,
        created_at: new Date().toISOString(),
        status: 'active'
    };

    const plans = loadActionPlans();
    plans.push(plan);

    if (saveActionPlans(plans)) {
        console.log(`📋 Action plan created: ${plan.id} - ${plan.title}`);
        return {
            success: true,
            plan_id: plan.id,
            message: `Action plan "${plan.title}" created successfully with ${plan.items.length} items.`
        };
    }
    return { success: false, error: 'Failed to save action plan' };
}

async function executeGetActionPlans(args) {
    let plans = loadActionPlans();

    // Filter by status if provided
    if (args.status && args.status !== 'all') {
        plans = plans.filter(p => p.status === args.status);
    }

    // Apply limit if provided
    if (args.limit && args.limit > 0) {
        plans = plans.slice(0, args.limit);
    }

    return {
        success: true,
        plans: plans,
        count: plans.length
    };
}

async function executeSendEmail(args) {
    // For now, log the email (can integrate with SendGrid/Nodemailer later)
    const emailLog = {
        id: `email_${Date.now()}`,
        to: args.to,
        subject: args.subject,
        body: args.body,
        priority: args.priority || 'normal',
        attachReport: args.attachReport || false,
        sent_at: new Date().toISOString(),
        status: 'logged' // Would be 'sent' with real email integration
    };

    console.log(`📧 Email logged: To: ${args.to.join(', ')}, Subject: ${args.subject}`);

    return {
        success: true,
        message: `Email notification logged successfully. Recipients: ${args.to.join(', ')}`,
        email_id: emailLog.id,
        note: 'Email integration pending - notification has been logged for manual follow-up.'
    };
}

// Execute tool call by name
async function executeToolCall(name, args) {
    switch (name) {
        case 'log_action_plan':
            return await executeLogActionPlan(args);
        case 'get_action_plans':
            return await executeGetActionPlans(args);
        case 'send_email':
            return await executeSendEmail(args);
        default:
            return { success: false, error: `Unknown tool: ${name}` };
    }
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

    } else if (sensorType === 'motion_sensor' || sensorType === 'home_freezer' || sensorType === 'freezer_monitor') {
        // Home freezer monitoring from ESP32 with DS18B20 temp sensor, MPU6050 accelerometer, and MC-38 door sensor
        const doorStatus = data.door_status || (data.is_door_open ? 'OPEN' : 'CLOSED');
        const isDoorOpen = data.is_door_open === true || data.is_door_open === 'true' || data.door_status === 'OPEN';
        const deviceId = data.device_id || 'HOME_FREEZER_01';
        const isSecondFreezer = deviceId === 'FREEZER_MAIN';

        console.log(isSecondFreezer ? "🏠🧊 HOME FREEZER 2:" : "🏠🧊 HOME FREEZER:", {
            device_id: deviceId,
            temp: (data.temp_c || data.external_temp_c) + "°C",
            door: doorStatus + (isDoorOpen ? ' 🚪' : ' 🔒'),
            compressor_x: data.compressor_vib_x || data.accel_x || 0
        });

        const normalizedHomeFreezer = {
            device_id: deviceId,
            temp_c: data.temp_c || data.external_temp_c,
            // Door sensor data
            door_status: doorStatus,
            is_door_open: isDoorOpen,
            // Accelerometer/compressor vibration data
            accel_x: data.compressor_vib_x || data.accel_x || 0,
            accel_y: data.compressor_vib_y || data.accel_y || 0,
            accel_z: data.compressor_vib_z || data.accel_z || 0,
            firmware_version: data.firmware_version,
            timestamp: data.server_timestamp,
            raw_timestamp: data.timestamp
        };

        if (isSecondFreezer) {
            // Route to Home Freezer 2
            homeFreezer2History.push(normalizedHomeFreezer);
            if (homeFreezer2History.length > MAX_HISTORY) homeFreezer2History.shift();
            lastHomeFreezer2Data = new Date();
            io.emit('homeFreezer2Data', normalizedHomeFreezer);
            addToMasterHistory(normalizedHomeFreezer, 'home_freezer_2');
        } else {
            // Route to original Home Freezer
            homeFreezerHistory.push(normalizedHomeFreezer);
            if (homeFreezerHistory.length > MAX_HISTORY) homeFreezerHistory.shift();
            lastHomeFreezerData = new Date();
            io.emit('homeFreezerData', normalizedHomeFreezer);
            addToMasterHistory(normalizedHomeFreezer, 'home_freezer');
        }

    } else if (sensorType === 'body_tracker') {
        // Body tracker data from ECG/accelerometer chest strap
        console.log("💓 BODY TRACKER:", {
            device_id: data.device_id,
            hr: data.heart_rate_bpm + " BPM",
            hrv: data.hrv_rmssd_ms + "ms",
            cadence: data.cadence_spm + " SPM"
        });

        const normalizedBodyTracker = {
            device_id: data.device_id || 'CHEST_STRAP_01',
            timestamp: data.server_timestamp,
            raw_timestamp: data.timestamp,
            // Real-time vitals
            heart_rate_bpm: data.heart_rate_bpm,
            heart_rate_zone: data.heart_rate_zone,
            cadence_spm: data.cadence_spm,
            battery_percent: data.battery_percent,
            // Form & Physics
            torso_lean_deg: data.torso_lean_deg,
            vertical_oscillation_cm: data.vertical_oscillation_cm,
            impact_g_force: data.impact_g_force,
            torso_rotation_deg: data.torso_rotation_deg,
            // Advanced health
            hrv_rmssd_ms: data.hrv_rmssd_ms,
            arrhythmia_flag: data.arrhythmia_flag,
            respiration_rate: data.respiration_rate,
            // Raw data
            ecg_waveform: data.ecg_waveform || [],
            accel_x: data.accel_x,
            accel_y: data.accel_y,
            accel_z: data.accel_z,
            // Session metrics
            total_steps: data.total_steps,
            calories_burned: data.calories_burned,
            session_duration_sec: data.session_duration_sec,
            avg_heart_rate: data.avg_heart_rate,
            max_heart_rate: data.max_heart_rate
        };

        bodyTrackerHistory.push(normalizedBodyTracker);
        if (bodyTrackerHistory.length > MAX_HISTORY) bodyTrackerHistory.shift();

        lastBodyTrackerData = new Date();
        io.emit('bodyTrackerData', normalizedBodyTracker);
        addToMasterHistory(normalizedBodyTracker, 'body_tracker');

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

        // Store in Supabase (async, non-blocking)
        if (supabase) {
            (async () => {
                try {
                    // Ensure device exists
                    await ensureDeviceExists(normalizedFreezer);

                    // Store reading
                    const reading = await storeReading(normalizedFreezer);

                    // Check and create alerts if conditions are met
                    if (reading) {
                        await checkAndCreateAlerts(normalizedFreezer, reading.id);
                    }
                } catch (err) {
                    console.error("❌ Supabase storage error:", err.message);
                }
            })();
        }

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

    if (!ai) {
        console.log("❌ Gemini not initialized");
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
        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        const text = result.text;
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

    if (!ai) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildCarContext();
        const prompt = `You are an AI assistant for a car OBD dashboard. Help users understand their vehicle data.

Context:
${context}

User: ${message}

Provide a helpful, concise response about driving patterns, vehicle health, or performance.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        const text = result.text;
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

    if (!ai) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

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

Provide a comprehensive, insightful response. If the user asks about correlations or comparisons, analyze both datasets together.

IMPORTANT: At the end of your response, always include a "Suggested Actions" section with 2-4 relevant follow-up actions the user might want to take. Format them exactly like this:

---
**Suggested Actions:**
- 📤 Share report with team
- 📊 Download detailed CSV
- 🔔 Set up alert notification
- 📋 Create action plan

Choose actions relevant to your response content. Possible actions include: notify team, share report, download CSV, generate PDF report, create action plan, schedule maintenance, set alert threshold, export data, review history, contact support.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        const text = result.text;

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

// Fleet AI chat with tool calling
app.post('/api/freezer/chat', async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!ai) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildFleetContext();
        const existingPlans = getActiveActionPlans();

        // Format conversation history for context
        let historyContext = "";
        if (conversationHistory.length > 0) {
            historyContext = "\n\nPrevious Conversation:\n" +
                conversationHistory.map(msg =>
                    `${msg.role === 'user' ? 'Operator' : 'Assistant'}: ${msg.content}`
                ).join('\n\n') +
                "\n\n---\n";
        }

        // Include existing action plans in context
        let actionPlansContext = "";
        if (existingPlans.length > 0) {
            actionPlansContext = "\n\nExisting Action Plans:\n" +
                existingPlans.map(p => `- ${p.title} (${p.priority}, ${p.items.length} items, created: ${new Date(p.created_at).toLocaleString()})`).join('\n') +
                "\n\n---\n";
        }

        const isFollowUp = conversationHistory.length > 0;
        const followUpInstruction = isFollowUp
            ? `\n\nIMPORTANT - FOLLOW-UP CONTEXT: This is message #${conversationHistory.length + 1} in an ongoing conversation. The operator's current message "${message}" is responding to your previous answer above. If they say "yes", "ok", "sure", "go ahead", "please do", "show me", etc., they are confirming or requesting what you offered in your last response. DO NOT repeat the same analysis or ask again - proceed directly with the specific action, data, or information you previously offered to provide.`
            : '';

        const systemPrompt = `You are an AI assistant for the Subzero freezer fleet monitoring system. You help operators monitor and diagnose issues across a fleet of commercial freezers.

Your responsibilities:
- Monitor temperature anomalies (freezers should be below -15°C)
- Alert on door-open events (causes temperature rise)
- Track compressor health (power consumption, frequency)
- Monitor frost buildup (may need defrost cycle)
- Identify failing units before complete breakdown

You have access to the following tools:
1. log_action_plan - Create and save action plans when operators request them or when critical issues need documented steps
2. get_action_plans - Retrieve existing action plans when operators ask about current tasks or ongoing work
3. send_email - Send email notifications to team members for alerts or reports

When the operator says things like:
- "Create an action plan" → Use log_action_plan
- "What are our current action items?" → Use get_action_plans
- "Notify the maintenance team" → Use send_email
- "Email the team about this" → Use send_email

Current Fleet Context:
${context}
${actionPlansContext}
${historyContext}
Current Operator Message: ${message}
${followUpInstruction}

Provide a helpful, actionable response. If there are critical issues, prioritize them. Use the freezer IDs and locations when referring to specific units.

IMPORTANT: At the end of your response, always include a "Suggested Actions" section with 2-4 relevant follow-up actions the operator might want to take. Format them exactly like this:

---
**Suggested Actions:**
- 📤 Notify maintenance team
- 📊 Download fleet report
- 🔧 Schedule maintenance
- 📋 Create action plan

Choose actions relevant to your response content. Possible actions include: notify team, share report, download CSV, generate PDF report, create action plan, schedule maintenance, dispatch technician, set alert threshold, export data, review unit history, contact support, initiate defrost cycle.`;

        // Call Gemini with tools
        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: systemPrompt,
            config: {
                tools: fleetTools
            }
        });

        // Debug: Log response structure
        console.log('🔍 Gemini response keys:', Object.keys(result));
        console.log('🔍 Has functionCalls:', !!result.functionCalls, result.functionCalls?.length || 0);
        if (result.candidates && result.candidates[0]) {
            console.log('🔍 Candidate content parts:', result.candidates[0].content?.parts?.map(p => Object.keys(p)));
        }

        // Check for function calls
        let toolsUsed = [];
        let finalText = result.text;

        if (result.functionCalls && result.functionCalls.length > 0) {
            const toolResults = [];

            for (const functionCall of result.functionCalls) {
                console.log(`🔧 Tool Call: ${functionCall.name}(${JSON.stringify(functionCall.args)})`);
                const toolResult = await executeToolCall(functionCall.name, functionCall.args);
                toolResults.push({
                    name: functionCall.name,
                    response: toolResult
                });
                toolsUsed.push(functionCall.name);
            }

            // Send results back to Gemini for final response
            const contents = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                result.candidates[0].content,
                {
                    role: 'user',
                    parts: toolResults.map(r => ({
                        functionResponse: {
                            name: r.name,
                            response: r.response
                        }
                    }))
                }
            ];

            const finalResult = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: contents,
                config: {
                    tools: fleetTools
                }
            });

            finalText = finalResult.text;
        }

        res.json({
            response: finalText,
            toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
            context: {
                totalDevices: Object.keys(fleetStatus).length,
                alertCount: Object.values(fleetStatus).filter(d =>
                    d.fault !== 'NORMAL' || d.door_open || d.temp_cabinet > -5
                ).length,
                activeActionPlans: existingPlans.length
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

// ==================== HOME FREEZER ENDPOINTS ====================

function buildSingleFreezerContext(history, name, deviceId) {
    if (history.length === 0) {
        return `${name} (${deviceId}): No data received yet.`;
    }

    const latest = history[history.length - 1];
    const temps = history.map(d => d.temp_c).filter(t => t !== undefined && t !== -127);

    if (temps.length === 0) {
        return `${name} (${deviceId}): Temperature data incomplete.`;
    }

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    // Determine status
    let status = 'NORMAL';
    if (latest.temp_c > -10) status = 'CRITICAL - TOO WARM';
    else if (latest.temp_c > -15) status = 'WARNING - WARMING UP';
    else if (latest.temp_c < -25) status = 'WARNING - TOO COLD';

    return `
${name} (${deviceId})
-----------------------
Current Temperature: ${latest.temp_c}°C
Status: ${status}
Door: ${latest.door_status || 'Unknown'} ${latest.is_door_open ? '(OPEN!)' : ''}
Firmware: ${latest.firmware_version || 'Unknown'}
Last Reading: ${latest.timestamp}

Temperature Stats (${temps.length} readings):
- Average: ${avgTemp.toFixed(1)}°C
- Min: ${minTemp.toFixed(1)}°C
- Max: ${maxTemp.toFixed(1)}°C

Compressor Vibration:
- X: ${latest.accel_x}, Y: ${latest.accel_y}, Z: ${latest.accel_z}
    `.trim();
}

function buildHomeFreezerContext() {
    const freezer1Context = buildSingleFreezerContext(homeFreezerHistory, 'Freezer 1', 'HOME_FREEZER_01');
    const freezer2Context = buildSingleFreezerContext(homeFreezer2History, 'Freezer 2', 'FREEZER_MAIN');

    // Determine overall assessment
    let overallStatus = 'Both freezers operating normally.';
    const f1Latest = homeFreezerHistory.length > 0 ? homeFreezerHistory[homeFreezerHistory.length - 1] : null;
    const f2Latest = homeFreezer2History.length > 0 ? homeFreezer2History[homeFreezer2History.length - 1] : null;

    const issues = [];
    if (f1Latest && f1Latest.temp_c > -10) issues.push('Freezer 1 temperature CRITICAL');
    else if (f1Latest && f1Latest.temp_c > -15) issues.push('Freezer 1 temperature elevated');
    if (f2Latest && f2Latest.temp_c > -10) issues.push('Freezer 2 temperature CRITICAL');
    else if (f2Latest && f2Latest.temp_c > -15) issues.push('Freezer 2 temperature elevated');
    if (f1Latest && f1Latest.is_door_open) issues.push('Freezer 1 door is OPEN');
    if (f2Latest && f2Latest.is_door_open) issues.push('Freezer 2 door is OPEN');

    if (issues.length > 0) {
        overallStatus = 'ALERTS: ' + issues.join(', ');
    }

    return `
HOME FREEZER MONITORING SYSTEM
==============================
Overall: ${overallStatus}

${freezer1Context}

${freezer2Context}

Recommended Range: -18°C to -22°C for optimal food preservation
    `.trim();
}

app.get('/api/home-freezer/history', (req, res) => {
    res.json({
        history: homeFreezerHistory,
        lastDataReceived: lastHomeFreezerData
    });
});

app.get('/api/home-freezer/status', (req, res) => {
    const now = new Date();
    const isOnline = lastHomeFreezerData && (now - lastHomeFreezerData) < 30000;
    const latest = homeFreezerHistory.length > 0 ? homeFreezerHistory[homeFreezerHistory.length - 1] : null;

    let status = 'unknown';
    if (latest) {
        if (latest.temp_c > -10) status = 'critical';
        else if (latest.temp_c > -15) status = 'warning';
        else if (latest.temp_c < -25) status = 'warning';
        else status = 'healthy';
    }

    res.json({
        isOnline,
        lastDataReceived: lastHomeFreezerData,
        readingsCount: homeFreezerHistory.length,
        latest,
        status
    });
});

app.post('/api/home-freezer/chat', async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!ai) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildHomeFreezerContext();

        // Format conversation history for context
        let historyContext = "";
        if (conversationHistory.length > 0) {
            historyContext = "\n\nPrevious Conversation:\n" +
                conversationHistory.map(msg =>
                    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
                ).join('\n\n') +
                "\n\n---\n";
        }

        const systemPrompt = `You are an AI assistant for a home freezer monitoring system. You help users monitor TWO home freezers and ensure food safety.

FREEZERS:
- Freezer 1 (HOME_FREEZER_01): The original home freezer
- Freezer 2 (FREEZER_MAIN): The second home freezer

Your responsibilities:
- Monitor BOTH freezers' temperatures (should be between -18°C to -22°C)
- Compare temperatures between freezers and identify any concerning differences
- Alert on temperature anomalies (too warm = food spoilage risk, too cold = frost buildup)
- Track compressor vibration data (could indicate compressor issues)
- Monitor door status on both units
- Provide food safety advice based on temperature history

Temperature Guidelines:
- Ideal: -18°C to -22°C
- Warning (Warm): Above -15°C - food may start to thaw
- Critical (Warm): Above -10°C - immediate action needed
- Warning (Cold): Below -25°C - excessive energy use, potential frost buildup

Current Status of BOTH Freezers:
${context}
${historyContext}
User Message: ${message}

Provide a helpful, friendly response about the freezer status. When appropriate, compare both freezers. If there are concerns with either or both freezers, explain clearly and suggest actions.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: systemPrompt
        });

        const text = result.text;
        res.json({
            response: text,
            context: {
                freezer1: {
                    readingsCount: homeFreezerHistory.length,
                    lastReading: homeFreezerHistory.length > 0 ? homeFreezerHistory[homeFreezerHistory.length - 1] : null
                },
                freezer2: {
                    readingsCount: homeFreezer2History.length,
                    lastReading: homeFreezer2History.length > 0 ? homeFreezer2History[homeFreezer2History.length - 1] : null
                }
            }
        });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

// ==================== HOME FREEZER 2 ENDPOINTS ====================

function buildHomeFreezer2Context() {
    if (homeFreezer2History.length === 0) {
        return "No home freezer 2 data has been received yet.";
    }

    const latest = homeFreezer2History[homeFreezer2History.length - 1];
    const temps = homeFreezer2History.map(d => d.temp_c).filter(t => t !== undefined && t !== -127);

    if (temps.length === 0) {
        return "Home freezer 2 temperature data is incomplete.";
    }

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    let status = 'Unknown';
    if (latest.temp_c > -10) status = 'CRITICAL - Temperature too warm!';
    else if (latest.temp_c > -15) status = 'WARNING - Temperature elevated';
    else if (latest.temp_c < -25) status = 'WARNING - Temperature very cold';
    else status = 'HEALTHY - Temperature normal';

    return `
HOME FREEZER 2 STATUS (FREEZER_MAIN)
================================
Current Temperature: ${latest.temp_c}°C
Door Status: ${latest.door_status || 'Unknown'} ${latest.is_door_open ? '🚪 OPEN' : '🔒 Closed'}
Status: ${status}
Firmware: ${latest.firmware_version || 'Unknown'}
Last Reading: ${latest.timestamp}

Temperature Stats (${temps.length} readings):
- Average: ${avgTemp.toFixed(1)}°C
- Min: ${minTemp.toFixed(1)}°C
- Max: ${maxTemp.toFixed(1)}°C

Compressor Vibration:
- Accel X: ${latest.accel_x}
- Accel Y: ${latest.accel_y}
- Accel Z: ${latest.accel_z}

Recommended Range: -18°C to -22°C for optimal food preservation
    `.trim();
}

app.get('/api/home-freezer-2/history', (req, res) => {
    res.json({
        history: homeFreezer2History,
        lastDataReceived: lastHomeFreezer2Data
    });
});

app.get('/api/home-freezer-2/status', (req, res) => {
    const now = new Date();
    const isOnline = lastHomeFreezer2Data && (now - lastHomeFreezer2Data) < 30000;
    const latest = homeFreezer2History.length > 0 ? homeFreezer2History[homeFreezer2History.length - 1] : null;

    let status = 'unknown';
    if (latest) {
        if (latest.temp_c > -10) status = 'critical';
        else if (latest.temp_c > -15) status = 'warning';
        else if (latest.temp_c < -25) status = 'warning';
        else status = 'healthy';
    }

    res.json({
        isOnline,
        lastDataReceived: lastHomeFreezer2Data,
        readingsCount: homeFreezer2History.length,
        latest,
        status
    });
});

app.post('/api/home-freezer-2/chat', async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!ai) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildHomeFreezer2Context();

        // Format conversation history for context
        let historyContext = "";
        if (conversationHistory.length > 0) {
            historyContext = "\n\nPrevious Conversation:\n" +
                conversationHistory.map(msg =>
                    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
                ).join('\n\n') +
                "\n\n---\n";
        }

        const systemPrompt = `You are an AI assistant for a home freezer monitoring system. You help users monitor their second home freezer (FREEZER_MAIN) temperature and ensure food safety.

Your responsibilities:
- Monitor freezer temperature (should be between -18°C to -22°C for optimal food preservation)
- Alert on temperature anomalies (too warm = food spoilage risk, too cold = frost buildup)
- Track compressor vibration data (could indicate compressor issues)
- Provide food safety advice based on temperature history

Temperature Guidelines:
- Ideal: -18°C to -22°C
- Warning (Warm): Above -15°C - food may start to thaw
- Critical (Warm): Above -10°C - immediate action needed
- Warning (Cold): Below -25°C - excessive energy use, potential frost buildup

Current Freezer 2 Context:
${context}
${historyContext}
User Message: ${message}

Provide a helpful, friendly response about the home freezer 2 status. If there are concerns, explain them clearly and suggest actions.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: systemPrompt
        });

        const text = result.text;
        res.json({
            response: text,
            context: {
                readingsCount: homeFreezer2History.length,
                lastReading: homeFreezer2History.length > 0 ? homeFreezer2History[homeFreezer2History.length - 1] : null
            }
        });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

// ==================== BODY TRACKER ENDPOINTS ====================

function buildBodyTrackerContext() {
    if (bodyTrackerHistory.length === 0) {
        return "No body tracker data has been received yet. The simulator will auto-start when a client connects.";
    }

    const latest = bodyTrackerHistory[bodyTrackerHistory.length - 1];
    const readings = bodyTrackerHistory;

    // Calculate session stats
    const heartRates = readings.map(r => r.heart_rate_bpm).filter(v => v !== undefined);
    const avgHR = heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0;
    const maxHR = heartRates.length > 0 ? Math.max(...heartRates) : 0;
    const hrvs = readings.map(r => r.hrv_rmssd_ms).filter(v => v !== undefined);
    const avgHRV = hrvs.length > 0 ? hrvs.reduce((a, b) => a + b, 0) / hrvs.length : 0;

    // Format session duration
    const sessionDur = latest.session_duration_sec || 0;
    const mins = Math.floor(sessionDur / 60);
    const secs = sessionDur % 60;
    const sessionTime = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Get HR zone description
    const zoneNames = {
        'rest': 'Rest (<50% Max HR)',
        'zone1': 'Zone 1 - Warm Up (50-60%)',
        'zone2': 'Zone 2 - Fat Burn (60-70%)',
        'zone3': 'Zone 3 - Cardio (70-80%)',
        'zone4': 'Zone 4 - Hard (80-90%)',
        'zone5': 'Zone 5 - Max Effort (90-100%)'
    };

    // Evaluate form quality
    const evalLean = (deg) => {
        if (deg >= 2 && deg <= 10) return '✅ Ideal';
        if (deg > 10 && deg <= 15) return '⚠️ Slightly high';
        if (deg < 2) return '⚠️ Too upright';
        return '❌ Too far forward';
    };

    const evalOscillation = (cm) => {
        if (cm < 8) return '✅ Efficient';
        if (cm <= 10) return '⚠️ Slightly high';
        return '❌ Too bouncy';
    };

    const evalImpact = (g) => {
        if (g < 2) return '✅ Good';
        if (g <= 3) return '⚠️ Moderate';
        return '❌ High impact';
    };

    const evalRotation = (deg) => {
        if (deg < 15) return '✅ Efficient';
        if (deg <= 20) return '⚠️ Slightly high';
        return '❌ Excessive twist';
    };

    const evalHRV = (ms) => {
        if (ms > 50) return 'Excellent recovery capacity';
        if (ms >= 30) return 'Good recovery capacity';
        if (ms >= 20) return 'Moderate - may be fatigued';
        return 'Low - consider rest';
    };

    return `
BODY TRACKER STATUS
====================
Device: ${latest.device_id}
Session Duration: ${sessionTime}
Battery: ${latest.battery_percent}%

CURRENT VITALS:
- Heart Rate: ${latest.heart_rate_bpm} BPM (${zoneNames[latest.heart_rate_zone] || latest.heart_rate_zone})
- Cadence: ${latest.cadence_spm} SPM ${latest.cadence_spm >= 170 ? '✅' : latest.cadence_spm >= 160 ? '⚠️' : '❌'}
- HRV (rMSSD): ${latest.hrv_rmssd_ms}ms (${evalHRV(latest.hrv_rmssd_ms)})
- Respiration: ${latest.respiration_rate} breaths/min
- Rhythm: ${latest.arrhythmia_flag === 'normal' ? '✅ Normal' : '⚠️ Irregular detected'}

FORM ANALYSIS:
- Torso Lean: ${latest.torso_lean_deg.toFixed(1)}° ${evalLean(latest.torso_lean_deg)} (Ideal: 2-10°)
- Vertical Oscillation: ${latest.vertical_oscillation_cm.toFixed(1)}cm ${evalOscillation(latest.vertical_oscillation_cm)} (Goal: <8cm)
- Impact Force: ${latest.impact_g_force.toFixed(2)}G ${evalImpact(latest.impact_g_force)} (Target: <2G)
- Torso Rotation: ${latest.torso_rotation_deg.toFixed(1)}° ${evalRotation(latest.torso_rotation_deg)} (Target: <15°)

SESSION STATS:
- Total Steps: ${latest.total_steps?.toLocaleString() || 0}
- Calories Burned: ${latest.calories_burned || 0}
- Average HR: ${avgHR.toFixed(0)} BPM
- Max HR: ${maxHR} BPM
- Average HRV: ${avgHRV.toFixed(1)}ms

DATA QUALITY:
- Readings: ${readings.length}
- ECG Samples/Reading: ${latest.ecg_waveform?.length || 0}
    `.trim();
}

app.get('/api/body-tracker/status', (req, res) => {
    const now = new Date();
    const isOnline = lastBodyTrackerData && (now - lastBodyTrackerData) < 30000;
    const latest = bodyTrackerHistory.length > 0 ? bodyTrackerHistory[bodyTrackerHistory.length - 1] : null;

    res.json({
        isOnline,
        lastDataReceived: lastBodyTrackerData,
        readingsCount: bodyTrackerHistory.length,
        latest,
        simulatorRunning: bodyTrackerSimulatorRunning
    });
});

app.get('/api/body-tracker/history', (req, res) => {
    res.json({
        history: bodyTrackerHistory,
        lastDataReceived: lastBodyTrackerData
    });
});

app.post('/api/body-tracker/chat', async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!ai) {
        return res.status(500).json({ error: "AI not configured - missing API key" });
    }

    try {
        const context = buildBodyTrackerContext();

        // Format conversation history for context
        let historyContext = "";
        if (conversationHistory.length > 0) {
            historyContext = "\n\nPrevious Conversation:\n" +
                conversationHistory.map(msg =>
                    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
                ).join('\n\n') +
                "\n\n---\n";
        }

        const systemPrompt = `You are an AI fitness coach assistant for a body tracker monitoring system with ECG and accelerometer sensors on a chest strap. You help athletes and fitness enthusiasts optimize their performance and ensure safe exercise.

Your responsibilities:
- Monitor heart rate zones and provide zone-based training advice
- Analyze HRV (Heart Rate Variability) for recovery and stress insights
- Evaluate running form (torso lean, vertical oscillation, impact, rotation)
- Detect potential arrhythmias and provide appropriate guidance
- Track cadence and provide tips for optimal running efficiency
- Provide personalized feedback based on real-time metrics

Heart Rate Zone Guidelines:
- Rest (<50% max): Recovery
- Zone 1 (50-60%): Warm up, easy recovery
- Zone 2 (60-70%): Fat burning, base endurance
- Zone 3 (70-80%): Aerobic/cardio development
- Zone 4 (80-90%): Lactate threshold, hard efforts
- Zone 5 (90-100%): VO2max, peak performance

Form Guidelines:
- Torso Lean: 2-10° forward is ideal for efficient running
- Vertical Oscillation: <8cm minimizes wasted energy
- Impact G-Force: <2G reduces injury risk
- Torso Rotation: <15° indicates efficient arm swing
- Cadence: 170-180 SPM is optimal for most runners

HRV Insights:
- >50ms: Excellent recovery, good for hard training
- 30-50ms: Good, normal training load
- 20-30ms: Moderate, consider easier session
- <20ms: Low, prioritize recovery

Current Body Tracker Context:
${context}
${historyContext}
User Message: ${message}

Provide helpful, encouraging, and actionable fitness coaching advice. Be specific about form corrections and zone targets. If you see any concerning health indicators (arrhythmia, very low HRV, extremely high HR), provide appropriate safety guidance.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: systemPrompt
        });

        const text = result.text;
        res.json({
            response: text,
            context: {
                readingsCount: bodyTrackerHistory.length,
                lastReading: bodyTrackerHistory.length > 0 ? bodyTrackerHistory[bodyTrackerHistory.length - 1] : null
            }
        });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

// ==================== HOME FREEZER SIMULATOR ====================

// Track simulated door state (occasionally opens and closes)
let simulatedDoorOpen = false;
let doorOpenTicks = 0;

function generateFakeHomeFreezerData() {
    // Simulate realistic freezer temperature with small fluctuations
    // Normal freezer range: -18°C to -22°C
    let baseTemp = -20;

    // Simulate door open/close behavior
    // Door opens randomly (5% chance per tick) and stays open for 3-8 ticks
    if (!simulatedDoorOpen && Math.random() < 0.05) {
        simulatedDoorOpen = true;
        doorOpenTicks = 3 + Math.floor(Math.random() * 6); // 3-8 ticks (6-16 seconds)
        console.log('🚪 Simulator: Door OPENED');
    } else if (simulatedDoorOpen) {
        doorOpenTicks--;
        if (doorOpenTicks <= 0) {
            simulatedDoorOpen = false;
            console.log('🔒 Simulator: Door CLOSED');
        }
    }

    // Temperature rises when door is open
    if (simulatedDoorOpen) {
        baseTemp = -15 + (Math.random() * 3); // Warmer when door open: -15 to -12°C
    }

    const fluctuation = (Math.random() - 0.5) * 4; // +/- 2°C fluctuation
    const temp = baseTemp + fluctuation;

    // Simulate accelerometer data (vibrations from compressor)
    // Compressor running causes small vibrations
    const compressorRunning = Math.random() > 0.3; // 70% chance compressor is on
    const vibrationBase = compressorRunning ? 0.05 : 0.01;

    return {
        device_id: 'home_freezer_sim',
        sensor_type: 'freezer_monitor',
        temp_c: parseFloat(temp.toFixed(2)),
        // Door sensor data
        door_status: simulatedDoorOpen ? 'OPEN' : 'CLOSED',
        is_door_open: simulatedDoorOpen,
        // Compressor vibration data
        accel_x: parseFloat((Math.random() * vibrationBase * 2 - vibrationBase).toFixed(3)),
        accel_y: parseFloat((Math.random() * vibrationBase * 2 - vibrationBase).toFixed(3)),
        accel_z: parseFloat((0.98 + Math.random() * vibrationBase * 2 - vibrationBase).toFixed(3)), // Gravity ~1g
        firmware_version: '1.8.0-SIM',
        timestamp: new Date().toISOString(),
        raw_timestamp: Date.now()
    };
}

function startHomeFreezerSimulator() {
    if (homeFreezerSimulatorRunning) {
        console.log('🧊 Home Freezer simulator already running');
        return;
    }

    console.log('🧊 Starting Home Freezer simulator...');
    homeFreezerSimulatorRunning = true;

    homeFreezerSimulatorInterval = setInterval(() => {
        const reading = generateFakeHomeFreezerData();

        // Store in history
        homeFreezerHistory.push(reading);
        if (homeFreezerHistory.length > MAX_HISTORY) homeFreezerHistory.shift();
        lastHomeFreezerData = reading.timestamp;

        // Emit to connected clients
        io.emit('homeFreezerData', reading);
    }, 2000); // Update every 2 seconds

    io.emit('homeFreezerSimulatorStatus', { running: true });
}

function stopHomeFreezerSimulator() {
    if (homeFreezerSimulatorInterval) {
        clearInterval(homeFreezerSimulatorInterval);
        homeFreezerSimulatorInterval = null;
    }
    homeFreezerSimulatorRunning = false;
    console.log('🧊 Home Freezer simulator stopped');
    io.emit('homeFreezerSimulatorStatus', { running: false });
}

// ==================== BODY TRACKER FAKE DATA SIMULATOR ====================

function generateFakeBodyTrackerData(sessionState, mode = 'exercise') {
    // Session state tracks progressive values
    sessionState.tick = (sessionState.tick || 0) + 1;
    sessionState.sessionDuration = (sessionState.sessionDuration || 0) + 0.1; // 100ms intervals
    sessionState.battery = sessionState.battery || 100;
    sessionState.steps = sessionState.steps || 0;
    sessionState.calories = sessionState.calories || 0;
    sessionState.hrSum = sessionState.hrSum || 0;
    sessionState.hrCount = sessionState.hrCount || 0;
    sessionState.maxHR = sessionState.maxHR || 60;
    sessionState.minHR = sessionState.minHR || 200;

    let baseHR, baseCadence, baseHRV, baseRespRate;
    let torsoLean, verticalOsc, impactG, torsoRotation;
    let accelX, accelY, accelZ;

    const t = sessionState.tick * 0.1;

    // Different modes produce different physiological patterns
    switch (mode) {
        case 'sleep':
            // Sleep: very low HR, high HRV, minimal movement
            baseHR = 52 + Math.sin(t / 300) * 5 + (Math.random() - 0.5) * 3;
            baseCadence = 0;
            baseHRV = 65 + Math.sin(t / 200) * 10 + (Math.random() - 0.5) * 8;
            baseRespRate = 12 + (Math.random() - 0.5) * 2;
            // Minimal body movement during sleep
            torsoLean = 0;
            verticalOsc = 0;
            impactG = 0;
            torsoRotation = Math.random() * 5; // Occasional sleep movement
            // Very subtle accelerometer (breathing motion)
            accelX = (Math.random() - 0.5) * 0.02;
            accelY = (Math.random() - 0.5) * 0.02;
            accelZ = 1.0 + Math.sin(t * 0.2) * 0.01; // Subtle breathing
            break;

        case 'rest':
            // Resting/idle: low HR, high HRV, occasional small movements
            baseHR = 62 + Math.sin(t / 100) * 8 + (Math.random() - 0.5) * 5;
            baseCadence = 0;
            baseHRV = 55 + Math.sin(t / 150) * 12 + (Math.random() - 0.5) * 10;
            baseRespRate = 14 + (Math.random() - 0.5) * 3;
            // Seated/standing still posture
            torsoLean = 2 + (Math.random() - 0.5) * 2;
            verticalOsc = 0;
            impactG = 0;
            torsoRotation = 5 + (Math.random() - 0.5) * 5; // Small fidgeting
            // Minimal accelerometer activity
            accelX = (Math.random() - 0.5) * 0.05;
            accelY = (Math.random() - 0.5) * 0.05;
            accelZ = 1.0 + (Math.random() - 0.5) * 0.03;
            break;

        case 'exercise':
        default:
            // Exercise phases (warm up -> workout -> cool down)
            const phase = sessionState.sessionDuration < 60 ? 'warmup' :
                          sessionState.sessionDuration < 600 ? 'workout' :
                          'cooldown';

            switch (phase) {
                case 'warmup':
                    baseHR = 70 + (sessionState.sessionDuration / 60) * 50;
                    baseCadence = 100 + (sessionState.sessionDuration / 60) * 70;
                    baseHRV = 50 + (Math.random() - 0.5) * 15;
                    break;
                case 'workout':
                    baseHR = 130 + Math.sin(sessionState.tick / 50) * 20;
                    baseCadence = 172 + Math.sin(sessionState.tick / 30) * 8;
                    baseHRV = 35 + (Math.random() - 0.5) * 15;
                    break;
                case 'cooldown':
                    const cooldownTime = sessionState.sessionDuration - 600;
                    baseHR = 130 - (cooldownTime / 60) * 30;
                    baseCadence = 172 - (cooldownTime / 60) * 40;
                    baseHRV = 45 + (Math.random() - 0.5) * 15;
                    break;
            }
            baseHR += (Math.random() - 0.5) * 10;
            baseCadence = Math.max(0, baseCadence + (Math.random() - 0.5) * 6);
            baseRespRate = 10 + (baseHR - 60) * 0.15 + (Math.random() - 0.5) * 4;

            // Form metrics with realistic running values
            torsoLean = 6 + Math.sin(sessionState.tick / 100) * 2 + (Math.random() - 0.5) * 2;
            verticalOsc = baseCadence > 160 ? 7 + (Math.random() - 0.5) * 2 : 5 + (Math.random() - 0.5) * 3;
            impactG = baseCadence > 160 ? 1.8 + (Math.random() - 0.5) * 0.6 : 1.2 + (Math.random() - 0.5) * 0.4;
            torsoRotation = 10 + Math.sin(sessionState.tick / 80) * 3 + (Math.random() - 0.5) * 2;

            // Accelerometer data (rhythmic for running)
            const runningFreq = baseCadence / 60;
            accelX = baseCadence > 100 ? Math.sin(t * runningFreq * 2 * Math.PI) * 0.5 : (Math.random() - 0.5) * 0.1;
            accelY = baseCadence > 100 ? Math.sin(t * runningFreq * 2 * Math.PI + Math.PI / 4) * 0.3 : (Math.random() - 0.5) * 0.1;
            accelZ = baseCadence > 100 ? 1.0 + Math.abs(Math.sin(t * runningFreq * 2 * Math.PI)) * 0.5 : 1.0 + (Math.random() - 0.5) * 0.05;
            break;
    }

    const heartRate = Math.round(Math.max(45, Math.min(200, baseHR)));
    const cadence = Math.round(Math.max(0, baseCadence));
    const hrv = Math.max(5, baseHRV);
    const respRate = Math.round(Math.max(8, baseRespRate));

    // Calculate HR zone (assuming max HR of 190)
    const maxHRRef = 190;
    const hrPercent = (heartRate / maxHRRef) * 100;
    let hrZone = 'rest';
    if (hrPercent >= 90) hrZone = 'zone5';
    else if (hrPercent >= 80) hrZone = 'zone4';
    else if (hrPercent >= 70) hrZone = 'zone3';
    else if (hrPercent >= 60) hrZone = 'zone2';
    else if (hrPercent >= 50) hrZone = 'zone1';

    // Generate synthetic ECG waveform (~25 samples for 100ms at 250Hz)
    const ecgWaveform = [];
    const samplesPerBeat = Math.round(250 / (heartRate / 60));
    for (let i = 0; i < 25; i++) {
        const beatPhase = (i % samplesPerBeat) / samplesPerBeat;
        let voltage = 0;
        if (beatPhase < 0.1) voltage = 0.1 * Math.sin(beatPhase * Math.PI / 0.1);
        else if (beatPhase < 0.15) voltage = -0.1;
        else if (beatPhase < 0.18) voltage = -0.3;
        else if (beatPhase < 0.22) voltage = 1.0;
        else if (beatPhase < 0.26) voltage = -0.2;
        else if (beatPhase < 0.4) voltage = 0;
        else if (beatPhase < 0.6) voltage = 0.3 * Math.sin((beatPhase - 0.4) * Math.PI / 0.2);
        else voltage = 0;
        voltage += (Math.random() - 0.5) * 0.05;
        ecgWaveform.push(voltage);
    }

    // Update session stats
    if (cadence > 100) {
        sessionState.steps += Math.round(cadence / 600);
        sessionState.calories += heartRate * 0.0001;
    } else if (mode === 'rest') {
        sessionState.calories += heartRate * 0.00002; // BMR calories
    }
    sessionState.hrSum += heartRate;
    sessionState.hrCount++;
    sessionState.maxHR = Math.max(sessionState.maxHR, heartRate);
    sessionState.minHR = Math.min(sessionState.minHR, heartRate);
    sessionState.battery -= 0.00017;

    return {
        sensor_type: 'body_tracker',
        device_id: 'CHEST_STRAP_SIM',
        timestamp: Date.now(),
        mode: mode,
        // Vitals
        heart_rate_bpm: heartRate,
        heart_rate_zone: hrZone,
        cadence_spm: cadence,
        battery_percent: Math.max(0, Math.round(sessionState.battery)),
        // Form
        torso_lean_deg: Math.max(0, torsoLean),
        vertical_oscillation_cm: Math.max(0, verticalOsc),
        impact_g_force: Math.max(0, impactG),
        torso_rotation_deg: Math.max(0, torsoRotation),
        // Health
        hrv_rmssd_ms: Math.max(5, hrv),
        arrhythmia_flag: Math.random() > 0.995 ? 'warning' : 'normal',
        respiration_rate: Math.max(8, respRate),
        // Raw data
        ecg_waveform: ecgWaveform,
        accel_x: accelX,
        accel_y: accelY,
        accel_z: accelZ,
        // Session
        total_steps: sessionState.steps,
        calories_burned: Math.round(sessionState.calories),
        session_duration_sec: Math.round(sessionState.sessionDuration),
        avg_heart_rate: Math.round(sessionState.hrSum / sessionState.hrCount),
        max_heart_rate: sessionState.maxHR,
        min_heart_rate: sessionState.minHR < 200 ? sessionState.minHR : heartRate
    };
}

function startBodyTrackerSimulator() {
    if (bodyTrackerSimulatorRunning) return;

    console.log(`💓 Starting Body Tracker simulator in ${bodyTrackerMode} mode...`);
    bodyTrackerSimulatorRunning = true;

    bodyTrackerSimulatorInterval = setInterval(() => {
        const data = generateFakeBodyTrackerData(bodyTrackerSessionState, bodyTrackerMode);
        const timestampedData = addTimestamp(data);

        // Normalize and store
        const normalized = {
            ...timestampedData,
            timestamp: timestampedData.server_timestamp
        };

        bodyTrackerHistory.push(normalized);
        if (bodyTrackerHistory.length > MAX_HISTORY) bodyTrackerHistory.shift();

        // Store for daily stats (sample every 10 readings to save memory)
        if (bodyTrackerSessionState.tick % 10 === 0) {
            // Reset daily stats if new day
            const today = new Date().toDateString();
            if (bodyTrackerDailyStats.lastReset !== today) {
                bodyTrackerDailyStats.readings = [];
                bodyTrackerDailyStats.lastReset = today;
            }
            bodyTrackerDailyStats.readings.push({
                timestamp: normalized.timestamp,
                hr: normalized.heart_rate_bpm,
                hrv: normalized.hrv_rmssd_ms,
                mode: normalized.mode
            });
            // Keep max 8640 samples (24 hours at 1 sample/10s)
            if (bodyTrackerDailyStats.readings.length > 8640) {
                bodyTrackerDailyStats.readings.shift();
            }
        }

        lastBodyTrackerData = new Date();
        io.emit('bodyTrackerData', normalized);
    }, 100); // 10Hz update rate
}

function stopBodyTrackerSimulator() {
    if (!bodyTrackerSimulatorRunning) return;

    console.log("💓 Stopping Body Tracker simulator...");
    bodyTrackerSimulatorRunning = false;
    if (bodyTrackerSimulatorInterval) {
        clearInterval(bodyTrackerSimulatorInterval);
        bodyTrackerSimulatorInterval = null;
    }
}

// API to control simulator
app.post('/api/body-tracker/simulator/start', (req, res) => {
    startBodyTrackerSimulator();
    res.json({ success: true, message: "Simulator started", mode: bodyTrackerMode });
});

app.post('/api/body-tracker/simulator/stop', (req, res) => {
    stopBodyTrackerSimulator();
    res.json({ success: true, message: "Simulator stopped" });
});

// Mode switching API
app.get('/api/body-tracker/mode', (req, res) => {
    res.json({ mode: bodyTrackerMode, availableModes: ['exercise', 'rest', 'sleep'] });
});

app.post('/api/body-tracker/mode', (req, res) => {
    const { mode } = req.body;
    if (!['exercise', 'rest', 'sleep'].includes(mode)) {
        return res.status(400).json({ error: "Invalid mode. Use: exercise, rest, or sleep" });
    }
    bodyTrackerMode = mode;
    // Reset session state when switching modes
    bodyTrackerSessionState = {};
    console.log(`💓 Body Tracker mode changed to: ${mode}`);
    io.emit('bodyTrackerModeChange', { mode });
    res.json({ success: true, mode });
});

// Daily insights API
app.get('/api/body-tracker/insights', async (req, res) => {
    const stats = bodyTrackerDailyStats.readings;
    if (stats.length === 0) {
        return res.json({
            insights: "No data collected yet. Keep wearing your tracker to build insights.",
            stats: null
        });
    }

    // Calculate aggregated stats
    const hrs = stats.map(s => s.hr);
    const hrvs = stats.map(s => s.hrv);
    const avgHR = hrs.reduce((a, b) => a + b, 0) / hrs.length;
    const minHR = Math.min(...hrs);
    const maxHR = Math.max(...hrs);
    const avgHRV = hrvs.reduce((a, b) => a + b, 0) / hrvs.length;
    const minHRV = Math.min(...hrvs);
    const maxHRV = Math.max(...hrvs);

    // Count time in each mode
    const modeCounts = stats.reduce((acc, s) => {
        acc[s.mode] = (acc[s.mode] || 0) + 1;
        return acc;
    }, {});

    const calculatedStats = {
        readingCount: stats.length,
        avgHeartRate: avgHR.toFixed(1),
        minHeartRate: minHR,
        maxHeartRate: maxHR,
        avgHRV: avgHRV.toFixed(1),
        minHRV: minHRV.toFixed(1),
        maxHRV: maxHRV.toFixed(1),
        timeInModes: modeCounts,
        collectionPeriod: {
            start: stats[0]?.timestamp,
            end: stats[stats.length - 1]?.timestamp
        }
    };

    // Generate AI insights if available
    if (ai) {
        try {
            const prompt = `You are a health insights AI analyzing body tracker data. Based on this data, provide 3-5 concise, actionable health insights:

DATA SUMMARY:
- Average Heart Rate: ${avgHR.toFixed(0)} BPM (range: ${minHR}-${maxHR})
- Average HRV: ${avgHRV.toFixed(0)}ms (range: ${minHRV.toFixed(0)}-${maxHRV.toFixed(0)}ms)
- Resting HR baseline: ${minHR} BPM
- Data points collected: ${stats.length}
- Time in exercise mode: ${modeCounts.exercise || 0} samples
- Time in rest mode: ${modeCounts.rest || 0} samples
- Time in sleep mode: ${modeCounts.sleep || 0} samples

Provide personalized insights about:
1. Recovery status based on HRV
2. Cardiovascular health indicators
3. Stress levels and recommendations
4. Sleep/rest quality if applicable
5. Exercise recommendations

Keep each insight to 1-2 sentences. Be encouraging but honest.`;

            const result = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt
            });

            res.json({ insights: result.text, stats: calculatedStats });
        } catch (error) {
            console.error("Insights generation error:", error);
            res.json({
                insights: generateBasicInsights(calculatedStats),
                stats: calculatedStats
            });
        }
    } else {
        res.json({
            insights: generateBasicInsights(calculatedStats),
            stats: calculatedStats
        });
    }
});

function generateBasicInsights(stats) {
    const insights = [];
    const avgHR = parseFloat(stats.avgHeartRate);
    const avgHRV = parseFloat(stats.avgHRV);

    if (avgHRV > 50) {
        insights.push("Your HRV is excellent, indicating good recovery and low stress.");
    } else if (avgHRV > 30) {
        insights.push("Your HRV is in a healthy range. Maintain your current lifestyle.");
    } else {
        insights.push("Your HRV is lower than optimal. Consider more rest and stress management.");
    }

    if (stats.minHeartRate < 60) {
        insights.push("Your resting heart rate is athletic-level. Great cardiovascular fitness!");
    } else if (stats.minHeartRate < 70) {
        insights.push("Your resting heart rate is healthy. Regular exercise can lower it further.");
    }

    if (stats.timeInModes?.sleep > 0) {
        insights.push("Good job tracking sleep! Consistent sleep monitoring helps optimize recovery.");
    }

    return insights.join("\n\n");
}

// ==================== EMAIL REPORTING ====================

app.post('/api/body-tracker/email/configure', (req, res) => {
    const { email, appPassword } = req.body;
    if (!email || !appPassword) {
        return res.status(400).json({ error: "Email and app password are required" });
    }

    emailConfig = {
        enabled: true,
        email,
        appPassword
    };

    console.log(`📧 Email configured for: ${email}`);
    res.json({ success: true, message: "Email configured successfully" });
});

app.get('/api/body-tracker/email/status', (req, res) => {
    res.json({
        configured: emailConfig.enabled,
        email: emailConfig.email ? emailConfig.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null
    });
});

app.post('/api/body-tracker/email/send-report', async (req, res) => {
    if (!emailConfig.enabled) {
        return res.status(400).json({ error: "Email not configured. Please configure email first." });
    }

    const stats = bodyTrackerDailyStats.readings;
    if (stats.length === 0) {
        return res.status(400).json({ error: "No data to report. Collect some data first." });
    }

    try {
        // Calculate stats
        const hrs = stats.map(s => s.hr);
        const hrvs = stats.map(s => s.hrv);
        const avgHR = (hrs.reduce((a, b) => a + b, 0) / hrs.length).toFixed(0);
        const minHR = Math.min(...hrs);
        const maxHR = Math.max(...hrs);
        const avgHRV = (hrvs.reduce((a, b) => a + b, 0) / hrvs.length).toFixed(0);

        // Get AI insights
        let insights = "AI insights not available.";
        if (ai) {
            try {
                const prompt = `Generate a brief health summary (max 200 words) for someone with:
- Average HR: ${avgHR} BPM, Resting HR: ${minHR} BPM, Max HR: ${maxHR} BPM
- Average HRV: ${avgHRV}ms
Be encouraging and provide 2-3 actionable tips.`;

                const result = await ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: prompt
                });
                insights = result.text;
            } catch (e) {
                console.error("AI insights error:", e);
            }
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailConfig.email,
                pass: emailConfig.appPassword
            }
        });

        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #1e293b; }
        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .insights { background: #fdf2f8; border-left: 4px solid #f43f5e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .insights h3 { margin: 0 0 10px; color: #be185d; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💓 Body Tracker Report</h1>
            <p>${today}</p>
        </div>
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${avgHR}</div>
                    <div class="stat-label">Avg Heart Rate (BPM)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${minHR}</div>
                    <div class="stat-label">Resting HR (BPM)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${maxHR}</div>
                    <div class="stat-label">Max HR (BPM)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgHRV}</div>
                    <div class="stat-label">Avg HRV (ms)</div>
                </div>
            </div>

            <div class="insights">
                <h3>🤖 AI Health Insights</h3>
                <p>${insights.replace(/\n/g, '<br>')}</p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
                Data collected from ${stats.length} readings over the monitoring period.
            </p>
        </div>
        <div class="footer">
            Generated by Body Tracker Dashboard<br>
            Keep tracking for better insights!
        </div>
    </div>
</body>
</html>`;

        await transporter.sendMail({
            from: emailConfig.email,
            to: emailConfig.email,
            subject: `💓 Your Body Tracker Report - ${today}`,
            html: htmlContent
        });

        console.log(`📧 Report sent to ${emailConfig.email}`);
        res.json({ success: true, message: "Report sent successfully!" });
    } catch (error) {
        console.error("Email send error:", error);
        res.status(500).json({ error: "Failed to send email. Check your credentials." });
    }
});

// ==================== ACTION PLANS API ENDPOINTS ====================

// Get all action plans
app.get('/api/action-plans', (req, res) => {
    const status = req.query.status || 'all';
    let plans = loadActionPlans();

    if (status !== 'all') {
        plans = plans.filter(p => p.status === status);
    }

    res.json({
        plans,
        count: plans.length,
        activeCount: plans.filter(p => p.status === 'active').length
    });
});

// Get a specific action plan
app.get('/api/action-plans/:id', (req, res) => {
    const { id } = req.params;
    const plans = loadActionPlans();
    const plan = plans.find(p => p.id === id);

    if (!plan) {
        return res.status(404).json({ error: "Action plan not found" });
    }

    res.json(plan);
});

// Create a new action plan (manual, not via AI)
app.post('/api/action-plans', (req, res) => {
    const { title, priority, items, summary } = req.body;

    if (!title || !priority) {
        return res.status(400).json({ error: "Title and priority are required" });
    }

    const plan = {
        id: `plan_${Date.now()}`,
        title,
        priority,
        items: items || [],
        summary: summary || '',
        created_at: new Date().toISOString(),
        status: 'active'
    };

    const plans = loadActionPlans();
    plans.push(plan);

    if (saveActionPlans(plans)) {
        console.log(`📋 Action plan created manually: ${plan.id} - ${plan.title}`);
        res.status(201).json(plan);
    } else {
        res.status(500).json({ error: "Failed to save action plan" });
    }
});

// Update an action plan
app.patch('/api/action-plans/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const plans = loadActionPlans();
    const planIndex = plans.findIndex(p => p.id === id);

    if (planIndex === -1) {
        return res.status(404).json({ error: "Action plan not found" });
    }

    // Update allowed fields
    const allowedFields = ['title', 'priority', 'items', 'summary', 'status'];
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            plans[planIndex][field] = updates[field];
        }
    }
    plans[planIndex].updated_at = new Date().toISOString();

    if (saveActionPlans(plans)) {
        console.log(`📋 Action plan updated: ${id}`);
        res.json(plans[planIndex]);
    } else {
        res.status(500).json({ error: "Failed to update action plan" });
    }
});

// Delete an action plan
app.delete('/api/action-plans/:id', (req, res) => {
    const { id } = req.params;
    let plans = loadActionPlans();
    const planIndex = plans.findIndex(p => p.id === id);

    if (planIndex === -1) {
        return res.status(404).json({ error: "Action plan not found" });
    }

    const deletedPlan = plans.splice(planIndex, 1)[0];

    if (saveActionPlans(plans)) {
        console.log(`📋 Action plan deleted: ${id}`);
        res.json({ message: "Action plan deleted", plan: deletedPlan });
    } else {
        res.status(500).json({ error: "Failed to delete action plan" });
    }
});

// ==================== FLEET EXPORT ENDPOINTS ====================

// CSV Export - Download fleet data as spreadsheet
app.get('/api/fleet/export/csv', (req, res) => {
    const range = req.query.range || 'current'; // current, 24h, 7d, 30d
    const devices = Object.values(fleetStatus);

    if (devices.length === 0) {
        return res.status(404).json({ error: "No fleet data available" });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fleet-export-${timestamp}.csv"`);

    // CSV header
    const headers = [
        'device_id', 'location_name', 'lat', 'lon', 'temp_cabinet', 'temp_ambient',
        'compressor_power_w', 'compressor_freq_hz', 'frost_level', 'cop',
        'door_open', 'defrost_on', 'fault', 'status', 'timestamp'
    ];

    let csvContent = headers.join(',') + '\n';

    // Helper to determine status
    const getStatus = (d) => {
        if (d.fault !== 'NORMAL' || d.temp_cabinet > -5) return 'CRITICAL';
        if (d.door_open || d.frost_level > 0.5 || d.temp_cabinet > -10) return 'WARNING';
        return 'HEALTHY';
    };

    // If range is 'current', export only latest readings
    if (range === 'current') {
        devices.forEach(d => {
            const row = [
                d.device_id,
                `"${d.location_name}"`,
                d.lat,
                d.lon,
                d.temp_cabinet,
                d.temp_ambient,
                d.compressor_power_w,
                d.compressor_freq_hz,
                d.frost_level,
                d.cop,
                d.door_open,
                d.defrost_on,
                d.fault,
                getStatus(d),
                d.timestamp
            ];
            csvContent += row.join(',') + '\n';
        });
    } else {
        // Export historical data
        const now = Date.now();
        const rangeMs = {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        const cutoff = now - (rangeMs[range] || rangeMs['24h']);

        Object.keys(freezerHistory).forEach(deviceId => {
            const history = freezerHistory[deviceId] || [];
            history.filter(d => new Date(d.timestamp).getTime() > cutoff).forEach(d => {
                const row = [
                    d.device_id,
                    `"${d.location_name}"`,
                    d.lat,
                    d.lon,
                    d.temp_cabinet,
                    d.temp_ambient,
                    d.compressor_power_w,
                    d.compressor_freq_hz,
                    d.frost_level,
                    d.cop,
                    d.door_open,
                    d.defrost_on,
                    d.fault,
                    getStatus(d),
                    d.timestamp
                ];
                csvContent += row.join(',') + '\n';
            });
        });
    }

    res.send(csvContent);
});

// PDF Report - Generate professional fleet status report
app.get('/api/fleet/export/pdf', (req, res) => {
    const devices = Object.values(fleetStatus);

    if (devices.length === 0) {
        return res.status(404).json({ error: "No fleet data available" });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fleet-report-${timestamp}.pdf"`);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Helper functions
    const getStatus = (d) => {
        if (d.fault !== 'NORMAL' || d.temp_cabinet > -5) return 'CRITICAL';
        if (d.door_open || d.frost_level > 0.5 || d.temp_cabinet > -10) return 'WARNING';
        return 'HEALTHY';
    };

    // Calculate summary stats
    const healthyCount = devices.filter(d => getStatus(d) === 'HEALTHY').length;
    const warningCount = devices.filter(d => getStatus(d) === 'WARNING').length;
    const criticalCount = devices.filter(d => getStatus(d) === 'CRITICAL').length;
    const temps = devices.map(d => d.temp_cabinet);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const powers = devices.map(d => d.compressor_power_w);
    const totalPower = powers.reduce((a, b) => a + b, 0);

    // --- Cover Page ---
    doc.fontSize(32).font('Helvetica-Bold').text('SUBZERO', { align: 'center' });
    doc.fontSize(24).font('Helvetica').text('Fleet Status Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666').text('Real-time Freezer Fleet Monitoring System', { align: 'center' });

    doc.addPage();

    // --- Executive Summary ---
    doc.fontSize(20).fillColor('#000').font('Helvetica-Bold').text('Executive Summary');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#3b82f6');
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica');

    // Summary boxes
    const summaryY = doc.y;

    // Total Units
    doc.fillColor('#1e293b').text('Total Units', 50, summaryY);
    doc.fontSize(28).font('Helvetica-Bold').text(devices.length.toString(), 50, summaryY + 15);

    // Healthy
    doc.fontSize(12).font('Helvetica').fillColor('#10b981').text('Healthy', 150, summaryY);
    doc.fontSize(28).font('Helvetica-Bold').text(healthyCount.toString(), 150, summaryY + 15);

    // Warning
    doc.fontSize(12).font('Helvetica').fillColor('#f59e0b').text('Warning', 250, summaryY);
    doc.fontSize(28).font('Helvetica-Bold').text(warningCount.toString(), 250, summaryY + 15);

    // Critical
    doc.fontSize(12).font('Helvetica').fillColor('#ef4444').text('Critical', 350, summaryY);
    doc.fontSize(28).font('Helvetica-Bold').text(criticalCount.toString(), 350, summaryY + 15);

    doc.moveDown(4);
    doc.fillColor('#000');

    // Fleet Stats
    doc.fontSize(14).font('Helvetica-Bold').text('Fleet Statistics');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Average Temperature: ${avgTemp.toFixed(1)}°C`);
    doc.text(`Total Power Consumption: ${totalPower.toFixed(0)}W`);
    doc.text(`Average Power per Unit: ${(totalPower / devices.length).toFixed(0)}W`);

    doc.moveDown(2);

    // --- Fleet Status Table ---
    doc.fontSize(20).font('Helvetica-Bold').text('Fleet Status by Unit');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#3b82f6');
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const colWidths = [100, 90, 60, 60, 60, 60, 65];
    const headers = ['Device ID', 'Location', 'Temp', 'Power', 'Frost', 'Door', 'Status'];

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
    let xPos = 50;
    headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
        xPos += colWidths[i];
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    // Table rows
    doc.font('Helvetica').fontSize(9);

    // Sort devices: critical first, then warning, then healthy
    const sortedDevices = [...devices].sort((a, b) => {
        const statusOrder = { 'CRITICAL': 0, 'WARNING': 1, 'HEALTHY': 2 };
        return statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
    });

    sortedDevices.forEach((d, idx) => {
        const status = getStatus(d);
        const statusColor = status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : '#10b981';

        // Check if we need a new page
        if (doc.y > 700) {
            doc.addPage();
            doc.y = 50;
        }

        const rowY = doc.y;
        xPos = 50;

        doc.fillColor('#1e293b');
        doc.text(d.device_id, xPos, rowY, { width: colWidths[0] }); xPos += colWidths[0];
        doc.text(d.location_name, xPos, rowY, { width: colWidths[1] }); xPos += colWidths[1];

        // Temperature with color coding
        const tempColor = d.temp_cabinet > -10 ? '#ef4444' : d.temp_cabinet > -15 ? '#f59e0b' : '#1e293b';
        doc.fillColor(tempColor).text(`${d.temp_cabinet.toFixed(1)}°C`, xPos, rowY, { width: colWidths[2] }); xPos += colWidths[2];

        doc.fillColor('#1e293b');
        doc.text(`${d.compressor_power_w.toFixed(0)}W`, xPos, rowY, { width: colWidths[3] }); xPos += colWidths[3];
        doc.text(`${(d.frost_level * 100).toFixed(0)}%`, xPos, rowY, { width: colWidths[4] }); xPos += colWidths[4];
        doc.text(d.door_open ? 'OPEN' : 'Closed', xPos, rowY, { width: colWidths[5] }); xPos += colWidths[5];

        doc.fillColor(statusColor).text(status, xPos, rowY, { width: colWidths[6] });

        doc.moveDown(0.8);
    });

    doc.moveDown(2);

    // --- Alerts Section ---
    const alertDevices = devices.filter(d => getStatus(d) !== 'HEALTHY');

    if (alertDevices.length > 0) {
        if (doc.y > 600) doc.addPage();

        doc.fontSize(20).font('Helvetica-Bold').fillColor('#000').text('Active Alerts');
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ef4444');
        doc.moveDown(1);

        alertDevices.forEach(d => {
            const status = getStatus(d);
            const bgColor = status === 'CRITICAL' ? '#fef2f2' : '#fffbeb';
            const borderColor = status === 'CRITICAL' ? '#ef4444' : '#f59e0b';

            // Alert box
            doc.rect(50, doc.y, 495, 50).fillAndStroke(bgColor, borderColor);

            doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold');
            doc.text(`${d.device_id} - ${d.location_name}`, 60, doc.y - 40);

            doc.fontSize(10).font('Helvetica').fillColor('#475569');
            const issues = [];
            if (d.fault !== 'NORMAL') issues.push(`Fault: ${d.fault}`);
            if (d.temp_cabinet > -10) issues.push(`High Temp: ${d.temp_cabinet.toFixed(1)}°C`);
            if (d.door_open) issues.push('Door Open');
            if (d.frost_level > 0.5) issues.push(`High Frost: ${(d.frost_level * 100).toFixed(0)}%`);

            doc.text(issues.join(' | '), 60, doc.y - 20);
            doc.moveDown(3);
        });
    }

    // --- Footer ---
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#94a3b8').font('Helvetica');
    doc.text('Subzero Fleet Command - Real-time Freezer Monitoring System', 50, 750, { align: 'center' });
    doc.text(`Report generated at ${new Date().toISOString()}`, { align: 'center' });

    doc.end();
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
            aiInitialized: !!ai,
            model: GEMINI_MODEL,
            toolsAvailable: ['log_action_plan', 'get_action_plans', 'send_email']
        },
        actionPlans: {
            activeCount: getActiveActionPlans().length,
            totalCount: loadActionPlans().length
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

    // Send home freezer data and auto-start simulator
    socket.emit('initialHomeFreezerData', {
        history: homeFreezerHistory,
        lastDataReceived: lastHomeFreezerData,
        simulatorRunning: homeFreezerSimulatorRunning
    });

    // Auto-start home freezer simulator when first client connects
    if (!homeFreezerSimulatorRunning) {
        startHomeFreezerSimulator();
    }

    // Send home freezer 2 data (FREEZER_MAIN device)
    socket.emit('initialHomeFreezer2Data', {
        history: homeFreezer2History,
        lastDataReceived: lastHomeFreezer2Data
    });

    // Send body tracker data and auto-start simulator
    socket.emit('initialBodyTrackerData', {
        history: bodyTrackerHistory,
        lastDataReceived: lastBodyTrackerData,
        simulatorRunning: bodyTrackerSimulatorRunning
    });

    // Auto-start body tracker simulator when first client connects
    if (!bodyTrackerSimulatorRunning) {
        startBodyTrackerSimulator();
    }

    // Allow clients to manually control simulator
    socket.on('startBodyTrackerSimulator', () => {
        startBodyTrackerSimulator();
    });

    socket.on('stopBodyTrackerSimulator', () => {
        stopBodyTrackerSimulator();
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
    console.log(`   - sensor_type: 'motion_sensor' or 'freezer_monitor' → Home Freezer (Tab 1)`);
    console.log(`   - sensor_type: 'freezer_monitor' + device_id: 'FREEZER_MAIN' → Home Freezer (Tab 2)`);
    console.log(`   - sensor_type: 'body_tracker' → Body Tracker Dashboard`);
    console.log(`👉 Dashboard: http://localhost:4001`);
    console.log(`👉 Command Center: http://localhost:4001/command-center`);
    console.log(`👉 Subzero Fleet: http://localhost:4001/freezer`);
    console.log(`👉 Home Freezers: http://localhost:4001/home-freezer (tabbed view for both freezers)`);
    console.log(`👉 Body Tracker: http://localhost:4001/body-tracker`);
});
