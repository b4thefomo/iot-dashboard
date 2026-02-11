require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
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
const puppeteer = require('puppeteer');
const archiver = require('archiver');

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

// Load latest fleet readings from Supabase on server startup
async function loadFleetDataFromSupabase() {
    if (!supabase) {
        console.log("⚠️ Supabase not configured - fleet data will start empty");
        return;
    }

    try {
        console.log("📥 Loading fleet data from Supabase...");

        // Get distinct device IDs that have readings
        const { data: devices, error: devicesError } = await supabase
            .from('readings')
            .select('device_id')
            .order('timestamp', { ascending: false });

        if (devicesError) throw devicesError;

        // Get unique device IDs
        const uniqueDevices = [...new Set(devices.map(d => d.device_id))];
        console.log(`   Found ${uniqueDevices.length} devices with historical data`);

        // For each device, get the latest reading
        for (const device_id of uniqueDevices) {
            const { data: latestReading, error: readingError } = await supabase
                .from('readings')
                .select('*')
                .eq('device_id', device_id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (readingError) {
                console.error(`   ❌ Error loading ${device_id}:`, readingError.message);
                continue;
            }

            if (latestReading) {
                // Get device location info with coordinates
                const { data: deviceInfo } = await supabase
                    .from('devices')
                    .select('*, locations(name, lat, lon)')
                    .eq('device_id', device_id)
                    .single();

                // Reconstruct the fleet status entry
                fleetStatus[device_id] = {
                    device_id: latestReading.device_id,
                    timestamp: latestReading.timestamp,
                    location_name: deviceInfo?.locations?.name || 'Unknown',
                    lat: deviceInfo?.locations?.lat ? parseFloat(deviceInfo.locations.lat) : 54.5,
                    lon: deviceInfo?.locations?.lon ? parseFloat(deviceInfo.locations.lon) : -3.5,
                    temp_cabinet: parseFloat(latestReading.temp_cabinet),
                    temp_ambient: latestReading.temp_ambient ? parseFloat(latestReading.temp_ambient) : null,
                    compressor_power_w: latestReading.compressor_power_w ? parseFloat(latestReading.compressor_power_w) : 0,
                    compressor_freq_hz: latestReading.compressor_freq_hz ? parseFloat(latestReading.compressor_freq_hz) : 0,
                    frost_level: latestReading.frost_level ? parseFloat(latestReading.frost_level) : 0,
                    cop: latestReading.cop ? parseFloat(latestReading.cop) : 0,
                    door_open: latestReading.door_open || false,
                    defrost_on: latestReading.defrost_on || false,
                    fault: latestReading.fault || 'NORMAL',
                    fault_id: latestReading.fault_id || 0
                };

                // Initialize freezer history array
                if (!freezerHistory[device_id]) {
                    freezerHistory[device_id] = [];
                }
            }
        }

        const loadedCount = Object.keys(fleetStatus).length;
        if (loadedCount > 0) {
            lastFleetDataReceived = new Date();
            console.log(`✅ Loaded ${loadedCount} devices from Supabase`);
        } else {
            console.log("   No fleet data found in Supabase");
        }
    } catch (error) {
        console.error("❌ Error loading fleet data from Supabase:", error.message);
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

        // Persist to Supabase for Guardian Ledger reports (async, non-blocking)
        storeHomeFreezerReading(normalizedHomeFreezer).catch(err => {
            console.error("Failed to store home freezer reading:", err.message);
        });

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

    } else if (sensorType === 'chest_strap') {
        // BLE chest strap heart rate data — normalize into BodyTrackerReading format
        console.log("💓 CHEST STRAP BLE:", {
            device_id: data.device_id,
            hr: data.heart_rate_bpm + " BPM",
            hrv: data.hrv_rmssd_ms + "ms",
            contact: data.contact_detected
        });

        const hrZone = data.heart_rate_zone || 'rest';

        const normalizedChestStrap = {
            device_id: data.device_id || 'BLE_CHEST_STRAP',
            timestamp: data.server_timestamp,
            raw_timestamp: data.timestamp,
            // Real-time vitals (from BLE)
            heart_rate_bpm: data.heart_rate_bpm,
            heart_rate_zone: hrZone,
            cadence_spm: 0,
            battery_percent: data.battery_percent || 100,
            // Form & Physics (not available from chest strap)
            torso_lean_deg: 0,
            vertical_oscillation_cm: 0,
            impact_g_force: 0,
            torso_rotation_deg: 0,
            // Advanced health (HRV computed from RR intervals)
            hrv_rmssd_ms: data.hrv_rmssd_ms || 0,
            arrhythmia_flag: 'normal',
            respiration_rate: 0,
            // Raw data (not available from basic chest strap)
            ecg_waveform: [],
            accel_x: 0,
            accel_y: 0,
            accel_z: 0,
            // Session metrics
            total_steps: 0,
            calories_burned: 0,
            session_duration_sec: data.session_duration_sec || 0,
            avg_heart_rate: data.avg_heart_rate || data.heart_rate_bpm,
            max_heart_rate: data.max_heart_rate || data.heart_rate_bpm
        };

        bodyTrackerHistory.push(normalizedChestStrap);
        if (bodyTrackerHistory.length > MAX_HISTORY) bodyTrackerHistory.shift();

        lastBodyTrackerData = new Date();
        io.emit('bodyTrackerData', normalizedChestStrap);
        addToMasterHistory(normalizedChestStrap, 'chest_strap');

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

// ==================== GUARDIAN LEDGER - AUDIT REPORTING ENGINE ====================

const crypto = require('crypto');

// Helper: Store home freezer reading to Supabase
async function storeHomeFreezerReading(readingData) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('home_freezer_readings')
            .insert({
                device_id: readingData.device_id,
                timestamp: readingData.timestamp,
                temp_c: readingData.temp_c,
                door_status: readingData.door_status,
                is_door_open: readingData.is_door_open,
                accel_x: readingData.accel_x,
                accel_y: readingData.accel_y,
                accel_z: readingData.accel_z,
                firmware_version: readingData.firmware_version
            })
            .select()
            .single();
        if (error) {
            console.error("❌ Error storing home freezer reading:", error.message);
            return null;
        }
        return data;
    } catch (error) {
        console.error("❌ Supabase home freezer reading error:", error.message);
        return null;
    }
}

// Mean Kinetic Temperature (MKT) Calculation
// Based on the Arrhenius equation - accounts for thermal history
function calculateMKT(temperatures, deltaH = 83144) {
    if (!temperatures || temperatures.length === 0) return null;

    const R = 8.314; // Universal gas constant (J/mol·K)
    const validTemps = temperatures.filter(t => t !== null && t !== undefined && t !== -127);

    if (validTemps.length === 0) return null;

    // Convert to Kelvin and calculate exponential sum
    const tempKelvin = validTemps.map(t => t + 273.15);
    const expSum = tempKelvin.reduce((sum, T) => sum + Math.exp(-deltaH / (R * T)), 0);

    // MKT formula
    const mkt = (-deltaH / (R * Math.log(expSum / validTemps.length))) - 273.15;

    return {
        mkt: parseFloat(mkt.toFixed(2)),
        sampleCount: validTemps.length,
        interpretation: mkt <= -15 ? 'PASS' : mkt <= -10 ? 'MARGINAL' : 'FAIL',
        formula: 'ΔH/R / ln(Σexp(-ΔH/RT)/n)'
    };
}

// Vibration Health Index (VHI) Calculation
// Analyzes accelerometer data to assess compressor health
function calculateVibrationHealthIndex(readings) {
    if (!readings || readings.length < 10) {
        return { index: null, trend: 'insufficient_data', diagnosis: 'Need at least 10 readings for analysis' };
    }

    // Calculate magnitude for each reading
    const magnitudes = readings.map(r => {
        const x = r.accel_x || 0;
        const y = r.accel_y || 0;
        const z = r.accel_z || 0;
        return Math.sqrt(x * x + y * y + z * z);
    });

    // Calculate statistics
    const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    const variance = magnitudes.reduce((sum, m) => sum + Math.pow(m - avgMagnitude, 2), 0) / magnitudes.length;
    const stdDev = Math.sqrt(variance);
    const maxMagnitude = Math.max(...magnitudes);

    // Detect peaks (readings > 2 std devs from mean)
    const peakCount = magnitudes.filter(m => m > avgMagnitude + 2 * stdDev).length;
    const peakRatio = peakCount / magnitudes.length;

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(magnitudes.length / 2);
    const firstHalfAvg = magnitudes.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg = magnitudes.slice(midpoint).reduce((a, b) => a + b, 0) / (magnitudes.length - midpoint);
    const trendPercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    // Calculate health index (0-100)
    // Deductions: high variance, many peaks, degrading trend
    let healthIndex = 100;

    // Variance penalty (normal variance ~0.01-0.05 for stationary compressor)
    if (stdDev > 0.1) healthIndex -= 15;
    else if (stdDev > 0.05) healthIndex -= 5;

    // Peak penalty
    if (peakRatio > 0.1) healthIndex -= 20;
    else if (peakRatio > 0.05) healthIndex -= 10;

    // Trend penalty (if getting worse)
    if (trendPercent > 20) healthIndex -= 15;
    else if (trendPercent > 10) healthIndex -= 5;

    // Max magnitude penalty
    if (maxMagnitude > 2.0) healthIndex -= 10;
    else if (maxMagnitude > 1.5) healthIndex -= 5;

    healthIndex = Math.max(0, Math.min(100, healthIndex));

    // Determine trend label
    let trend = 'stable';
    if (trendPercent > 10) trend = 'degrading';
    else if (trendPercent < -10) trend = 'improving';

    // Generate diagnosis
    let diagnosis = 'Compressor operating normally.';
    if (healthIndex < 50) {
        diagnosis = 'Significant vibration anomalies detected. Schedule maintenance inspection.';
    } else if (healthIndex < 70) {
        diagnosis = 'Minor vibration irregularities observed. Monitor closely.';
    } else if (healthIndex < 85) {
        diagnosis = 'Slight increase in vibration patterns. Continue normal monitoring.';
    }

    return {
        index: healthIndex,
        trend,
        diagnosis,
        stats: {
            avgMagnitude: parseFloat(avgMagnitude.toFixed(4)),
            stdDev: parseFloat(stdDev.toFixed(4)),
            maxMagnitude: parseFloat(maxMagnitude.toFixed(4)),
            peakCount,
            trendPercent: parseFloat(trendPercent.toFixed(1))
        }
    };
}

// Night Gap Analysis (19:00 - 08:00)
// Analyzes temperature stability during unstaffed hours
function analyzeNightGap(readings, nightStart = 19, nightEnd = 8) {
    if (!readings || readings.length === 0) {
        return { score: null, analysis: 'No data available' };
    }

    // Filter for night hours only
    const nightReadings = readings.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= nightStart || hour < nightEnd;
    });

    if (nightReadings.length < 5) {
        return { score: null, analysis: 'Insufficient night data for analysis' };
    }

    const temps = nightReadings.map(r => r.temp_c).filter(t => t !== null && t !== undefined && t !== -127);

    if (temps.length === 0) {
        return { score: null, analysis: 'No valid temperature readings during night hours' };
    }

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const variance = temps.reduce((sum, t) => sum + Math.pow(t - avgTemp, 2), 0) / temps.length;
    const stdDev = Math.sqrt(variance);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp;

    // Check for door events at night
    const nightDoorEvents = nightReadings.filter(r => r.is_door_open).length;

    // Calculate stability score (0-100)
    let score = 100;

    // Temperature variance penalty
    if (stdDev > 2) score -= 30;
    else if (stdDev > 1) score -= 15;
    else if (stdDev > 0.5) score -= 5;

    // Temperature range penalty
    if (tempRange > 5) score -= 20;
    else if (tempRange > 3) score -= 10;
    else if (tempRange > 2) score -= 5;

    // Door event penalty
    if (nightDoorEvents > 0) score -= (nightDoorEvents * 5);

    // Out-of-range penalty
    if (avgTemp > -15 || avgTemp < -25) score -= 15;

    score = Math.max(0, Math.min(100, score));

    let analysis = 'Excellent temperature stability during unstaffed hours.';
    if (score < 60) {
        analysis = 'Significant temperature fluctuations during night hours. Investigation recommended.';
    } else if (score < 75) {
        analysis = 'Moderate temperature variance overnight. Check door seals and thermostat.';
    } else if (score < 90) {
        analysis = 'Good stability with minor fluctuations.';
    }

    return {
        score: parseFloat(score.toFixed(1)),
        analysis,
        stats: {
            avgTemp: parseFloat(avgTemp.toFixed(2)),
            variance: parseFloat(variance.toFixed(4)),
            tempRange: parseFloat(tempRange.toFixed(2)),
            minTemp: parseFloat(minTemp.toFixed(2)),
            maxTemp: parseFloat(maxTemp.toFixed(2)),
            nightReadingCount: temps.length,
            doorEventsAtNight: nightDoorEvents
        },
        period: `${nightStart}:00 - ${nightEnd}:00`
    };
}

// Detect and log temperature excursions
async function detectExcursions(readings, deviceId) {
    if (!readings || readings.length < 2) return [];

    const excursions = [];
    let currentExcursion = null;
    const EXCURSION_THRESHOLD = -10; // Temperature above this is an excursion

    for (let i = 0; i < readings.length; i++) {
        const reading = readings[i];
        const temp = reading.temp_c;

        if (temp > EXCURSION_THRESHOLD && !currentExcursion) {
            // Start of excursion
            currentExcursion = {
                device_id: deviceId,
                start_time: reading.timestamp,
                peak_temp_c: temp,
                excursion_type: reading.is_door_open ? 'door_open' : 'high_temp'
            };
        } else if (temp > EXCURSION_THRESHOLD && currentExcursion) {
            // Continuing excursion - update peak
            if (temp > currentExcursion.peak_temp_c) {
                currentExcursion.peak_temp_c = temp;
            }
        } else if (temp <= EXCURSION_THRESHOLD && currentExcursion) {
            // End of excursion
            currentExcursion.end_time = reading.timestamp;
            const duration = (new Date(currentExcursion.end_time) - new Date(currentExcursion.start_time)) / 60000;
            currentExcursion.duration_minutes = Math.round(duration);
            currentExcursion.severity = duration > 60 ? 'critical' : duration > 15 ? 'moderate' : 'minor';
            currentExcursion.resolved = true;
            excursions.push(currentExcursion);
            currentExcursion = null;
        }
    }

    // Handle ongoing excursion
    if (currentExcursion) {
        currentExcursion.resolved = false;
        excursions.push(currentExcursion);
    }

    return excursions;
}

// Generate AI summaries for the report
async function generateReportSummaries(reportData, deviceId) {
    if (!ai) {
        return {
            executiveSummary: 'AI analysis unavailable - API key not configured.',
            engineerBrief: 'AI analysis unavailable - API key not configured.'
        };
    }

    try {
        const executivePrompt = `Generate a brief executive summary (2-3 sentences) for a freezer compliance report.

Device: ${deviceId}
Report Period: ${reportData.period}
Mean Kinetic Temperature: ${reportData.mkt?.mkt}°C (${reportData.mkt?.interpretation})
Vibration Health Index: ${reportData.vhi?.index}/100 (${reportData.vhi?.trend})
Night Stability Score: ${reportData.nightGap?.score}%
Total Excursions: ${reportData.excursions?.length || 0}

Write a professional summary focusing on compliance status and any concerns.`;

        const engineerPrompt = `Generate a brief engineer's inspection checklist for a freezer maintenance technician.

Device: ${deviceId}
Vibration Health: ${reportData.vhi?.index}/100
Vibration Trend: ${reportData.vhi?.trend}
Diagnosis: ${reportData.vhi?.diagnosis}
Temperature Stability: ${reportData.nightGap?.analysis}
Recent Excursions: ${reportData.excursions?.length || 0}

Provide:
1. System status (1 line)
2. Top 3 inspection priorities (bulleted)
3. Recommended maintenance schedule
4. Parts to monitor (if any)`;

        const [execResult, engResult] = await Promise.all([
            ai.models.generateContent({ model: GEMINI_MODEL, contents: executivePrompt }),
            ai.models.generateContent({ model: GEMINI_MODEL, contents: engineerPrompt })
        ]);

        return {
            executiveSummary: execResult.text,
            engineerBrief: engResult.text
        };
    } catch (error) {
        console.error("AI summary generation error:", error);
        return {
            executiveSummary: 'Unable to generate AI summary.',
            engineerBrief: 'Unable to generate AI brief.'
        };
    }
}

// API: Get monthly data for a device
app.get('/api/home-freezer/:device/monthly', async (req, res) => {
    const { device } = req.params;
    const { month, year } = req.query;

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Try to get from Supabase first
    if (supabase) {
        try {
            const { data: readings, error } = await supabase
                .from('home_freezer_readings')
                .select('*')
                .eq('device_id', device)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true });

            if (!error && readings && readings.length > 0) {
                const temps = readings.map(r => parseFloat(r.temp_c));
                const mkt = calculateMKT(temps);
                const vhi = calculateVibrationHealthIndex(readings);
                const nightGap = analyzeNightGap(readings);
                const excursions = await detectExcursions(readings, device);

                return res.json({
                    device,
                    period: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
                    readingCount: readings.length,
                    mkt,
                    vhi,
                    nightGap,
                    excursions,
                    source: 'supabase'
                });
            }
        } catch (error) {
            console.error("Supabase query error:", error);
        }
    }

    // Fallback to in-memory data
    const history = device === 'FREEZER_MAIN' ? homeFreezer2History : homeFreezerHistory;
    const filteredHistory = history.filter(r => {
        const ts = new Date(r.timestamp);
        return ts >= startDate && ts <= endDate;
    });

    if (filteredHistory.length === 0) {
        return res.status(404).json({ error: 'No data found for the specified period' });
    }

    const temps = filteredHistory.map(r => r.temp_c);
    const mkt = calculateMKT(temps);
    const vhi = calculateVibrationHealthIndex(filteredHistory);
    const nightGap = analyzeNightGap(filteredHistory);
    const excursions = await detectExcursions(filteredHistory, device);

    res.json({
        device,
        period: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        readingCount: filteredHistory.length,
        mkt,
        vhi,
        nightGap,
        excursions,
        source: 'memory'
    });
});

// API: Generate a new audit report
app.post('/api/home-freezer/reports/generate', async (req, res) => {
    const { device_id, month, year, options = {} } = req.body;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    let readings = [];

    // Fetch readings
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('home_freezer_readings')
                .select('*')
                .eq('device_id', device_id)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true });

            if (!error && data) readings = data;
        } catch (error) {
            console.error("Supabase query error:", error);
        }
    }

    // Fallback to in-memory
    if (readings.length === 0) {
        const history = device_id === 'FREEZER_MAIN' ? homeFreezer2History : homeFreezerHistory;
        readings = history.filter(r => {
            const ts = new Date(r.timestamp);
            return ts >= startDate && ts <= endDate;
        });
    }

    if (readings.length === 0) {
        return res.status(404).json({ error: 'No data found for the specified period' });
    }

    // Calculate metrics
    const temps = readings.map(r => parseFloat(r.temp_c) || r.temp_c);
    const mkt = calculateMKT(temps);
    const vhi = calculateVibrationHealthIndex(readings);
    const nightGap = analyzeNightGap(readings);
    const excursions = await detectExcursions(readings, device_id);

    // Determine compliance status
    let complianceStatus = 'compliant';
    if (mkt && mkt.interpretation === 'FAIL') complianceStatus = 'non_compliant';
    else if (mkt && mkt.interpretation === 'MARGINAL') complianceStatus = 'warning';
    else if (excursions.filter(e => e.severity === 'critical').length > 0) complianceStatus = 'warning';

    const reportData = {
        device_id,
        period,
        readingCount: readings.length,
        mkt,
        vhi,
        nightGap,
        excursions,
        complianceStatus,
        generatedAt: new Date().toISOString()
    };

    // Generate AI summaries if enabled
    if (options.includeAISummaries !== false) {
        const summaries = await generateReportSummaries(reportData, device_id);
        reportData.executiveSummary = summaries.executiveSummary;
        reportData.engineerBrief = summaries.engineerBrief;
    }

    // Generate audit hash
    const auditHash = crypto.createHash('sha256')
        .update(JSON.stringify(reportData))
        .digest('hex')
        .substring(0, 16);
    reportData.auditHash = auditHash;

    // Store report in Supabase
    if (supabase) {
        try {
            await supabase.from('monthly_reports').insert({
                device_id,
                report_month: startDate.toISOString().split('T')[0],
                mkt_celsius: mkt?.mkt,
                vibration_health_index: vhi?.index,
                night_stability_score: nightGap?.score,
                total_excursions: excursions.length,
                excursion_minutes: excursions.reduce((sum, e) => sum + (e.duration_minutes || 0), 0),
                compliance_status: complianceStatus,
                ai_executive_summary: reportData.executiveSummary,
                ai_engineer_brief: reportData.engineerBrief,
                report_data: reportData,
                audit_hash: auditHash
            });
        } catch (error) {
            console.error("Error storing report:", error);
        }
    }

    res.json(reportData);
});

// API: Get report history
app.get('/api/home-freezer/reports/history', async (req, res) => {
    const { device_id, limit = 10 } = req.query;

    if (!supabase) {
        return res.json({ reports: [], message: 'Supabase not configured' });
    }

    try {
        let query = supabase
            .from('monthly_reports')
            .select('id, device_id, report_month, mkt_celsius, vibration_health_index, compliance_status, generated_at, audit_hash')
            .order('report_month', { ascending: false })
            .limit(parseInt(limit));

        if (device_id) {
            query = query.eq('device_id', device_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ reports: data || [] });
    } catch (error) {
        console.error("Error fetching report history:", error);
        res.status(500).json({ error: 'Failed to fetch report history' });
    }
});

// API: Download PDF report
app.get('/api/home-freezer/reports/:id/download', async (req, res) => {
    const { id } = req.params;

    let reportData = null;

    // Try to fetch from Supabase
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('monthly_reports')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                reportData = data.report_data;
                reportData.device_id = data.device_id;
                reportData.auditHash = data.audit_hash;
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }

    if (!reportData) {
        return res.status(404).json({ error: 'Report not found' });
    }

    generateGuardianLedgerPDF(res, reportData);
});

// API: Get report data as JSON for Puppeteer rendering
app.get('/api/home-freezer/reports/data', async (req, res) => {
    const { device_id, month, year } = req.query;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    let readings = [];

    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('home_freezer_readings')
                .select('*')
                .eq('device_id', device_id)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true });

            if (!error && data) readings = data;
        } catch (error) {
            console.error("Supabase query error:", error);
        }
    }

    if (readings.length === 0) {
        const history = device_id === 'FREEZER_MAIN' ? homeFreezer2History : homeFreezerHistory;
        readings = history.filter(r => {
            const ts = new Date(r.timestamp);
            return ts >= startDate && ts <= endDate;
        });
    }

    if (readings.length === 0) {
        return res.status(404).json({ error: 'No data found for the specified period' });
    }

    const temps = readings.map(r => parseFloat(r.temp_c) || r.temp_c);
    const mkt = calculateMKT(temps);
    const vhi = calculateVibrationHealthIndex(readings);
    const nightGap = analyzeNightGap(readings);
    const excursions = await detectExcursions(readings, device_id);

    let complianceStatus = 'compliant';
    if (mkt && mkt.interpretation === 'FAIL') complianceStatus = 'non_compliant';
    else if (mkt && mkt.interpretation === 'MARGINAL') complianceStatus = 'warning';

    const reportData = {
        device_id,
        period,
        readingCount: readings.length,
        mkt,
        vhi,
        nightGap,
        excursions: excursions.map(e => ({
            id: e.id || `exc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: e.start_time,
            endTime: e.end_time || new Date(new Date(e.start_time).getTime() + (e.duration_minutes || 15) * 60000).toISOString(),
            duration: e.duration_minutes || 15,
            peakTemp: e.peak_temp_c,
            severity: e.severity || 'minor',
            aiDiagnosis: e.ai_diagnosis || 'Door-open event detected. Temperature recovered within expected timeframe.'
        })),
        complianceStatus,
        generatedAt: new Date().toISOString(),
        temperatureData: readings.slice(0, 200).map(r => ({
            timestamp: r.timestamp,
            temp: parseFloat(r.temp_c) || r.temp_c
        }))
    };

    const summaries = await generateReportSummaries(reportData, device_id);
    reportData.executiveSummary = summaries.executiveSummary;
    reportData.engineerBrief = summaries.engineerBrief;

    reportData.auditHash = crypto.createHash('sha256')
        .update(JSON.stringify(reportData))
        .digest('hex')
        .substring(0, 16);

    res.json(reportData);
});

// Puppeteer PDF generation function
async function generatePuppeteerPDF(deviceId, month, year) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set a larger viewport for better rendering
        await page.setViewport({ width: 794, height: 1123 }); // A4 at 96dpi

        const dashboardPort = process.env.DASHBOARD_PORT || 4001;
        const url = `http://localhost:${dashboardPort}/reports/render/guardian-ledger/${deviceId}?month=${month}&year=${year}`;

        console.log(`📄 Navigating to: ${url}`);

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for the report to be ready
        await page.waitForSelector('[data-report-ready="true"]', { timeout: 30000 });

        // Give charts a moment to render
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            },
            preferCSSPageSize: true
        });

        console.log(`✅ PDF generated successfully (${pdf.length} bytes)`);
        return pdf;
    } finally {
        await browser.close();
    }
}

// API: Generate PDF on-demand using Puppeteer
app.post('/api/home-freezer/reports/pdf', async (req, res) => {
    const { device_id, month, year, format = 'both' } = req.body;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    // First generate the report data
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    let readings = [];

    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('home_freezer_readings')
                .select('*')
                .eq('device_id', device_id)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true });

            if (!error && data) readings = data;
        } catch (error) {
            console.error("Supabase query error:", error);
        }
    }

    if (readings.length === 0) {
        const history = device_id === 'FREEZER_MAIN' ? homeFreezer2History : homeFreezerHistory;
        readings = history.filter(r => {
            const ts = new Date(r.timestamp);
            return ts >= startDate && ts <= endDate;
        });
    }

    if (readings.length === 0) {
        return res.status(404).json({ error: 'No data found for the specified period' });
    }

    const temps = readings.map(r => parseFloat(r.temp_c) || r.temp_c);
    const mkt = calculateMKT(temps);
    const vhi = calculateVibrationHealthIndex(readings);
    const nightGap = analyzeNightGap(readings);
    const excursions = await detectExcursions(readings, device_id);

    let complianceStatus = 'compliant';
    if (mkt && mkt.interpretation === 'FAIL') complianceStatus = 'non_compliant';
    else if (mkt && mkt.interpretation === 'MARGINAL') complianceStatus = 'warning';

    const reportData = {
        device_id,
        period,
        readingCount: readings.length,
        mkt,
        vhi,
        nightGap,
        excursions,
        complianceStatus,
        generatedAt: new Date().toISOString()
    };

    const summaries = await generateReportSummaries(reportData, device_id);
    reportData.executiveSummary = summaries.executiveSummary;
    reportData.engineerBrief = summaries.engineerBrief;

    reportData.auditHash = crypto.createHash('sha256')
        .update(JSON.stringify(reportData))
        .digest('hex')
        .substring(0, 16);

    // Generate CSV data from readings
    const csvHeaders = [
        'timestamp',
        'device_id',
        'temp_c',
        'accel_x',
        'accel_y',
        'accel_z',
        'accel_magnitude',
        'battery_percent',
        'wifi_rssi'
    ].join(',');

    const csvRows = readings.map(r => [
        r.timestamp,
        r.device_id || device_id,
        r.temp_c,
        r.accel_x || '',
        r.accel_y || '',
        r.accel_z || '',
        r.accel_magnitude || '',
        r.battery_percent || '',
        r.wifi_rssi || ''
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Handle format selection
    try {
        if (format === 'csv') {
            // CSV only
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="sensor-data-${device_id}-${period}.csv"`);
            return res.send(csvContent);
        }

        // Generate PDF (needed for 'pdf' or 'both' formats)
        const pdf = await generatePuppeteerPDF(device_id, targetMonth, targetYear);
        const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

        if (format === 'pdf') {
            // PDF only
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="guardian-ledger-${device_id}-${period}.pdf"`);
            return res.send(pdfBuffer);
        }

        // Both (ZIP)
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="guardian-ledger-${device_id}-${period}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Failed to create archive' });
        });

        archive.pipe(res);

        // Add PDF to archive
        archive.append(pdfBuffer, { name: `guardian-ledger-${device_id}-${period}.pdf` });

        // Add CSV to archive
        archive.append(csvContent, { name: `sensor-data-${device_id}-${period}.csv` });

        // Add a summary JSON file
        const summaryJson = JSON.stringify({
            reportInfo: {
                deviceId: device_id,
                period: period,
                generatedAt: reportData.generatedAt,
                auditHash: reportData.auditHash
            },
            metrics: {
                mkt: reportData.mkt,
                vibrationHealthIndex: reportData.vhi,
                nightGapAnalysis: reportData.nightGap,
                complianceStatus: reportData.complianceStatus
            },
            excursions: reportData.excursions,
            dataStats: {
                totalReadings: readings.length,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        }, null, 2);

        archive.append(summaryJson, { name: `report-summary-${device_id}-${period}.json` });

        await archive.finalize();

    } catch (error) {
        console.error('Puppeteer PDF generation failed:', error);
        // Fallback to PDFKit-based generation (PDF only, no ZIP)
        console.log('Falling back to PDFKit...');
        generateGuardianLedgerPDF(res, reportData);
    }
});

// Legacy PDF Generation function for Guardian Ledger reports (PDFKit fallback)
function generateGuardianLedgerPDF(res, reportData) {
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="guardian-ledger-${reportData.device_id}-${reportData.period}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // --- Cover Page ---
    doc.fontSize(36).font('Helvetica-Bold').fillColor('#0891b2').text('GUARDIAN', { align: 'center' });
    doc.fontSize(36).fillColor('#164e63').text('LEDGER', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(16).font('Helvetica').fillColor('#475569').text('Thermal & Mechanical Integrity Report', { align: 'center' });
    doc.moveDown(3);

    // Snowflake icon (simple text representation)
    doc.fontSize(72).fillColor('#22d3ee').text('❄', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).fillColor('#1e293b').font('Helvetica');
    doc.text(`Report Period: ${reportData.period}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Device: ${reportData.device_id}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Audit Trail: ${reportData.auditHash}...`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });

    doc.addPage();

    // --- Executive Summary ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0891b2').text('Executive Summary');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0891b2');
    doc.moveDown(1);

    // Compliance badge
    const complianceColor = reportData.complianceStatus === 'compliant' ? '#10b981' :
                           reportData.complianceStatus === 'warning' ? '#f59e0b' : '#ef4444';
    const complianceText = reportData.complianceStatus === 'compliant' ? '✓ COMPLIANT' :
                          reportData.complianceStatus === 'warning' ? '⚠ WARNING' : '✗ NON-COMPLIANT';

    doc.rect(50, doc.y, 495, 40).fillAndStroke(complianceColor, complianceColor);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#ffffff').text(complianceText, 50, doc.y - 30, { align: 'center', width: 495 });
    doc.moveDown(2);

    // AI Summary
    if (reportData.executiveSummary) {
        doc.fontSize(11).font('Helvetica').fillColor('#374151').text(reportData.executiveSummary, { align: 'left' });
    }
    doc.moveDown(2);

    // Key Metrics boxes
    const metricsY = doc.y;
    const boxWidth = 115;
    const boxHeight = 60;

    // MKT Box
    doc.rect(50, metricsY, boxWidth, boxHeight).stroke('#e5e7eb');
    doc.fontSize(10).fillColor('#6b7280').text('MKT', 50, metricsY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(
        reportData.mkt ? `${reportData.mkt.mkt}°C` : 'N/A',
        50, metricsY + 20, { width: boxWidth, align: 'center' }
    );
    const mktStatus = reportData.mkt?.interpretation || 'N/A';
    const mktColor = mktStatus === 'PASS' ? '#10b981' : mktStatus === 'MARGINAL' ? '#f59e0b' : '#ef4444';
    doc.fontSize(10).font('Helvetica').fillColor(mktColor).text(mktStatus, 50, metricsY + 45, { width: boxWidth, align: 'center' });

    // VHI Box
    doc.rect(175, metricsY, boxWidth, boxHeight).stroke('#e5e7eb');
    doc.fontSize(10).fillColor('#6b7280').text('Health Index', 175, metricsY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(
        reportData.vhi?.index !== null ? `${reportData.vhi.index}%` : 'N/A',
        175, metricsY + 20, { width: boxWidth, align: 'center' }
    );
    const vhiColor = (reportData.vhi?.index || 0) >= 85 ? '#10b981' : (reportData.vhi?.index || 0) >= 70 ? '#f59e0b' : '#ef4444';
    doc.fontSize(10).font('Helvetica').fillColor(vhiColor).text(
        reportData.vhi?.trend || 'N/A',
        175, metricsY + 45, { width: boxWidth, align: 'center' }
    );

    // Night Stability Box
    doc.rect(300, metricsY, boxWidth, boxHeight).stroke('#e5e7eb');
    doc.fontSize(10).fillColor('#6b7280').text('Night Stability', 300, metricsY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(
        reportData.nightGap?.score !== null ? `${reportData.nightGap.score}%` : 'N/A',
        300, metricsY + 20, { width: boxWidth, align: 'center' }
    );
    const nightColor = (reportData.nightGap?.score || 0) >= 90 ? '#10b981' : (reportData.nightGap?.score || 0) >= 75 ? '#f59e0b' : '#ef4444';
    doc.fontSize(10).font('Helvetica').fillColor(nightColor).text('Stable', 300, metricsY + 45, { width: boxWidth, align: 'center' });

    // Excursions Box
    doc.rect(425, metricsY, boxWidth, boxHeight).stroke('#e5e7eb');
    doc.fontSize(10).fillColor('#6b7280').text('Excursions', 425, metricsY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(
        String(reportData.excursions?.length || 0),
        425, metricsY + 20, { width: boxWidth, align: 'center' }
    );
    const excColor = (reportData.excursions?.length || 0) === 0 ? '#10b981' : '#f59e0b';
    doc.fontSize(10).font('Helvetica').fillColor(excColor).text(
        (reportData.excursions?.length || 0) === 0 ? 'None' : 'See details',
        425, metricsY + 45, { width: boxWidth, align: 'center' }
    );

    doc.y = metricsY + boxHeight + 30;

    doc.addPage();

    // --- Temperature Analysis ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0891b2').text('Temperature Analysis');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0891b2');
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica').fillColor('#1e293b');
    doc.text(`Total Readings: ${reportData.readingCount}`);
    doc.moveDown(0.5);

    if (reportData.mkt) {
        doc.fontSize(14).font('Helvetica-Bold').text('Mean Kinetic Temperature (MKT)');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`MKT Value: ${reportData.mkt.mkt}°C`);
        doc.text(`Sample Count: ${reportData.mkt.sampleCount} readings`);
        doc.text(`Interpretation: ${reportData.mkt.interpretation}`);
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#6b7280');
        doc.text(`Formula: ${reportData.mkt.formula}`);
        doc.text('The MKT accounts for the thermal history and represents the single temperature that would produce the same amount of degradation as the actual temperature variations experienced.');
    }

    doc.moveDown(2);

    // --- Night Gap Analysis ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0891b2').text('Night Gap Analysis');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0891b2');
    doc.moveDown(1);

    if (reportData.nightGap) {
        doc.fontSize(12).font('Helvetica').fillColor('#1e293b');
        doc.text(`Analysis Period: ${reportData.nightGap.period} (unstaffed hours)`);
        doc.moveDown(0.5);

        doc.fontSize(24).font('Helvetica-Bold');
        doc.text(`Night Stability Score: ${reportData.nightGap.score}%`);
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').fillColor('#374151');
        doc.text(reportData.nightGap.analysis);
        doc.moveDown(1);

        if (reportData.nightGap.stats) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Statistics:');
            doc.fontSize(11).font('Helvetica');
            doc.text(`Average Temperature: ${reportData.nightGap.stats.avgTemp}°C`);
            doc.text(`Temperature Range: ${reportData.nightGap.stats.tempRange}°C (${reportData.nightGap.stats.minTemp}°C to ${reportData.nightGap.stats.maxTemp}°C)`);
            doc.text(`Night Readings: ${reportData.nightGap.stats.nightReadingCount}`);
            doc.text(`Door Events at Night: ${reportData.nightGap.stats.doorEventsAtNight}`);
        }
    }

    doc.addPage();

    // --- Vibration Health ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0891b2').text('Vibration Health Index');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0891b2');
    doc.moveDown(1);

    if (reportData.vhi) {
        // Health gauge visualization
        const gaugeY = doc.y;
        const gaugeWidth = 200;
        const gaugeHeight = 20;

        doc.rect(50, gaugeY, gaugeWidth, gaugeHeight).stroke('#e5e7eb');
        const fillWidth = (reportData.vhi.index / 100) * gaugeWidth;
        const fillColor = reportData.vhi.index >= 85 ? '#10b981' : reportData.vhi.index >= 70 ? '#f59e0b' : '#ef4444';
        doc.rect(50, gaugeY, fillWidth, gaugeHeight).fill(fillColor);

        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e293b').text(
            `${reportData.vhi.index}/100`,
            270, gaugeY
        );

        doc.y = gaugeY + gaugeHeight + 20;

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b');
        doc.text(`Trend: ${reportData.vhi.trend.charAt(0).toUpperCase() + reportData.vhi.trend.slice(1)}`);
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').fillColor('#374151');
        doc.text(reportData.vhi.diagnosis);
        doc.moveDown(1);

        if (reportData.vhi.stats) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Accelerometer Analysis:');
            doc.fontSize(11).font('Helvetica');
            doc.text(`Average Magnitude: ${reportData.vhi.stats.avgMagnitude}`);
            doc.text(`Standard Deviation: ${reportData.vhi.stats.stdDev}`);
            doc.text(`Max Magnitude: ${reportData.vhi.stats.maxMagnitude}`);
            doc.text(`Peak Events: ${reportData.vhi.stats.peakCount}`);
            doc.text(`Trend Change: ${reportData.vhi.stats.trendPercent > 0 ? '+' : ''}${reportData.vhi.stats.trendPercent}%`);
        }
    } else {
        doc.fontSize(11).font('Helvetica').fillColor('#6b7280');
        doc.text('Insufficient data for vibration analysis.');
    }

    doc.moveDown(2);

    // --- Excursion Log ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0891b2').text('Excursion Log');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0891b2');
    doc.moveDown(1);

    if (reportData.excursions && reportData.excursions.length > 0) {
        doc.fontSize(12).font('Helvetica').fillColor('#1e293b');
        doc.text(`${reportData.excursions.length} Excursion(s) This Period`);
        doc.moveDown(1);

        reportData.excursions.slice(0, 5).forEach((exc, idx) => {
            const severityColor = exc.severity === 'critical' ? '#ef4444' : exc.severity === 'moderate' ? '#f59e0b' : '#6b7280';

            doc.rect(50, doc.y, 495, 70).stroke(severityColor);

            const boxY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b');
            doc.text(`Event #${idx + 1}`, 60, boxY + 10);

            doc.fontSize(10).font('Helvetica').fillColor('#374151');
            doc.text(`Start: ${new Date(exc.start_time).toLocaleString()}`, 60, boxY + 25);
            doc.text(`Peak: ${exc.peak_temp_c}°C`, 250, boxY + 25);
            doc.text(`Duration: ${exc.duration_minutes || 'Ongoing'} min`, 350, boxY + 25);
            doc.text(`Type: ${exc.excursion_type}`, 60, boxY + 40);
            doc.fillColor(severityColor).text(`Severity: ${exc.severity.toUpperCase()}`, 250, boxY + 40);

            doc.y = boxY + 80;
        });
    } else {
        doc.fontSize(11).font('Helvetica').fillColor('#10b981');
        doc.text('No temperature excursions recorded during this period. ✓');
    }

    doc.addPage();

    // --- Engineer's Brief ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0891b2').text("Engineer's Brief");
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0891b2');
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica').fillColor('#1e293b');
    doc.text(`Device: ${reportData.device_id}`);
    doc.text(`Period: ${reportData.period}`);
    doc.moveDown(1);

    if (reportData.engineerBrief) {
        doc.fontSize(11).font('Helvetica').fillColor('#374151');
        doc.text(reportData.engineerBrief);
    }

    doc.moveDown(2);

    // --- Footer ---
    doc.fontSize(9).fillColor('#94a3b8').font('Helvetica');
    doc.text('Guardian Ledger - Thermal & Mechanical Integrity Report', 50, 720, { align: 'center', width: 495 });
    doc.text(`Audit Hash: ${reportData.auditHash} | Generated: ${new Date().toISOString()}`, { align: 'center', width: 495 });

    doc.end();
}

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

// ==================== FLEET GUARDIAN LEDGER ENDPOINTS ====================

// Get monthly fleet data for a specific device
app.get('/api/fleet/:device/monthly', async (req, res) => {
    const { device } = req.params;
    const { month, year } = req.query;

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    if (!supabase) {
        return res.status(503).json({ error: 'Database not configured' });
    }

    try {
        const { data: readings, error } = await supabase
            .from('readings')
            .select('*')
            .eq('device_id', device)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) throw error;

        if (!readings || readings.length === 0) {
            return res.status(404).json({ error: 'No data found for the specified period' });
        }

        const temps = readings.map(r => parseFloat(r.temp_cabinet));
        const mkt = calculateMKT(temps);

        // Calculate fleet-specific metrics
        const avgPower = readings.reduce((sum, r) => sum + (parseFloat(r.compressor_power_w) || 0), 0) / readings.length;
        const avgCOP = readings.reduce((sum, r) => sum + (parseFloat(r.cop) || 0), 0) / readings.length;
        const doorOpenEvents = readings.filter(r => r.door_open).length;
        const faultEvents = readings.filter(r => r.fault && r.fault !== 'NORMAL');
        const defrostCycles = readings.filter(r => r.defrost_on).length;

        // Efficiency score (0-100)
        let efficiencyScore = 100;
        if (avgCOP < 1.5) efficiencyScore -= 20;
        else if (avgCOP < 2.0) efficiencyScore -= 10;
        if (avgPower > 800) efficiencyScore -= 15;
        else if (avgPower > 600) efficiencyScore -= 5;
        if (doorOpenEvents > readings.length * 0.05) efficiencyScore -= 10;
        if (faultEvents.length > 0) efficiencyScore -= (faultEvents.length * 5);
        efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));

        // Excursions
        const excursions = [];
        let currentExcursion = null;
        readings.forEach(r => {
            const temp = parseFloat(r.temp_cabinet);
            if (temp > -10 && !currentExcursion) {
                currentExcursion = { start_time: r.timestamp, peak_temp_c: temp, type: r.door_open ? 'door_open' : 'high_temp' };
            } else if (temp > -10 && currentExcursion) {
                if (temp > currentExcursion.peak_temp_c) currentExcursion.peak_temp_c = temp;
            } else if (temp <= -10 && currentExcursion) {
                currentExcursion.end_time = r.timestamp;
                currentExcursion.duration_minutes = Math.round((new Date(currentExcursion.end_time) - new Date(currentExcursion.start_time)) / 60000);
                currentExcursion.severity = currentExcursion.duration_minutes > 60 ? 'critical' : currentExcursion.duration_minutes > 15 ? 'moderate' : 'minor';
                excursions.push(currentExcursion);
                currentExcursion = null;
            }
        });

        res.json({
            device,
            period,
            readingCount: readings.length,
            mkt,
            efficiency: {
                score: efficiencyScore,
                avgPower: parseFloat(avgPower.toFixed(1)),
                avgCOP: parseFloat(avgCOP.toFixed(2)),
                interpretation: efficiencyScore >= 85 ? 'Excellent' : efficiencyScore >= 70 ? 'Good' : efficiencyScore >= 50 ? 'Fair' : 'Poor'
            },
            operations: {
                doorOpenEvents,
                faultEvents: faultEvents.length,
                defrostCycles,
                faults: [...new Set(faultEvents.map(f => f.fault))]
            },
            excursions,
            source: 'supabase'
        });
    } catch (error) {
        console.error("Fleet monthly query error:", error);
        res.status(500).json({ error: 'Failed to fetch monthly data' });
    }
});

// Generate fleet audit report
app.post('/api/fleet/reports/generate', async (req, res) => {
    const { device_id, month, year } = req.body;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    if (!supabase) {
        return res.status(503).json({ error: 'Database not configured' });
    }

    try {
        // Fetch readings
        const { data: readings, error } = await supabase
            .from('readings')
            .select('*')
            .eq('device_id', device_id)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) throw error;
        if (!readings || readings.length === 0) {
            return res.status(404).json({ error: 'No data found for the specified period' });
        }

        // Get device info
        const { data: deviceInfo } = await supabase
            .from('devices')
            .select('*, locations(name, address)')
            .eq('device_id', device_id)
            .single();

        // Calculate metrics
        const temps = readings.map(r => parseFloat(r.temp_cabinet));
        const mkt = calculateMKT(temps);

        const avgPower = readings.reduce((sum, r) => sum + (parseFloat(r.compressor_power_w) || 0), 0) / readings.length;
        const avgCOP = readings.reduce((sum, r) => sum + (parseFloat(r.cop) || 0), 0) / readings.length;
        const doorOpenEvents = readings.filter(r => r.door_open).length;
        const faultEvents = readings.filter(r => r.fault && r.fault !== 'NORMAL');

        let efficiencyScore = 100;
        if (avgCOP < 1.5) efficiencyScore -= 20;
        if (avgPower > 800) efficiencyScore -= 15;
        if (doorOpenEvents > readings.length * 0.05) efficiencyScore -= 10;
        if (faultEvents.length > 0) efficiencyScore -= (faultEvents.length * 5);
        efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));

        let complianceStatus = 'compliant';
        if (mkt && mkt.interpretation === 'FAIL') complianceStatus = 'non_compliant';
        else if (faultEvents.length > 0 || efficiencyScore < 70) complianceStatus = 'warning';

        const reportData = {
            device_id,
            location: deviceInfo?.locations?.name || 'Unknown',
            address: deviceInfo?.locations?.address || '',
            period,
            readingCount: readings.length,
            mkt,
            efficiency: { score: efficiencyScore, avgPower, avgCOP },
            doorOpenEvents,
            faultEvents: faultEvents.length,
            faults: [...new Set(faultEvents.map(f => f.fault))],
            complianceStatus,
            generatedAt: new Date().toISOString()
        };

        // Generate AI summaries
        if (ai) {
            try {
                const summaryPrompt = `Generate a brief (2-3 sentences) executive summary for a commercial freezer compliance report.
Device: ${device_id} at ${reportData.location}
Period: ${period}
MKT: ${mkt?.mkt}°C (${mkt?.interpretation})
Efficiency Score: ${efficiencyScore}/100
Faults: ${faultEvents.length}
Door Events: ${doorOpenEvents}
Compliance: ${complianceStatus}`;

                const result = await ai.models.generateContent({ model: GEMINI_MODEL, contents: summaryPrompt });
                reportData.executiveSummary = result.text;
            } catch (e) {
                reportData.executiveSummary = 'AI summary unavailable.';
            }
        }

        // Generate audit hash
        reportData.auditHash = crypto.createHash('sha256')
            .update(JSON.stringify(reportData))
            .digest('hex')
            .substring(0, 16);

        // Store in database
        await supabase.from('monthly_reports').insert({
            device_id,
            report_month: startDate.toISOString().split('T')[0],
            mkt_celsius: mkt?.mkt,
            vibration_health_index: efficiencyScore,
            compliance_status: complianceStatus,
            ai_executive_summary: reportData.executiveSummary,
            report_data: reportData,
            audit_hash: reportData.auditHash
        });

        res.json(reportData);
    } catch (error) {
        console.error("Fleet report generation error:", error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Get fleet report history
app.get('/api/fleet/reports/history', async (req, res) => {
    const { device_id, limit = 10 } = req.query;

    if (!supabase) {
        return res.json({ reports: [], message: 'Database not configured' });
    }

    try {
        let query = supabase
            .from('monthly_reports')
            .select('id, device_id, report_month, mkt_celsius, vibration_health_index, compliance_status, generated_at, audit_hash')
            .order('report_month', { ascending: false })
            .limit(parseInt(limit));

        if (device_id) {
            query = query.eq('device_id', device_id);
        }

        // Filter to fleet devices only (FREEZER_*)
        query = query.like('device_id', 'FREEZER_%');

        const { data, error } = await query;
        if (error) throw error;

        res.json({ reports: data || [] });
    } catch (error) {
        console.error("Fleet report history error:", error);
        res.status(500).json({ error: 'Failed to fetch report history' });
    }
});

// API: Get fleet report data as JSON for Puppeteer rendering
app.get('/api/fleet/reports/data', async (req, res) => {
    const { device_id, month, year } = req.query;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    if (!supabase) {
        return res.status(503).json({ error: 'Database not configured' });
    }

    try {
        const { data: readings, error } = await supabase
            .from('readings')
            .select('*')
            .eq('device_id', device_id)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) throw error;
        if (!readings || readings.length === 0) {
            return res.status(404).json({ error: 'No data found for the specified period' });
        }

        const { data: deviceInfo } = await supabase
            .from('devices')
            .select('*, locations(name, address)')
            .eq('device_id', device_id)
            .single();

        const temps = readings.map(r => parseFloat(r.temp_cabinet));
        const mkt = calculateMKT(temps);

        const avgPower = readings.reduce((sum, r) => sum + (parseFloat(r.compressor_power_w) || 0), 0) / readings.length;
        const avgCOP = readings.reduce((sum, r) => sum + (parseFloat(r.cop) || 0), 0) / readings.length;
        const doorOpenEvents = readings.filter(r => r.door_open).length;
        const faultReadings = readings.filter(r => r.fault && r.fault !== 'NORMAL');
        const totalPower = readings.reduce((sum, r) => sum + (parseFloat(r.compressor_power_w) || 0), 0);

        let efficiencyScore = 100;
        if (avgCOP < 1.5) efficiencyScore -= 20;
        if (avgPower > 800) efficiencyScore -= 15;
        if (faultReadings.length > 0) efficiencyScore -= (faultReadings.length * 5);
        efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));

        let complianceStatus = 'compliant';
        if (mkt && mkt.interpretation === 'FAIL') complianceStatus = 'non_compliant';
        else if (faultReadings.length > 0) complianceStatus = 'warning';

        const auditHash = crypto.createHash('sha256')
            .update(JSON.stringify({ device_id, period, mkt, efficiencyScore }))
            .digest('hex')
            .substring(0, 16);

        // Generate AI summary
        let aiSummary = `This fleet unit maintained an average temperature of ${mkt?.mkt || 'N/A'}°C with ${efficiencyScore}% operational efficiency. `;
        if (faultReadings.length === 0) {
            aiSummary += 'No faults were detected during the reporting period. ';
        } else {
            aiSummary += `${faultReadings.length} fault events were recorded and should be investigated. `;
        }
        aiSummary += `Energy consumption averaged ${avgPower.toFixed(0)}W with a COP of ${avgCOP.toFixed(2)}.`;

        const reportData = {
            device_id,
            period,
            locationName: deviceInfo?.locations?.name || 'Unknown Location',
            locationAddress: deviceInfo?.locations?.address || null,
            readingCount: readings.length,
            mkt,
            efficiency: {
                score: efficiencyScore,
                avgPower,
                avgCOP,
                totalEnergy: totalPower / 1000
            },
            doorOpenEvents,
            faults: faultReadings.map(r => ({
                timestamp: r.timestamp,
                fault: r.fault,
                faultId: r.fault_id
            })),
            complianceStatus,
            generatedAt: new Date().toISOString(),
            auditHash,
            aiSummary,
            temperatureData: readings.slice(0, 200).map(r => ({
                timestamp: r.timestamp,
                temp: parseFloat(r.temp_cabinet)
            })),
            powerData: readings.slice(0, 200).map(r => ({
                timestamp: r.timestamp,
                power: parseFloat(r.compressor_power_w) || 0,
                cop: parseFloat(r.cop) || 0
            }))
        };

        res.json(reportData);

    } catch (error) {
        console.error("Fleet report data error:", error);
        res.status(500).json({ error: 'Failed to generate report data' });
    }
});

// Puppeteer PDF generation function for fleet reports
async function generateFleetPuppeteerPDF(deviceId, month, year) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123 });

        const dashboardPort = process.env.DASHBOARD_PORT || 4001;
        const url = `http://localhost:${dashboardPort}/reports/render/fleet-report/${deviceId}?month=${month}&year=${year}`;

        console.log(`📄 Navigating to fleet report: ${url}`);

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        await page.waitForSelector('[data-report-ready="true"]', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
            preferCSSPageSize: true
        });

        console.log(`✅ Fleet PDF generated successfully (${pdf.length} bytes)`);
        return pdf;
    } finally {
        await browser.close();
    }
}

// Generate fleet infographic PDF using Puppeteer
async function generateFleetInfographicPDF(deviceId, month, year) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123 });

        // Capture console errors from the page
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 Page console error: ${msg.text()}`);
            }
        });
        page.on('pageerror', err => {
            console.log(`🔴 Page error: ${err.message}`);
        });

        const dashboardPort = process.env.DASHBOARD_PORT || 4001;
        const url = `http://localhost:${dashboardPort}/reports/render/fleet-infographic/${deviceId}?month=${month}&year=${year}`;

        console.log(`📊 Navigating to fleet infographic: ${url}`);

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for the infographic to be ready (data loaded and rendered)
        await page.waitForSelector('[data-infographic-ready="true"]', { timeout: 45000 });

        // Check if it's an error page
        const hasError = await page.$('[data-infographic-error="true"]');
        if (hasError) {
            throw new Error(`Infographic render failed for device ${deviceId}`);
        }

        // Give extra time for Recharts to fully render
        await new Promise(resolve => setTimeout(resolve, 1500));

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
            preferCSSPageSize: true
        });

        console.log(`✅ Fleet infographic generated successfully (${pdf.length} bytes)`);
        return pdf;
    } finally {
        await browser.close();
    }
}

// Generate reports for ALL fleet devices
async function generateAllFleetReports(req, res, targetMonth, targetYear, period, startDate, endDate, format) {
    if (!supabase) {
        return res.status(503).json({ error: 'Database not configured' });
    }

    try {
        // Get all fleet devices
        const { data: devices, error: devicesError } = await supabase
            .from('devices')
            .select('device_id, locations(name)')
            .order('device_id');

        if (devicesError) throw devicesError;
        if (!devices || devices.length === 0) {
            return res.status(404).json({ error: 'No devices found' });
        }

        console.log(`📦 Generating reports for ${devices.length} fleet devices...`);

        // Create ZIP archive
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="fleet-reports-all-${period}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Failed to create archive' });
        });

        archive.pipe(res);

        // Process each device
        for (const device of devices) {
            const deviceId = device.device_id;
            console.log(`  Processing ${deviceId}...`);

            try {
                // Get readings for this device
                const { data: readings, error } = await supabase
                    .from('readings')
                    .select('*')
                    .eq('device_id', deviceId)
                    .gte('timestamp', startDate.toISOString())
                    .lte('timestamp', endDate.toISOString())
                    .order('timestamp', { ascending: true });

                if (error || !readings || readings.length === 0) {
                    console.log(`    Skipping ${deviceId} - no data`);
                    continue;
                }

                // Generate CSV
                if (format === 'csv' || format === 'both') {
                    const csvHeaders = [
                        'timestamp', 'device_id', 'temp_cabinet', 'temp_ambient',
                        'compressor_power_w', 'compressor_freq_hz', 'frost_level',
                        'cop', 'door_open', 'defrost_on', 'fault'
                    ].join(',');

                    const csvRows = readings.map(r => [
                        r.timestamp, r.device_id || deviceId, r.temp_cabinet,
                        r.temp_ambient || '', r.compressor_power_w || '',
                        r.compressor_freq_hz || '', r.frost_level || '',
                        r.cop || '', r.door_open ? 'true' : 'false',
                        r.defrost_on ? 'true' : 'false', r.fault || 'NORMAL'
                    ].join(','));

                    const csvContent = [csvHeaders, ...csvRows].join('\n');
                    archive.append(csvContent, { name: `${deviceId}/fleet-data-${deviceId}-${period}.csv` });
                }

                // Generate PDF
                if (format === 'pdf' || format === 'both') {
                    try {
                        const pdf = await generateFleetPuppeteerPDF(deviceId, targetMonth, targetYear);
                        const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
                        archive.append(pdfBuffer, { name: `${deviceId}/fleet-report-${deviceId}-${period}.pdf` });
                    } catch (pdfErr) {
                        console.error(`    Failed to generate PDF for ${deviceId}:`, pdfErr.message);
                    }
                }

                console.log(`    ✅ ${deviceId} complete`);
            } catch (deviceError) {
                console.error(`    Failed to process ${deviceId}:`, deviceError.message);
            }
        }

        await archive.finalize();
        console.log(`📦 All fleet reports generated successfully`);

    } catch (error) {
        console.error("All fleet reports generation error:", error);
        res.status(500).json({ error: 'Failed to generate reports for all devices' });
    }
}

// Generate fleet PDF report on-demand using Puppeteer
app.post('/api/fleet/reports/pdf', async (req, res) => {
    const { device_id, month, year, format = 'both' } = req.body;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Handle "all" devices
    if (device_id === 'all') {
        return generateAllFleetReports(req, res, targetMonth, targetYear, period, startDate, endDate, format);
    }

    if (!supabase) {
        return res.status(503).json({ error: 'Database not configured' });
    }

    try {
        const { data: readings, error } = await supabase
            .from('readings')
            .select('*')
            .eq('device_id', device_id)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) throw error;
        if (!readings || readings.length === 0) {
            return res.status(404).json({ error: 'No data found for the specified period' });
        }

        const { data: deviceInfo } = await supabase
            .from('devices')
            .select('*, locations(name, address)')
            .eq('device_id', device_id)
            .single();

        const temps = readings.map(r => parseFloat(r.temp_cabinet));
        const mkt = calculateMKT(temps);

        const avgPower = readings.reduce((sum, r) => sum + (parseFloat(r.compressor_power_w) || 0), 0) / readings.length;
        const avgCOP = readings.reduce((sum, r) => sum + (parseFloat(r.cop) || 0), 0) / readings.length;
        const doorOpenEvents = readings.filter(r => r.door_open).length;
        const faultEvents = readings.filter(r => r.fault && r.fault !== 'NORMAL');
        const totalPower = readings.reduce((sum, r) => sum + (parseFloat(r.compressor_power_w) || 0), 0);

        let efficiencyScore = 100;
        if (avgCOP < 1.5) efficiencyScore -= 20;
        if (avgPower > 800) efficiencyScore -= 15;
        if (faultEvents.length > 0) efficiencyScore -= (faultEvents.length * 5);
        efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));

        const auditHash = crypto.createHash('sha256')
            .update(JSON.stringify({ device_id, period, mkt, efficiencyScore }))
            .digest('hex')
            .substring(0, 16);

        // Generate CSV data from readings
        const csvHeaders = [
            'timestamp',
            'device_id',
            'temp_cabinet',
            'temp_ambient',
            'compressor_power_w',
            'compressor_freq_hz',
            'frost_level',
            'cop',
            'door_open',
            'defrost_on',
            'fault'
        ].join(',');

        const csvRows = readings.map(r => [
            r.timestamp,
            r.device_id || device_id,
            r.temp_cabinet,
            r.temp_ambient || '',
            r.compressor_power_w || '',
            r.compressor_freq_hz || '',
            r.frost_level || '',
            r.cop || '',
            r.door_open ? 'true' : 'false',
            r.defrost_on ? 'true' : 'false',
            r.fault || 'NORMAL'
        ].join(','));

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        // Handle format selection
        try {
            if (format === 'csv') {
                // CSV only
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="fleet-data-${device_id}-${period}.csv"`);
                return res.send(csvContent);
            }

            // Generate PDF (needed for 'pdf' or 'both' formats)
            const pdf = await generateFleetPuppeteerPDF(device_id, targetMonth, targetYear);
            const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

            if (format === 'pdf') {
                // PDF only
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="fleet-report-${device_id}-${period}.pdf"`);
                return res.send(pdfBuffer);
            }

            // Both (ZIP)
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="fleet-report-${device_id}-${period}.zip"`);

            // Generate infographic PDF
            const infographicPdf = await generateFleetInfographicPDF(device_id, targetMonth, targetYear);
            const infographicBuffer = Buffer.isBuffer(infographicPdf) ? infographicPdf : Buffer.from(infographicPdf);

            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (err) => {
                console.error('Archive error:', err);
                res.status(500).json({ error: 'Failed to create archive' });
            });

            archive.pipe(res);

            // Add PDF to archive
            archive.append(pdfBuffer, { name: `fleet-report-${device_id}-${period}.pdf` });

            // Add infographic to archive
            archive.append(infographicBuffer, { name: `fleet-infographic-${device_id}-${period}.pdf` });

            // Add CSV to archive
            archive.append(csvContent, { name: `fleet-data-${device_id}-${period}.csv` });

            // Add a summary JSON file
            const summaryJson = JSON.stringify({
                reportInfo: {
                    deviceId: device_id,
                    location: deviceInfo?.locations?.name || 'Unknown',
                    period: period,
                    generatedAt: new Date().toISOString(),
                    auditHash: auditHash
                },
                metrics: {
                    mkt: mkt,
                    efficiency: {
                        score: efficiencyScore,
                        avgPower: avgPower,
                        avgCOP: avgCOP,
                        totalEnergy: totalPower / 1000
                    }
                },
                operations: {
                    doorOpenEvents: doorOpenEvents,
                    faultEvents: faultEvents.length,
                    faults: [...new Set(faultEvents.map(f => f.fault))]
                },
                dataStats: {
                    totalReadings: readings.length,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            }, null, 2);

            archive.append(summaryJson, { name: `report-summary-${device_id}-${period}.json` });

            await archive.finalize();

        } catch (pdfError) {
            console.error('Puppeteer PDF generation failed:', pdfError);
            res.status(500).json({ error: 'Failed to generate PDF report' });
        }

    } catch (error) {
        console.error("Fleet PDF generation error:", error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Generate fleet infographic only
app.post('/api/fleet/reports/infographic', async (req, res) => {
    const { device_id, month, year } = req.body;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    try {
        const infographicPdf = await generateFleetInfographicPDF(device_id, targetMonth, targetYear);
        const pdfBuffer = Buffer.isBuffer(infographicPdf) ? infographicPdf : Buffer.from(infographicPdf);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="fleet-infographic-${device_id}-${period}.pdf"`);
        return res.send(pdfBuffer);

    } catch (error) {
        console.error("Fleet infographic generation error:", error);
        res.status(500).json({ error: 'Failed to generate infographic' });
    }
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

// ==================== SEO STUDIO ENDPOINTS ====================

// SEO: Keyword Research - Use Gemini to analyze keyword and estimate metrics
app.post('/api/seo/keywords/research', async (req, res) => {
    const { keyword, country = 'us' } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!ai) {
        return res.status(500).json({ error: 'AI not configured - missing Gemini API key' });
    }

    try {
        const prompt = `Analyze this keyword for SEO: "${keyword}" (target market: ${country.toUpperCase()})

You are an SEO expert. Analyze this keyword and provide realistic estimates based on your knowledge of search trends, industry data, and common SEO patterns.

Return ONLY valid JSON (no markdown, no explanation):
{
  "keyword": "${keyword}",
  "volume": <estimated monthly search volume as number, e.g. 2400>,
  "difficulty": <SEO difficulty score 1-100, where 1-20=Easy, 21-40=Moderate, 41-60=Hard, 61-80=Very Hard, 81-100=Super Hard>,
  "cpc": <estimated cost-per-click in USD, e.g. 2.50>,
  "searchIntent": "informational|commercial|transactional|navigational",
  "competitionLevel": "low|medium|high",
  "analysis": "<brief 1-2 sentence analysis of this keyword's potential>"
}`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        let metrics;
        try {
            const jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            metrics = JSON.parse(jsonText);
        } catch (parseError) {
            metrics = { keyword, volume: 1000, difficulty: 50, cpc: 1.00, raw: result.text };
        }

        res.json({
            success: true,
            keyword,
            country,
            metrics
        });
    } catch (error) {
        console.error('SEO keyword research error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// SEO: Get keyword ideas using Gemini
app.post('/api/seo/keywords/ideas', async (req, res) => {
    const { keyword, country = 'us', limit = 15 } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!ai) {
        return res.status(500).json({ error: 'AI not configured - missing Gemini API key' });
    }

    try {
        const prompt = `Generate SEO keyword ideas for: "${keyword}" (target market: ${country.toUpperCase()})

You are an SEO expert. Generate three lists of related keywords with realistic estimated metrics.

Return ONLY valid JSON (no markdown):
{
  "matchingTerms": [
    {"keyword": "variation of main keyword", "volume": 1200, "difficulty": 35, "cpc": 2.10}
  ],
  "relatedTerms": [
    {"keyword": "semantically related keyword", "volume": 800, "difficulty": 28, "cpc": 1.80}
  ],
  "suggestions": [
    {"keyword": "long-tail suggestion", "volume": 400, "difficulty": 20}
  ]
}

Generate ${limit} keywords for matchingTerms (variations containing the main keyword),
${limit} for relatedTerms (semantically related but different phrasing),
and 10 for suggestions (long-tail, question-based, or niche variations).

Focus on keywords relevant to cold chain, IoT, temperature monitoring, and B2B industries.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        let ideas;
        try {
            const jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            ideas = JSON.parse(jsonText);
        } catch (parseError) {
            ideas = { matchingTerms: [], relatedTerms: [], suggestions: [] };
        }

        res.json({
            success: true,
            keyword,
            country,
            matchingTerms: ideas.matchingTerms || [],
            relatedTerms: ideas.relatedTerms || [],
            suggestions: ideas.suggestions || []
        });
    } catch (error) {
        console.error('SEO keyword ideas error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// SEO: Deep Research - Comprehensive keyword and market analysis
app.post('/api/seo/keywords/deep-research', async (req, res) => {
    const { keyword, country = 'us', industry = 'cold chain / IoT' } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!ai) {
        return res.status(500).json({ error: 'AI not configured - missing Gemini API key' });
    }

    try {
        const prompt = `You are a senior SEO strategist and market researcher. Conduct comprehensive deep research on this keyword: "${keyword}"

Target Market: ${country.toUpperCase()}
Industry Context: ${industry}

Analyze this keyword thoroughly and provide actionable insights. Return ONLY valid JSON:

{
  "keywordAnalysis": {
    "primaryKeyword": "${keyword}",
    "estimatedMonthlyVolume": <number>,
    "difficulty": <1-100>,
    "cpc": <USD number>,
    "searchIntent": "informational|commercial|transactional|navigational",
    "buyerJourneyStage": "awareness|consideration|decision",
    "seasonality": "evergreen|seasonal|trending",
    "trendDirection": "growing|stable|declining"
  },
  "audienceInsights": {
    "primaryAudience": "<who searches this>",
    "painPoints": ["<problem 1>", "<problem 2>", "<problem 3>"],
    "goals": ["<what they want to achieve>"],
    "objections": ["<common hesitations>"],
    "decisionFactors": ["<what influences their choice>"]
  },
  "competitorLandscape": {
    "competitionLevel": "low|medium|high|very high",
    "dominantPlayerTypes": ["<type of companies ranking>"],
    "contentFormats": ["<what content types rank: guides, tools, comparisons, etc>"],
    "averageContentLength": <estimated word count of ranking content>,
    "gaps": ["<opportunities competitors miss>"]
  },
  "contentStrategy": {
    "recommendedAngle": "<unique angle to differentiate>",
    "contentType": "ultimate guide|how-to|comparison|case study|tool|listicle",
    "uniqueValueProposition": "<what makes your content stand out>",
    "keyTopicsTocover": ["<must-cover topic 1>", "<topic 2>", "<topic 3>", "<topic 4>", "<topic 5>"],
    "questionsToAnswer": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"],
    "internalLinkOpportunities": ["<related topic to link>"],
    "ctaRecommendation": "<best call-to-action for this content>"
  },
  "keywordCluster": {
    "pillarKeyword": "${keyword}",
    "supportingKeywords": [
      {"keyword": "<supporting kw 1>", "volume": <num>, "type": "how-to|what-is|comparison|best"},
      {"keyword": "<supporting kw 2>", "volume": <num>, "type": "how-to|what-is|comparison|best"},
      {"keyword": "<supporting kw 3>", "volume": <num>, "type": "how-to|what-is|comparison|best"},
      {"keyword": "<supporting kw 4>", "volume": <num>, "type": "how-to|what-is|comparison|best"},
      {"keyword": "<supporting kw 5>", "volume": <num>, "type": "how-to|what-is|comparison|best"}
    ],
    "longTailVariations": ["<long tail 1>", "<long tail 2>", "<long tail 3>", "<long tail 4>", "<long tail 5>"],
    "relatedQuestions": ["<PAA question 1>", "<PAA question 2>", "<PAA question 3>", "<PAA question 4>"]
  },
  "technicalSEO": {
    "recommendedTitle": "<60 char SEO title>",
    "recommendedMetaDescription": "<155 char meta description>",
    "recommendedURL": "<url-slug-format>",
    "schemaType": "Article|HowTo|FAQPage|Product",
    "featuredSnippetOpportunity": "high|medium|low",
    "featuredSnippetFormat": "paragraph|list|table|none"
  },
  "actionPlan": {
    "priority": "high|medium|low",
    "estimatedTimeToRank": "<realistic timeframe>",
    "quickWins": ["<immediate action 1>", "<action 2>"],
    "longTermPlays": ["<strategic action 1>", "<action 2>"],
    "contentCalendarSuggestion": "<when/how often to publish related content>"
  }
}`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        let research;
        try {
            const jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            research = JSON.parse(jsonText);
        } catch (parseError) {
            research = { raw: result.text, parseError: true };
        }

        res.json({
            success: true,
            keyword,
            country,
            research
        });
    } catch (error) {
        console.error('SEO deep research error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// SEO: Generate content brief from keyword
app.post('/api/seo/brief/generate', async (req, res) => {
    const { keyword, relatedKeywords = [], country = 'us' } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!ai) {
        return res.status(500).json({ error: 'AI not configured - missing Gemini API key' });
    }

    try {
        const relatedKwList = relatedKeywords.length > 0
            ? `\nRelated keywords to consider: ${relatedKeywords.join(', ')}`
            : '';

        const prompt = `Create a detailed SEO content brief for the keyword: "${keyword}"${relatedKwList}

Generate a comprehensive brief in JSON format with the following structure:
{
  "targetKeyword": "${keyword}",
  "searchIntent": "informational|commercial|transactional|navigational",
  "suggestedTitle": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Compelling meta description (150-160 chars)",
  "targetWordCount": number,
  "headings": [
    { "level": "h2", "text": "Heading text", "keywords": ["keywords to include"] }
  ],
  "questionsToAnswer": ["People also ask questions"],
  "keyPointsToCover": ["Main points to address"],
  "internalLinkingSuggestions": ["Related topics to link to"],
  "ctaSuggestions": ["Call-to-action ideas"]
}

Return ONLY valid JSON, no markdown or explanation.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        let briefData;
        try {
            const jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            briefData = JSON.parse(jsonText);
        } catch (parseError) {
            briefData = { raw: result.text };
        }

        res.json({
            success: true,
            keyword,
            brief: briefData
        });
    } catch (error) {
        console.error('SEO brief generation error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// SEO: Generate full article from keyword
app.post('/api/seo/article/generate', async (req, res) => {
    const {
        keyword,
        relatedKeywords = [],
        tone = 'professional',
        length = 'medium',
        includeOutline = true
    } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!ai) {
        return res.status(500).json({ error: 'AI not configured - missing Gemini API key' });
    }

    try {
        const wordCounts = {
            short: '800-1000',
            medium: '1500-2000',
            long: '2500-3500'
        };
        const targetWords = wordCounts[length] || wordCounts.medium;

        const relatedKwList = relatedKeywords.length > 0
            ? `\nRelated keywords to naturally incorporate: ${relatedKeywords.join(', ')}`
            : '';

        const prompt = `Write a comprehensive, SEO-optimized article about: "${keyword}"${relatedKwList}

Requirements:
- Tone: ${tone}
- Target length: ${targetWords} words
- Include a compelling H1 title
- Use proper heading hierarchy (H2, H3)
- Write naturally with keywords integrated organically
- Include an introduction that hooks the reader
- Add a conclusion with a call-to-action
- Make it informative and valuable to readers

Format the response as JSON:
{
  "title": "The main H1 title",
  "metaDescription": "SEO meta description (150-160 chars)",
  "outline": [
    { "level": 2, "text": "Section heading" }
  ],
  "content": "The full article content in markdown format with proper ## and ### headings",
  "wordCount": approximate_word_count,
  "keywordsUsed": ["list", "of", "keywords", "used"]
}

Return ONLY valid JSON, no additional text.`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        let articleData;
        try {
            const jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            articleData = JSON.parse(jsonText);
        } catch (parseError) {
            // If parsing fails, structure the raw content
            articleData = {
                title: `Article about ${keyword}`,
                content: result.text,
                raw: true
            };
        }

        res.json({
            success: true,
            keyword,
            article: articleData
        });
    } catch (error) {
        console.error('SEO article generation error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== KERNEL SIGNAL INTELLIGENCE ENGINE ====================

// Constants
const KERNEL_STATES = ['STABLE', 'DOOR_OPEN', 'RECOVERING', 'DEFROST', 'DRIFT_WARM', 'DRIFT_COLD', 'EXCURSION', 'COMP_STRESS', 'FAULT'];
const KERNEL_STATE_MAP = {};
KERNEL_STATES.forEach((s, i) => KERNEL_STATE_MAP[s] = i);

const KERNEL_TIME_PERIODS = ['EARLY_MORNING', 'MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING', 'NIGHT'];

function getTimePeriod(date) {
    const h = date.getHours();
    if (h < 6) return 0;  // EARLY_MORNING
    if (h < 10) return 1; // MORNING
    if (h < 14) return 2; // MIDDAY
    if (h < 18) return 3; // AFTERNOON
    if (h < 22) return 4; // EVENING
    return 5;             // NIGHT
}

// In-memory storage
const kernelDevices = {};
const kernelHistory = {};
const kernelAlerts = {};
const kernelComplianceLogs = {};
const kernelSummaries = {};
let kernelSimulatorRunning = false;
let kernelSimulatorInterval = null;
let kernelSimulatorTick = 0;

const KERNEL_MAX_HISTORY = 200;
const KERNEL_MAX_ALERTS = 50;
const KERNEL_MAX_COMPLIANCE = 100;
const KERNEL_MAX_SUMMARIES = 50;

// Load MLP weights for JS inference
let mlpWeights = null;
try {
    const weightsPath = path.join(__dirname, 'kernel', 'mlp_weights.json');
    if (fs.existsSync(weightsPath)) {
        mlpWeights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
        console.log('🧠 Kernel MLP weights loaded successfully');
    } else {
        console.log('⚠️ Kernel MLP weights not found — will use rules-only classification');
    }
} catch (e) {
    console.log('⚠️ Failed to load Kernel MLP weights:', e.message);
}

// ---- Feature Computation Engine ----

function linearRegSlope(values) {
    const n = values.length;
    if (n < 2) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i; sumY += values[i];
        sumXY += i * values[i]; sumX2 += i * i;
    }
    const denom = n * sumX2 - sumX * sumX;
    return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

function correlation(a, b) {
    if (a.length < 3 || a.length !== b.length) return 0;
    const ma = mean(a), mb = mean(b);
    const sa = stddev(a), sb = stddev(b);
    if (sa === 0 || sb === 0) return 0;
    const cov = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / a.length;
    return cov / (sa * sb);
}

function computeFeatures(sensorWindow) {
    if (!sensorWindow || sensorWindow.length < 2) return null;

    const temps = sensorWindow.map(s => s.temp_cabinet);
    const ambients = sensorWindow.map(s => s.temp_ambient);
    const powers = sensorWindow.map(s => s.compressor_power_w);
    const freqs = sensorWindow.map(s => s.compressor_freq_hz);
    const cops = sensorWindow.map(s => s.cop);
    const tempRates = [];
    for (let i = 1; i < temps.length; i++) {
        tempRates.push(temps[i] - temps[i - 1]);
    }

    const lastSample = sensorWindow[sensorWindow.length - 1];
    const doorOpen = lastSample.door_open ? 1.0 : 0.0;

    // Calculate door duration (how many consecutive samples door was open)
    let doorDuration = 0;
    for (let i = sensorWindow.length - 1; i >= 0; i--) {
        if (sensorWindow[i].door_open) doorDuration += 5; // 5s per sample
        else break;
    }

    const tempMean = mean(temps);
    const tempDelta = temps[temps.length - 1] - temps[0];
    const tempRate = linearRegSlope(temps);
    const tempVolatility = stddev(temps);
    const tempAmbientGap = mean(ambients) - tempMean;

    const powerMean = mean(powers);
    const powerDelta = powers[powers.length - 1] - powers[0];
    const freqMean = mean(freqs);
    const freqStability = freqs.length > 1 ? Math.max(0, 1 - stddev(freqs) / Math.max(1, freqMean)) : 0.5;

    const copMean = mean(cops);
    const copTrend = linearRegSlope(cops);

    const tempRateVsPower = correlation(tempRates, powers.slice(1));

    // Recovery efficiency: how well compressor power translates to cooling
    let recoveryEfficiency = 0.5;
    if (powerMean > 50 && tempRate < 0) {
        recoveryEfficiency = Math.min(1, Math.abs(tempRate) / (powerMean / 500));
    } else if (powerMean > 50 && tempRate >= 0) {
        recoveryEfficiency = Math.max(0, 0.3 - tempRate);
    }

    return {
        temp_mean: tempMean,
        temp_delta: tempDelta,
        temp_rate: tempRate,
        temp_volatility: tempVolatility,
        temp_ambient_gap: tempAmbientGap,
        power_mean: powerMean,
        power_delta: powerDelta,
        freq_mean: freqMean,
        freq_stability: freqStability,
        cop_mean: copMean,
        cop_trend: copTrend,
        temp_rate_vs_power: tempRateVsPower,
        recovery_efficiency: Math.max(0, Math.min(1, recoveryEfficiency)),
        door_state: doorOpen,
        door_duration: doorDuration,
    };
}

// ---- MLP Forward Pass (JavaScript) ----

function mlpRelu(arr) {
    return arr.map(v => Math.max(0, v));
}

function mlpSoftmax(arr) {
    const maxVal = Math.max(...arr);
    const exps = arr.map(v => Math.exp(v - maxVal));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
}

function mlpForward(features, weights) {
    // Normalize
    const fmin = weights.feature_min;
    const fmax = weights.feature_max;
    let x = features.map((v, i) => (v - fmin[i]) / (fmax[i] - fmin[i] + 1e-8));

    // Forward pass through each layer
    for (const layer of weights.layers) {
        const w = layer.weights;
        const b = layer.bias;
        const out = new Array(b.length).fill(0);
        for (let j = 0; j < b.length; j++) {
            let sum = b[j];
            for (let k = 0; k < x.length; k++) {
                sum += x[k] * w[k][j];
            }
            out[j] = sum;
        }
        // Apply activation (ReLU for hidden, softmax for output)
        if (layer.name === 'output') {
            x = mlpSoftmax(out);
        } else {
            x = mlpRelu(out);
        }
    }
    return x;
}

// ---- Hybrid Classification Pipeline ----

function ruleClassify(features, lastSample) {
    // Stage 1: Clear-cut rules
    if (lastSample.fault && lastSample.fault !== 'NORMAL') {
        return { state: 8, state_name: 'FAULT', confidence: 1.0, method: 'rule' };
    }
    if (lastSample.defrost_on) {
        return { state: 3, state_name: 'DEFROST', confidence: 1.0, method: 'rule' };
    }
    if (features.door_state === 1.0) {
        return { state: 1, state_name: 'DOOR_OPEN', confidence: 1.0, method: 'rule' };
    }
    // Stable: low volatility AND small delta AND small rate
    if (features.temp_volatility < 0.4 && Math.abs(features.temp_delta) < 1.0 && Math.abs(features.temp_rate) < 0.05) {
        return { state: 0, state_name: 'STABLE', confidence: 0.95, method: 'rule' };
    }
    return null; // Ambiguous — needs ML
}

function mlpClassify(features) {
    if (!mlpWeights) return null;

    const featureArray = [
        features.temp_mean, features.temp_delta, features.temp_rate,
        features.temp_volatility, features.temp_ambient_gap,
        features.power_mean, features.power_delta, features.freq_mean,
        features.freq_stability, features.cop_mean, features.cop_trend,
        features.temp_rate_vs_power, features.recovery_efficiency,
        features.door_state, features.door_duration,
    ];

    const probs = mlpForward(featureArray, mlpWeights);
    const maxIdx = probs.indexOf(Math.max(...probs));

    return {
        state: maxIdx,
        state_name: KERNEL_STATES[maxIdx],
        confidence: probs[maxIdx],
        method: 'mlp',
        probabilities: probs,
    };
}

function sensorCrossValidation(state, features) {
    let score = 1.0;
    const penalties = [];

    switch (state) {
        case 0: // STABLE
            if (features.temp_volatility > 1.0) { score -= 0.3; penalties.push('high_volatility'); }
            if (Math.abs(features.temp_rate) > 0.1) { score -= 0.2; penalties.push('temp_changing'); }
            break;
        case 1: // DOOR_OPEN
            if (features.door_state !== 1.0) { score -= 0.5; penalties.push('door_closed'); }
            break;
        case 2: // RECOVERING
            if (features.temp_rate >= 0) { score -= 0.3; penalties.push('not_cooling'); }
            if (features.power_mean < 100) { score -= 0.2; penalties.push('low_power'); }
            break;
        case 3: // DEFROST
            if (features.power_mean > 100) { score -= 0.3; penalties.push('high_power'); }
            break;
        case 6: // EXCURSION
            if (features.temp_mean < -15) { score -= 0.4; penalties.push('temp_normal'); }
            break;
        case 7: // COMP_STRESS
            if (features.power_mean < 150) { score -= 0.3; penalties.push('power_normal'); }
            if (features.freq_stability > 0.85) { score -= 0.2; penalties.push('freq_stable'); }
            break;
        case 8: // FAULT
            if (features.power_mean > 100 && features.freq_stability > 0.8) { score -= 0.3; penalties.push('systems_ok'); }
            break;
    }

    return { score: Math.max(0, score), penalties };
}

function classifySensorData(sensorWindow) {
    const features = computeFeatures(sensorWindow);
    if (!features) return null;

    const lastSample = sensorWindow[sensorWindow.length - 1];

    // Stage 1: Rules
    let result = ruleClassify(features, lastSample);

    // Stage 2: MLP (if rules didn't decide)
    if (!result) {
        result = mlpClassify(features);
        if (!result) {
            // Fallback: basic heuristic for ambiguous states
            if (features.temp_rate < -0.05 && features.power_mean > 150) {
                result = { state: 2, state_name: 'RECOVERING', confidence: 0.7, method: 'heuristic' };
            } else if (features.temp_rate > 0.02 && features.temp_mean > -18) {
                result = { state: 4, state_name: 'DRIFT_WARM', confidence: 0.6, method: 'heuristic' };
            } else if (features.temp_rate < -0.02 && features.temp_mean < -22) {
                result = { state: 5, state_name: 'DRIFT_COLD', confidence: 0.6, method: 'heuristic' };
            } else if (features.temp_mean > -8) {
                result = { state: 6, state_name: 'EXCURSION', confidence: 0.7, method: 'heuristic' };
            } else if (features.power_mean > 250 || features.freq_stability < 0.65) {
                result = { state: 7, state_name: 'COMP_STRESS', confidence: 0.6, method: 'heuristic' };
            } else {
                result = { state: 0, state_name: 'STABLE', confidence: 0.5, method: 'heuristic' };
            }
        }
    }

    // Sensor cross-validation
    const consistency = sensorCrossValidation(result.state, features);

    return {
        state: result.state,
        state_name: result.state_name,
        confidence: result.confidence,
        method: result.method,
        sensor_consistency: consistency.score,
        consistency_penalties: consistency.penalties,
        feature_snapshot: features,
        timestamp: new Date().toISOString(),
    };
}

// ---- Markov Context Engine ----

function createMarkovEngine() {
    // 9×9 transition count matrices for 6 time periods
    const matrices = [];
    for (let t = 0; t < 6; t++) {
        const m = [];
        for (let i = 0; i < 9; i++) {
            m.push(new Array(9).fill(0));
        }
        matrices.push(m);
    }

    return {
        matrices,
        totalTransitions: 0,
        stateHistory: [],    // Last 100 transitions
        lastState: null,
        maturity: 'Learning',
    };
}

function updateMarkovMaturity(engine) {
    const t = engine.totalTransitions;
    if (t >= 500) engine.maturity = 'Established';
    else if (t >= 200) engine.maturity = 'Mature';
    else if (t >= 50) engine.maturity = 'Developing';
    else engine.maturity = 'Learning';
}

function markovLearn(engine, fromState, toState, timePeriod, confidence, consistency) {
    // Gated learning: only high-quality classifications
    if (confidence < 0.7 || consistency < 0.8) return false;

    engine.matrices[timePeriod][fromState][toState] += 1;
    // Time acceleration: count as 10x for faster maturity
    engine.totalTransitions += 10;

    engine.stateHistory.push({
        from: fromState,
        to: toState,
        from_name: KERNEL_STATES[fromState],
        to_name: KERNEL_STATES[toState],
        timePeriod,
        timestamp: new Date().toISOString(),
    });
    if (engine.stateHistory.length > 100) engine.stateHistory.shift();

    updateMarkovMaturity(engine);
    return true;
}

function getTransitionProbability(engine, fromState, toState, timePeriod) {
    const row = engine.matrices[timePeriod][fromState];
    const total = row.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return row[toState] / total;
}

function checkMarkovAnomaly(engine, fromState, toState, timePeriod) {
    if (engine.maturity === 'Learning') return null; // Not enough data

    const prob = getTransitionProbability(engine, fromState, toState, timePeriod);
    const row = engine.matrices[timePeriod][fromState];
    const total = row.reduce((a, b) => a + b, 0);

    if (total < 5) return null; // Not enough data for this row

    if (prob < 0.05) {
        return {
            type: 'markov_anomaly',
            from_state: KERNEL_STATES[fromState],
            to_state: KERNEL_STATES[toState],
            probability: prob,
            time_period: KERNEL_TIME_PERIODS[timePeriod],
            severity: prob < 0.01 ? 'critical' : 'warning',
            message: `Unusual transition ${KERNEL_STATES[fromState]} → ${KERNEL_STATES[toState]} (p=${(prob * 100).toFixed(1)}%) during ${KERNEL_TIME_PERIODS[timePeriod]}`,
        };
    }
    return null;
}

function getMarkovData(engine) {
    // Build probability matrices from count matrices
    const probMatrices = engine.matrices.map(matrix => {
        return matrix.map(row => {
            const total = row.reduce((a, b) => a + b, 0);
            return total === 0 ? row.map(() => 0) : row.map(v => v / total);
        });
    });

    // Aggregate across all time periods
    const aggregated = [];
    for (let i = 0; i < 9; i++) {
        const row = [];
        for (let j = 0; j < 9; j++) {
            let total = 0, count = 0;
            for (let t = 0; t < 6; t++) {
                const rowTotal = engine.matrices[t][i].reduce((a, b) => a + b, 0);
                if (rowTotal > 0) {
                    total += engine.matrices[t][i][j] / rowTotal;
                    count++;
                }
            }
            row.push(count > 0 ? total / count : 0);
        }
        aggregated.push(row);
    }

    return {
        count_matrices: engine.matrices,
        probability_matrices: probMatrices,
        aggregated_probabilities: aggregated,
        total_transitions: engine.totalTransitions,
        maturity: engine.maturity,
        state_history: engine.stateHistory.slice(-20),
        state_names: KERNEL_STATES,
        time_periods: KERNEL_TIME_PERIODS,
    };
}

// ---- Kernel Simulator (3 Device Profiles) ----

const KERNEL_DEVICE_PROFILES = {
    KERNEL_001: {
        name: 'London Cold Store',
        lat: 51.5074, lon: -0.1278,
        location_name: 'London, UK',
        profile: 'healthy',
        doorProb: 0.02, frostRate: 0.001, faultProb: 0.0001,
        targetTemp: -20, ambientTemp: 22, compressorPower: 150,
    },
    KERNEL_002: {
        name: 'Manchester Distribution',
        lat: 53.4808, lon: -2.2426,
        location_name: 'Manchester, UK',
        profile: 'problematic',
        doorProb: 0.15, frostRate: 0.005, faultProb: 0.002,
        targetTemp: -18, ambientTemp: 24, compressorPower: 160,
    },
    KERNEL_003: {
        name: 'Glasgow Pharma Depot',
        lat: 55.8642, lon: -4.2518,
        location_name: 'Glasgow, UK',
        profile: 'degrading',
        doorProb: 0.05, frostRate: 0.003, faultProb: 0.001,
        targetTemp: -20, ambientTemp: 20, compressorPower: 155,
        degradationRate: 0.0005,
    },
};

function initKernelDevice(deviceId, profile) {
    return {
        deviceId,
        profile,
        // Physics state
        temp: profile.targetTemp + (Math.random() - 0.5) * 2,
        compressorOn: true,
        compressorPower: profile.compressorPower,
        compressorFreq: 50,
        doorOpen: false,
        doorTimer: 0,
        defrostOn: false,
        defrostTimer: 0,
        frostLevel: 0.1,
        cop: 2.5,
        fault: 'NORMAL',
        faultId: 0,
        degradation: 0, // For degrading profile
        // Rolling window
        sensorWindow: [],
        // Kernel state
        currentState: null,
        markovEngine: createMarkovEngine(),
    };
}

function simulateKernelTick(device) {
    const profile = KERNEL_DEVICE_PROFILES[device.deviceId];
    const dt = 5; // 5 second tick

    // Degradation (for KERNEL_003)
    if (profile.degradationRate) {
        device.degradation += profile.degradationRate;
    }

    // Door events
    if (!device.doorOpen && Math.random() < profile.doorProb) {
        device.doorOpen = true;
        device.doorTimer = 10 + Math.random() * 40; // 10-50s
    }
    if (device.doorOpen) {
        device.doorTimer -= dt;
        if (device.doorTimer <= 0) {
            device.doorOpen = false;
            device.doorTimer = 0;
        }
    }

    // Defrost cycles (every ~200 ticks for healthy, more often for problematic)
    if (!device.defrostOn && device.frostLevel > 0.6 + Math.random() * 0.2) {
        device.defrostOn = true;
        device.defrostTimer = 30 + Math.random() * 30; // 30-60s
    }
    if (device.defrostOn) {
        device.defrostTimer -= dt;
        device.compressorOn = false;
        device.frostLevel = Math.max(0, device.frostLevel - 0.02);
        if (device.defrostTimer <= 0) {
            device.defrostOn = false;
            device.compressorOn = true;
        }
    }

    // Frost accumulation
    device.frostLevel += profile.frostRate + device.degradation * 0.001;
    device.frostLevel = Math.min(1, Math.max(0, device.frostLevel));

    // Fault events
    if (device.fault === 'NORMAL' && Math.random() < profile.faultProb + device.degradation * 0.01) {
        const faults = ['COMPRESSOR_OVERLOAD', 'SENSOR_DRIFT', 'REFRIGERANT_LOW', 'FAN_FAILURE'];
        device.fault = faults[Math.floor(Math.random() * faults.length)];
        device.faultId = Math.floor(Math.random() * 100) + 1;
    }
    // Faults auto-resolve after ~20 ticks
    if (device.fault !== 'NORMAL' && Math.random() < 0.05) {
        device.fault = 'NORMAL';
        device.faultId = 0;
    }

    // Temperature physics
    const ambientInfluence = (profile.ambientTemp - device.temp) * 0.001;
    const doorInfluence = device.doorOpen ? (profile.ambientTemp - device.temp) * 0.005 : 0;
    const compressorCooling = device.compressorOn && !device.defrostOn
        ? -(device.compressorPower / 1000) * (1 - device.degradation * 0.3)
        : 0;
    const faultImpact = device.fault !== 'NORMAL' ? 0.05 : 0;

    device.temp += (ambientInfluence + doorInfluence + compressorCooling + faultImpact) * dt;
    device.temp += (Math.random() - 0.5) * 0.1; // Noise

    // Compressor dynamics
    if (device.compressorOn && !device.defrostOn) {
        const load = Math.abs(device.temp - profile.targetTemp) / 10;
        device.compressorPower = profile.compressorPower * (0.8 + load * 0.4) + device.degradation * 50;
        device.compressorFreq = 48 + load * 15 + (Math.random() - 0.5) * 2;
        if (device.fault !== 'NORMAL') {
            device.compressorPower += (Math.random() - 0.3) * 80;
            device.compressorFreq += (Math.random() - 0.3) * 10;
        }
    } else {
        device.compressorPower = 5 + Math.random() * 10; // Standby
        device.compressorFreq = 0;
    }

    // COP calculation
    const tempDiff = Math.max(1, profile.ambientTemp - device.temp);
    device.cop = device.compressorPower > 20
        ? Math.max(0.1, (tempDiff * 10) / device.compressorPower * (1 - device.degradation * 0.4))
        : 0;

    device.compressorPower = Math.max(0, device.compressorPower);
    device.compressorFreq = Math.max(0, device.compressorFreq);

    // Build sensor reading
    const reading = {
        device_id: device.deviceId,
        lat: profile.lat,
        lon: profile.lon,
        location_name: profile.location_name,
        temp_cabinet: Math.round(device.temp * 100) / 100,
        temp_ambient: profile.ambientTemp + (Math.random() - 0.5) * 1,
        door_open: device.doorOpen,
        defrost_on: device.defrostOn,
        compressor_power_w: Math.round(device.compressorPower * 10) / 10,
        compressor_freq_hz: Math.round(device.compressorFreq * 10) / 10,
        frost_level: Math.round(device.frostLevel * 1000) / 1000,
        cop: Math.round(device.cop * 100) / 100,
        fault: device.fault,
        fault_id: device.faultId,
        timestamp: new Date().toISOString(),
    };

    // Update rolling window
    device.sensorWindow.push(reading);
    if (device.sensorWindow.length > 24) device.sensorWindow.shift();

    // Classify if we have enough data
    let classification = null;
    if (device.sensorWindow.length >= 6) {
        classification = classifySensorData(device.sensorWindow);

        if (classification) {
            // Markov learning
            const prevState = device.currentState;
            device.currentState = classification;

            if (prevState !== null) {
                const timePeriod = getTimePeriod(new Date());
                const learned = markovLearn(
                    device.markovEngine,
                    prevState.state, classification.state,
                    timePeriod, classification.confidence, classification.sensor_consistency
                );

                // Check for Markov anomaly
                if (learned) {
                    const anomaly = checkMarkovAnomaly(
                        device.markovEngine,
                        prevState.state, classification.state, timePeriod
                    );
                    if (anomaly) {
                        anomaly.device_id = device.deviceId;
                        anomaly.timestamp = new Date().toISOString();
                        anomaly.classification = classification;

                        if (!kernelAlerts[device.deviceId]) kernelAlerts[device.deviceId] = [];
                        kernelAlerts[device.deviceId].push(anomaly);
                        if (kernelAlerts[device.deviceId].length > KERNEL_MAX_ALERTS) {
                            kernelAlerts[device.deviceId].shift();
                        }

                        // Emit alert
                        io.emit('kernelAlert', anomaly);
                    }
                }
            }
        }
    }

    return { reading, classification };
}

function startKernelSimulator() {
    if (kernelSimulatorRunning) return;

    // Stop any running replay first (C1 fix — symmetric with replay stopping simulator)
    if (kernelReplayRunning) stopKernelReplay();

    console.log('🧠 Starting Kernel Signal Intelligence simulator...');
    kernelSimulatorRunning = true;
    kernelSimulatorTick = 0;

    // Initialize devices
    for (const [deviceId, profile] of Object.entries(KERNEL_DEVICE_PROFILES)) {
        kernelDevices[deviceId] = initKernelDevice(deviceId, profile);
        kernelHistory[deviceId] = kernelHistory[deviceId] || [];
        kernelAlerts[deviceId] = kernelAlerts[deviceId] || [];
        kernelComplianceLogs[deviceId] = kernelComplianceLogs[deviceId] || [];
        kernelSummaries[deviceId] = kernelSummaries[deviceId] || [];
    }

    io.emit('kernelSimulatorStatus', { running: true, tick: 0 });

    kernelSimulatorInterval = setInterval(() => {
        kernelSimulatorTick++;

        for (const deviceId of Object.keys(kernelDevices)) {
            const device = kernelDevices[deviceId];
            const { reading, classification } = simulateKernelTick(device);

            // Store history
            const historyEntry = { ...reading, classification };
            kernelHistory[deviceId].push(historyEntry);
            if (kernelHistory[deviceId].length > KERNEL_MAX_HISTORY) {
                kernelHistory[deviceId].shift();
            }

            // Emit state update
            io.emit('kernelStateUpdate', {
                device_id: deviceId,
                reading,
                classification,
                markov_maturity: device.markovEngine.maturity,
                total_transitions: device.markovEngine.totalTransitions,
            });

            // Compliance log every 60 ticks (~5 min)
            if (kernelSimulatorTick % 60 === 0) {
                const complianceEntry = {
                    device_id: deviceId,
                    timestamp: new Date().toISOString(),
                    tick: kernelSimulatorTick,
                    reading,
                    kernel_state: classification ? classification.state_name : 'UNKNOWN',
                    confidence: classification ? classification.confidence : 0,
                    method: classification ? classification.method : 'none',
                };
                kernelComplianceLogs[deviceId].push(complianceEntry);
                if (kernelComplianceLogs[deviceId].length > KERNEL_MAX_COMPLIANCE) {
                    kernelComplianceLogs[deviceId].shift();
                }
            }
        }

        // Summary every 12 ticks (~1 min demo)
        if (kernelSimulatorTick % 12 === 0) {
            const summary = generateKernelSummary();
            io.emit('kernelSummary', summary);
        }
    }, 5000); // 5s interval
}

function stopKernelSimulator() {
    if (!kernelSimulatorRunning) return;

    console.log('🛑 Stopping Kernel simulator...');
    clearInterval(kernelSimulatorInterval);
    kernelSimulatorInterval = null;
    kernelSimulatorRunning = false;

    io.emit('kernelSimulatorStatus', { running: false, tick: kernelSimulatorTick });
}

// ---- Kernel Replay Engine (Real Dataset) ----

let kernelReplayIndex = null;       // { runId -> { fault, faultId, lineStart } }
let kernelReplayFaults = null;      // unique fault types
let kernelReplayRunning = false;
let kernelReplayInterval = null;
let kernelReplayData = null;        // interpolated readings for current run
let kernelReplayIdx = 0;
let kernelReplaySpeed = 1;
let kernelReplayRunId = null;
let kernelReplayStateBreakdown = {};  // C3 fix: module-level so speed changes don't reset it
let kernelReplayConfusionMatrix = {}; // S3: track actual vs predicted for accuracy metrics
let kernelReplayMethodCounts = {};    // S3: count classifications by method (rule/mlp/heuristic)
const REPLAY_CSV_PATH = path.join(__dirname, 'datasets', 'fridge_fault_timeseries_dataset.csv');
const REPLAY_DEVICE_ID = 'REPLAY_001';
let replayCsvColumnMap = null;  // S1: header name → column index map

// S1: Required columns for replay CSV
const REPLAY_REQUIRED_COLUMNS = ['T_amb', 'T_cab', 'N_comp_Hz', 'P_comp_W', 'COP', 'frost_level', 'time_min', 'run_id', 'fault', 'fault_id', 'door_open', 'defrost_on'];

function buildCsvColumnMap(headerLine) {
    var cols = headerLine.split(',');
    var map = {};
    for (var i = 0; i < cols.length; i++) {
        map[cols[i].trim()] = i;
    }
    // Validate required columns exist
    var missing = [];
    for (var j = 0; j < REPLAY_REQUIRED_COLUMNS.length; j++) {
        if (map[REPLAY_REQUIRED_COLUMNS[j]] === undefined) {
            missing.push(REPLAY_REQUIRED_COLUMNS[j]);
        }
    }
    if (missing.length > 0) {
        throw new Error('Replay CSV missing required columns: ' + missing.join(', '));
    }
    return map;
}

function loadReplayIndex() {
    return new Promise((resolve, reject) => {
        if (kernelReplayIndex) { resolve(kernelReplayIndex); return; }
        const readline = require('readline');
        const index = {};
        const faultSet = {};
        let lineNum = 0;
        let currentRunId = null;
        let currentFault = null;
        let currentFaultId = 0;
        let currentLineStart = 0;

        const stream = fs.createReadStream(REPLAY_CSV_PATH, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

        rl.on('line', (line) => {
            lineNum++;
            if (lineNum === 1) {
                // S1: parse header and build column map
                try {
                    replayCsvColumnMap = buildCsvColumnMap(line);
                } catch (e) {
                    rl.close();
                    stream.destroy();
                    reject(e);
                }
                return;
            }
            const cols = line.split(',');
            const cm = replayCsvColumnMap;
            const runId = parseInt(cols[cm['run_id']], 10);
            const fault = cols[cm['fault']];
            const faultId = parseInt(cols[cm['fault_id']], 10);
            if (runId !== currentRunId) {
                if (currentRunId !== null) {
                    index[currentRunId] = { fault: currentFault, faultId: currentFaultId, lineStart: currentLineStart };
                }
                currentRunId = runId;
                currentFault = fault;
                currentFaultId = faultId;
                currentLineStart = lineNum;
            }
        });

        rl.on('close', () => {
            if (currentRunId !== null) {
                index[currentRunId] = { fault: currentFault, faultId: currentFaultId, lineStart: currentLineStart };
            }
            for (var key in index) { faultSet[index[key].fault] = true; }
            kernelReplayIndex = index;
            kernelReplayFaults = Object.keys(faultSet).sort();
            console.log('📊 Replay index built: ' + Object.keys(index).length + ' runs, ' + kernelReplayFaults.length + ' fault types');
            resolve(index);
        });

        rl.on('error', reject);
    });
}

function loadReplayRun(runId) {
    return new Promise((resolve, reject) => {
        if (!kernelReplayIndex || !kernelReplayIndex[runId]) {
            reject(new Error('Run ' + runId + ' not found in index'));
            return;
        }
        if (!replayCsvColumnMap) {
            reject(new Error('CSV column map not initialized — call loadReplayIndex first'));
            return;
        }
        const cm = replayCsvColumnMap;
        const readline = require('readline');
        const rows = [];
        let lineNum = 0;
        const stream = fs.createReadStream(REPLAY_CSV_PATH, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

        rl.on('line', (line) => {
            lineNum++;
            if (lineNum === 1) return; // skip header
            const cols = line.split(',');
            const rid = parseInt(cols[cm['run_id']], 10);
            if (rid === runId) {
                rows.push({
                    T_amb: parseFloat(cols[cm['T_amb']]),
                    T_cab: parseFloat(cols[cm['T_cab']]),
                    N_comp_Hz: parseFloat(cols[cm['N_comp_Hz']]),
                    P_comp_W: parseFloat(cols[cm['P_comp_W']]),
                    COP: parseFloat(cols[cm['COP']]),
                    frost_level: parseFloat(cols[cm['frost_level']]),
                    time_min: parseInt(cols[cm['time_min']], 10),
                    fault: cols[cm['fault']],
                    fault_id: parseInt(cols[cm['fault_id']], 10),
                    door_open: parseInt(cols[cm['door_open']], 10) === 1,
                    defrost_on: parseInt(cols[cm['defrost_on']], 10) === 1,
                });
            } else if (rows.length > 0) {
                // Past the run, stop early
                rl.close();
                stream.destroy();
            }
        });

        rl.on('close', () => resolve(rows));
        rl.on('error', reject);
    });
}

function interpolateToFiveSeconds(rows) {
    var result = [];
    var baseTime = new Date();
    baseTime.setMilliseconds(0);
    baseTime.setSeconds(0);

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var next = (i < rows.length - 1) ? rows[i + 1] : null;
        var steps = next ? 12 : 1; // 12 five-second steps per 1-minute gap

        for (var s = 0; s < steps; s++) {
            var t = s / steps;
            var ts = new Date(baseTime.getTime() + (row.time_min * 60 + s * 5) * 1000);

            var reading = {
                device_id: REPLAY_DEVICE_ID,
                lat: 40.7128,
                lon: -74.006,
                location_name: 'Replay Dataset',
                temp_cabinet: next ? row.T_cab + (next.T_cab - row.T_cab) * t : row.T_cab,
                temp_ambient: next ? row.T_amb + (next.T_amb - row.T_amb) * t : row.T_amb,
                door_open: row.door_open,
                defrost_on: row.defrost_on,
                compressor_power_w: next ? row.P_comp_W + (next.P_comp_W - row.P_comp_W) * t : row.P_comp_W,
                compressor_freq_hz: next ? row.N_comp_Hz + (next.N_comp_Hz - row.N_comp_Hz) * t : row.N_comp_Hz,
                frost_level: next ? row.frost_level + (next.frost_level - row.frost_level) * t : row.frost_level,
                cop: next ? row.COP + (next.COP - row.COP) * t : row.COP,
                fault: 'NORMAL',
                fault_id: 0,
                timestamp: ts.toISOString(),
                _ground_truth: row.fault,
            };

            // Round numeric fields
            reading.temp_cabinet = Math.round(reading.temp_cabinet * 100) / 100;
            reading.temp_ambient = Math.round(reading.temp_ambient * 100) / 100;
            reading.compressor_power_w = Math.round(reading.compressor_power_w * 10) / 10;
            reading.compressor_freq_hz = Math.round(reading.compressor_freq_hz * 10) / 10;
            reading.frost_level = Math.round(reading.frost_level * 1000) / 1000;
            reading.cop = Math.round(reading.cop * 100) / 100;

            result.push(reading);
        }
    }
    return result;
}

// S3: Compute accuracy metrics from confusion matrix
function computeReplayAccuracyMetrics() {
    var totalCorrect = 0;
    var totalSamples = 0;
    var perState = {};

    // Build per-state TP/FP/FN counts
    for (var actual in kernelReplayConfusionMatrix) {
        for (var predicted in kernelReplayConfusionMatrix[actual]) {
            var count = kernelReplayConfusionMatrix[actual][predicted];
            totalSamples += count;
            if (actual === predicted) totalCorrect += count;

            // True positives for this state
            if (!perState[predicted]) perState[predicted] = { tp: 0, fp: 0, fn: 0 };
            if (!perState[actual]) perState[actual] = { tp: 0, fp: 0, fn: 0 };

            if (actual === predicted) {
                perState[predicted].tp += count;
            } else {
                perState[predicted].fp += count;  // predicted this state but it was wrong
                perState[actual].fn += count;      // missed this actual state
            }
        }
    }

    var overallAccuracy = totalSamples > 0 ? totalCorrect / totalSamples : 0;
    var stateMetrics = {};
    for (var state in perState) {
        var s = perState[state];
        var precision = (s.tp + s.fp) > 0 ? s.tp / (s.tp + s.fp) : 0;
        var recall = (s.tp + s.fn) > 0 ? s.tp / (s.tp + s.fn) : 0;
        var f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
        stateMetrics[state] = {
            precision: Math.round(precision * 1000) / 1000,
            recall: Math.round(recall * 1000) / 1000,
            f1: Math.round(f1 * 1000) / 1000,
            support: s.tp + s.fn,
        };
    }

    return {
        overall_accuracy: Math.round(overallAccuracy * 1000) / 1000,
        total_samples: totalSamples,
        correct: totalCorrect,
        confusion_matrix: kernelReplayConfusionMatrix,
        per_state: stateMetrics,
        method_counts: kernelReplayMethodCounts,
    };
}

function startKernelReplay(runId, speed) {
    // Stop simulator if running
    if (kernelSimulatorRunning) stopKernelSimulator();
    // Stop existing replay if running
    if (kernelReplayRunning) stopKernelReplay();

    speed = speed || 1;
    var fault = kernelReplayIndex[runId] ? kernelReplayIndex[runId].fault : 'UNKNOWN';
    console.log('🔄 Starting Kernel replay: run ' + runId + ' (' + fault + ') at ' + speed + 'x');

    kernelReplayRunning = true;
    kernelReplayRunId = runId;
    kernelReplaySpeed = speed;
    kernelReplayIdx = 0;

    // Initialize fresh replay device
    var replayDevice = {
        deviceId: REPLAY_DEVICE_ID,
        profile: { lat: 40.7128, lon: -74.006, location_name: 'Replay Dataset', profile: 'replay' },
        sensorWindow: [],
        currentState: null,
        markovEngine: createMarkovEngine(),
    };
    kernelDevices[REPLAY_DEVICE_ID] = replayDevice;
    kernelHistory[REPLAY_DEVICE_ID] = [];
    kernelAlerts[REPLAY_DEVICE_ID] = [];

    // C3 fix: initialize module-level breakdown once per replay start (not per speed change)
    kernelReplayStateBreakdown = {};
    KERNEL_STATES.forEach(function(s) { kernelReplayStateBreakdown[s] = 0; });

    // S3: initialize accuracy tracking
    kernelReplayConfusionMatrix = {};
    kernelReplayMethodCounts = { rule: 0, mlp: 0, heuristic: 0 };

    io.emit('kernelReplayStatus', {
        running: true, runId: runId, fault: fault, speed: speed,
        progress: 0, total: kernelReplayData.length,
    });

    var intervalMs = Math.max(10, Math.round(5000 / speed));

    kernelReplayInterval = setInterval(function() {
        if (kernelReplayIdx >= kernelReplayData.length) {
            // Run complete
            clearInterval(kernelReplayInterval);
            kernelReplayInterval = null;
            kernelReplayRunning = false;

            var totalClassifications = 0;
            for (var k in kernelReplayStateBreakdown) totalClassifications += kernelReplayStateBreakdown[k];

            // S3: compute accuracy metrics
            var accuracyMetrics = computeReplayAccuracyMetrics();

            io.emit('kernelReplayComplete', {
                runId: runId, fault: fault,
                stateBreakdown: kernelReplayStateBreakdown,
                totalClassifications: totalClassifications,
                accuracy: accuracyMetrics,
            });
            io.emit('kernelReplayStatus', {
                running: false, runId: runId, fault: fault, speed: speed,
                progress: kernelReplayData.length, total: kernelReplayData.length,
            });
            console.log('✅ Replay complete: run ' + runId + ', ' + totalClassifications + ' classifications, accuracy: ' + (accuracyMetrics.overall_accuracy * 100).toFixed(1) + '%');

            // Clean up replay device (C1 fix)
            delete kernelDevices[REPLAY_DEVICE_ID];
            delete kernelHistory[REPLAY_DEVICE_ID];
            delete kernelAlerts[REPLAY_DEVICE_ID];
            return;
        }

        var reading = kernelReplayData[kernelReplayIdx];
        var device = kernelDevices[REPLAY_DEVICE_ID];
        kernelReplayIdx++;

        // Feed through the pipeline (same as simulateKernelTick inner logic)
        device.sensorWindow.push(reading);
        if (device.sensorWindow.length > 24) device.sensorWindow.shift();

        var classification = null;
        if (device.sensorWindow.length >= 6) {
            classification = classifySensorData(device.sensorWindow);

            if (classification) {
                kernelReplayStateBreakdown[classification.state_name] = (kernelReplayStateBreakdown[classification.state_name] || 0) + 1;

                // S3: track confusion matrix and method counts
                kernelReplayMethodCounts[classification.method] = (kernelReplayMethodCounts[classification.method] || 0) + 1;
                if (reading._ground_truth) {
                    var gt = reading._ground_truth;
                    if (!kernelReplayConfusionMatrix[gt]) kernelReplayConfusionMatrix[gt] = {};
                    kernelReplayConfusionMatrix[gt][classification.state_name] = (kernelReplayConfusionMatrix[gt][classification.state_name] || 0) + 1;
                }

                var prevState = device.currentState;
                device.currentState = classification;

                if (prevState !== null) {
                    var timePeriod = getTimePeriod(new Date(reading.timestamp));
                    var learned = markovLearn(
                        device.markovEngine,
                        prevState.state, classification.state,
                        timePeriod, classification.confidence, classification.sensor_consistency
                    );

                    if (learned) {
                        var anomaly = checkMarkovAnomaly(
                            device.markovEngine,
                            prevState.state, classification.state, timePeriod
                        );
                        if (anomaly) {
                            anomaly.device_id = REPLAY_DEVICE_ID;
                            anomaly.timestamp = reading.timestamp;
                            anomaly.classification = classification;
                            if (!kernelAlerts[REPLAY_DEVICE_ID]) kernelAlerts[REPLAY_DEVICE_ID] = [];
                            kernelAlerts[REPLAY_DEVICE_ID].push(anomaly);
                            if (kernelAlerts[REPLAY_DEVICE_ID].length > KERNEL_MAX_ALERTS) {
                                kernelAlerts[REPLAY_DEVICE_ID].shift();
                            }
                            io.emit('kernelAlert', anomaly);
                        }
                    }
                }
            }
        }

        // Store history
        var historyEntry = Object.assign({}, reading, { classification: classification });
        kernelHistory[REPLAY_DEVICE_ID] = kernelHistory[REPLAY_DEVICE_ID] || [];
        kernelHistory[REPLAY_DEVICE_ID].push(historyEntry);
        if (kernelHistory[REPLAY_DEVICE_ID].length > KERNEL_MAX_HISTORY) {
            kernelHistory[REPLAY_DEVICE_ID].shift();
        }

        // Emit state update with ground truth
        io.emit('kernelStateUpdate', {
            device_id: REPLAY_DEVICE_ID,
            reading: reading,
            classification: classification,
            markov_maturity: device.markovEngine.maturity,
            total_transitions: device.markovEngine.totalTransitions,
            ground_truth: reading._ground_truth,
        });

        // Emit progress every 100 readings
        if (kernelReplayIdx % 100 === 0) {
            io.emit('kernelReplayStatus', {
                running: true, runId: runId, fault: fault, speed: speed,
                progress: kernelReplayIdx, total: kernelReplayData.length,
            });
        }
    }, intervalMs);
}

function stopKernelReplay() {
    if (!kernelReplayRunning) return;
    console.log('🛑 Stopping Kernel replay...');
    clearInterval(kernelReplayInterval);
    kernelReplayInterval = null;
    kernelReplayRunning = false;
    io.emit('kernelReplayStatus', {
        running: false, runId: kernelReplayRunId, fault: kernelReplayIndex && kernelReplayIndex[kernelReplayRunId] ? kernelReplayIndex[kernelReplayRunId].fault : null,
        speed: kernelReplaySpeed, progress: kernelReplayIdx, total: kernelReplayData ? kernelReplayData.length : 0,
    });

    // Clean up replay device so simulator doesn't iterate over it (C1 fix)
    delete kernelDevices[REPLAY_DEVICE_ID];
    delete kernelHistory[REPLAY_DEVICE_ID];
    delete kernelAlerts[REPLAY_DEVICE_ID];
}

function generateKernelSummary() {
    const deviceSummaries = {};

    for (const [deviceId, device] of Object.entries(kernelDevices)) {
        const history = kernelHistory[deviceId] || [];
        const recent = history.slice(-12);

        // State breakdown
        const stateBreakdown = {};
        KERNEL_STATES.forEach(s => stateBreakdown[s] = 0);
        for (const entry of recent) {
            if (entry.classification) {
                stateBreakdown[entry.classification.state_name] = (stateBreakdown[entry.classification.state_name] || 0) + 1;
            }
        }

        // Temp/power stats
        const temps = recent.map(r => r.temp_cabinet).filter(v => v != null);
        const powers = recent.map(r => r.compressor_power_w).filter(v => v != null);

        const alerts = (kernelAlerts[deviceId] || []).filter(a => {
            const age = Date.now() - new Date(a.timestamp).getTime();
            return age < 120000; // Last 2 minutes
        });

        deviceSummaries[deviceId] = {
            device_id: deviceId,
            current_state: device.currentState ? device.currentState.state_name : 'UNKNOWN',
            state_breakdown: stateBreakdown,
            temp_avg: temps.length ? Math.round(mean(temps) * 100) / 100 : null,
            temp_min: temps.length ? Math.min(...temps) : null,
            temp_max: temps.length ? Math.max(...temps) : null,
            power_avg: powers.length ? Math.round(mean(powers) * 10) / 10 : null,
            anomaly_count: alerts.length,
            markov_maturity: device.markovEngine.maturity,
            total_transitions: device.markovEngine.totalTransitions,
        };

        // Store summary
        kernelSummaries[deviceId] = kernelSummaries[deviceId] || [];
        kernelSummaries[deviceId].push({
            ...deviceSummaries[deviceId],
            timestamp: new Date().toISOString(),
        });
        if (kernelSummaries[deviceId].length > KERNEL_MAX_SUMMARIES) {
            kernelSummaries[deviceId].shift();
        }
    }

    return {
        timestamp: new Date().toISOString(),
        tick: kernelSimulatorTick,
        simulator_running: kernelSimulatorRunning,
        mlpLoaded: mlpWeights !== null,  // C2: surface MLP status
        devices: deviceSummaries,
        fleet_summary: {
            total_devices: Object.keys(deviceSummaries).length,
            healthy: Object.values(deviceSummaries).filter(d => d.current_state === 'STABLE').length,
            warning: Object.values(deviceSummaries).filter(d => ['DOOR_OPEN', 'DRIFT_WARM', 'DRIFT_COLD', 'RECOVERING'].includes(d.current_state)).length,
            critical: Object.values(deviceSummaries).filter(d => ['EXCURSION', 'COMP_STRESS', 'FAULT'].includes(d.current_state)).length,
        },
    };
}

// ---- Kernel API Endpoints ----

app.get('/api/kernel/status', (req, res) => {
    const devices = {};
    for (const [deviceId, device] of Object.entries(kernelDevices)) {
        const lastReading = device.sensorWindow.length > 0
            ? device.sensorWindow[device.sensorWindow.length - 1]
            : null;
        devices[deviceId] = {
            device_id: deviceId,
            profile: KERNEL_DEVICE_PROFILES[deviceId]?.profile,
            location_name: KERNEL_DEVICE_PROFILES[deviceId]?.location_name,
            lat: KERNEL_DEVICE_PROFILES[deviceId]?.lat,
            lon: KERNEL_DEVICE_PROFILES[deviceId]?.lon,
            current_reading: lastReading,
            current_state: device.currentState,
            markov_maturity: device.markovEngine.maturity,
            total_transitions: device.markovEngine.totalTransitions,
        };
    }

    const summary = generateKernelSummary();

    res.json({
        simulator_running: kernelSimulatorRunning,
        tick: kernelSimulatorTick,
        devices,
        fleet_summary: summary.fleet_summary,
        mlpLoaded: mlpWeights !== null,  // C2: surface MLP status
    });
});

app.get('/api/kernel/device/:id/history', (req, res) => {
    const deviceId = req.params.id;
    const history = kernelHistory[deviceId] || [];
    const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit) || 100));  // S2: clamp [1, 1000]
    res.json({
        device_id: deviceId,
        history: history.slice(-limit),
        total: history.length,
    });
});

app.get('/api/kernel/device/:id/markov', (req, res) => {
    const deviceId = req.params.id;
    const device = kernelDevices[deviceId];
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }
    res.json({
        device_id: deviceId,
        ...getMarkovData(device.markovEngine),
    });
});

app.get('/api/kernel/device/:id/alerts', (req, res) => {
    const deviceId = req.params.id;
    const alerts = kernelAlerts[deviceId] || [];
    const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit) || 50));  // S2: clamp [1, 1000]
    res.json({
        device_id: deviceId,
        alerts: alerts.slice(-limit),
        total: alerts.length,
    });
});

app.get('/api/kernel/summary', (req, res) => {
    const summary = generateKernelSummary();
    res.json(summary);
});

app.post('/api/kernel/simulator/start', (req, res) => {
    startKernelSimulator();
    res.json({ status: 'started', running: kernelSimulatorRunning });
});

app.post('/api/kernel/simulator/stop', (req, res) => {
    stopKernelSimulator();
    res.json({ status: 'stopped', running: kernelSimulatorRunning });
});

// ---- Kernel Replay Endpoints ----

app.get('/api/kernel/replay/runs', async (req, res) => {
    try {
        await loadReplayIndex();
        const faultFilter = req.query.fault;
        const runs = [];
        for (const runId in kernelReplayIndex) {
            const entry = kernelReplayIndex[runId];
            if (!faultFilter || entry.fault === faultFilter) {
                runs.push({ run_id: parseInt(runId, 10), fault: entry.fault });
            }
        }
        res.json({ runs: runs, total: runs.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/kernel/replay/faults', async (req, res) => {
    try {
        await loadReplayIndex();
        res.json({ faults: kernelReplayFaults });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/kernel/replay/start', async (req, res) => {
    try {
        await loadReplayIndex();
        const runId = parseInt(req.body.runId, 10);
        // S2: validate runId is a valid integer
        if (isNaN(runId)) {
            return res.status(400).json({ error: 'Invalid runId: must be an integer' });
        }
        // S2: clamp speed to [1, 500]
        const speed = Math.max(1, Math.min(500, parseInt(req.body.speed, 10) || 1));
        if (!kernelReplayIndex[runId]) {
            return res.status(404).json({ error: 'Run not found: ' + runId });
        }
        const rows = await loadReplayRun(runId);
        kernelReplayData = interpolateToFiveSeconds(rows);
        startKernelReplay(runId, speed);
        res.json({ status: 'started', runId: runId, fault: kernelReplayIndex[runId].fault, speed: speed, totalReadings: kernelReplayData.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/kernel/replay/stop', (req, res) => {
    stopKernelReplay();
    res.json({ status: 'stopped', running: kernelReplayRunning });
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

    // Simulator disabled - real ESP32 hardware is now sending data
    // If you need to re-enable for testing, uncomment below:
    // if (!homeFreezerSimulatorRunning) {
    //     startHomeFreezerSimulator();
    // }

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

    // Send Kernel data
    socket.emit('initialKernelData', {
        devices: Object.fromEntries(
            Object.entries(kernelDevices).map(([id, device]) => [id, {
                device_id: id,
                profile: (KERNEL_DEVICE_PROFILES[id] && KERNEL_DEVICE_PROFILES[id].profile) || (device.profile && device.profile.profile) || 'unknown',
                location_name: (KERNEL_DEVICE_PROFILES[id] && KERNEL_DEVICE_PROFILES[id].location_name) || (device.profile && device.profile.location_name) || 'Unknown',
                lat: (KERNEL_DEVICE_PROFILES[id] && KERNEL_DEVICE_PROFILES[id].lat) || (device.profile && device.profile.lat) || 0,
                lon: (KERNEL_DEVICE_PROFILES[id] && KERNEL_DEVICE_PROFILES[id].lon) || (device.profile && device.profile.lon) || 0,
                current_reading: device.sensorWindow.length > 0
                    ? device.sensorWindow[device.sensorWindow.length - 1] : null,
                current_state: device.currentState,
                markov_maturity: device.markovEngine.maturity,
                total_transitions: device.markovEngine.totalTransitions,
            }])
        ),
        alerts: kernelAlerts,
        simulatorRunning: kernelSimulatorRunning,
        tick: kernelSimulatorTick,
        replayRunning: kernelReplayRunning,
        replayRunId: kernelReplayRunId,
        replayFault: kernelReplayRunning && kernelReplayIndex && kernelReplayIndex[kernelReplayRunId] ? kernelReplayIndex[kernelReplayRunId].fault : null,
        replaySpeed: kernelReplaySpeed,
        replayProgress: kernelReplayIdx,
        replayTotal: kernelReplayData ? kernelReplayData.length : 0,
        mlpLoaded: mlpWeights !== null,  // C2: surface MLP status
    });

    socket.on('startKernelSimulator', () => {
        startKernelSimulator();
    });

    socket.on('stopKernelSimulator', () => {
        stopKernelSimulator();
    });

    socket.on('startKernelReplay', async (data) => {
        try {
            await loadReplayIndex();
            const runId = parseInt(data.runId, 10);
            if (isNaN(runId)) return;  // S2: validate runId
            const speed = Math.max(1, Math.min(500, parseInt(data.speed, 10) || 1));  // S2: clamp [1, 500]
            if (!kernelReplayIndex[runId]) return;
            const rows = await loadReplayRun(runId);
            kernelReplayData = interpolateToFiveSeconds(rows);
            startKernelReplay(runId, speed);
        } catch (err) {
            console.error('Replay start error:', err.message);
        }
    });

    socket.on('stopKernelReplay', () => {
        stopKernelReplay();
    });

    socket.on('setKernelReplaySpeed', (data) => {
        if (!kernelReplayRunning) return;
        var newSpeed = Math.max(1, Math.min(500, parseInt(data.speed, 10) || 1));  // S2: clamp [1, 500]
        kernelReplaySpeed = newSpeed;
        var fault = kernelReplayIndex && kernelReplayIndex[kernelReplayRunId] ? kernelReplayIndex[kernelReplayRunId].fault : 'UNKNOWN';
        // Restart interval with new speed
        if (kernelReplayInterval) {
            clearInterval(kernelReplayInterval);
            var intervalMs = Math.max(10, Math.round(5000 / newSpeed));
            // C3 fix: do NOT reinitialize stateBreakdown — reuse module-level kernelReplayStateBreakdown

            kernelReplayInterval = setInterval(function() {
                if (kernelReplayIdx >= kernelReplayData.length) {
                    clearInterval(kernelReplayInterval);
                    kernelReplayInterval = null;
                    kernelReplayRunning = false;
                    var totalClassifications = 0;
                    for (var k in kernelReplayStateBreakdown) totalClassifications += kernelReplayStateBreakdown[k];

                    // S3: compute accuracy metrics
                    var accuracyMetrics = computeReplayAccuracyMetrics();

                    io.emit('kernelReplayComplete', { runId: kernelReplayRunId, fault: fault, stateBreakdown: kernelReplayStateBreakdown, totalClassifications: totalClassifications, accuracy: accuracyMetrics });
                    io.emit('kernelReplayStatus', { running: false, runId: kernelReplayRunId, fault: fault, speed: newSpeed, progress: kernelReplayData.length, total: kernelReplayData.length });

                    // Clean up replay device (C1 fix)
                    delete kernelDevices[REPLAY_DEVICE_ID];
                    delete kernelHistory[REPLAY_DEVICE_ID];
                    delete kernelAlerts[REPLAY_DEVICE_ID];
                    return;
                }

                var reading = kernelReplayData[kernelReplayIdx];
                var device = kernelDevices[REPLAY_DEVICE_ID];
                kernelReplayIdx++;

                device.sensorWindow.push(reading);
                if (device.sensorWindow.length > 24) device.sensorWindow.shift();

                var classification = null;
                if (device.sensorWindow.length >= 6) {
                    classification = classifySensorData(device.sensorWindow);
                    if (classification) {
                        kernelReplayStateBreakdown[classification.state_name] = (kernelReplayStateBreakdown[classification.state_name] || 0) + 1;

                        // S3: track confusion matrix and method counts
                        kernelReplayMethodCounts[classification.method] = (kernelReplayMethodCounts[classification.method] || 0) + 1;
                        if (reading._ground_truth) {
                            var gt = reading._ground_truth;
                            if (!kernelReplayConfusionMatrix[gt]) kernelReplayConfusionMatrix[gt] = {};
                            kernelReplayConfusionMatrix[gt][classification.state_name] = (kernelReplayConfusionMatrix[gt][classification.state_name] || 0) + 1;
                        }

                        var prevState = device.currentState;
                        device.currentState = classification;
                        if (prevState !== null) {
                            var timePeriod = getTimePeriod(new Date(reading.timestamp));
                            var learned = markovLearn(device.markovEngine, prevState.state, classification.state, timePeriod, classification.confidence, classification.sensor_consistency);
                            if (learned) {
                                var anomaly = checkMarkovAnomaly(device.markovEngine, prevState.state, classification.state, timePeriod);
                                if (anomaly) {
                                    anomaly.device_id = REPLAY_DEVICE_ID;
                                    anomaly.timestamp = reading.timestamp;
                                    anomaly.classification = classification;
                                    if (!kernelAlerts[REPLAY_DEVICE_ID]) kernelAlerts[REPLAY_DEVICE_ID] = [];
                                    kernelAlerts[REPLAY_DEVICE_ID].push(anomaly);
                                    if (kernelAlerts[REPLAY_DEVICE_ID].length > KERNEL_MAX_ALERTS) kernelAlerts[REPLAY_DEVICE_ID].shift();
                                    io.emit('kernelAlert', anomaly);
                                }
                            }
                        }
                    }
                }

                kernelHistory[REPLAY_DEVICE_ID] = kernelHistory[REPLAY_DEVICE_ID] || [];
                kernelHistory[REPLAY_DEVICE_ID].push(Object.assign({}, reading, { classification: classification }));
                if (kernelHistory[REPLAY_DEVICE_ID].length > KERNEL_MAX_HISTORY) kernelHistory[REPLAY_DEVICE_ID].shift();

                io.emit('kernelStateUpdate', {
                    device_id: REPLAY_DEVICE_ID, reading: reading, classification: classification,
                    markov_maturity: device.markovEngine.maturity, total_transitions: device.markovEngine.totalTransitions,
                    ground_truth: reading._ground_truth,
                });

                if (kernelReplayIdx % 100 === 0) {
                    io.emit('kernelReplayStatus', { running: true, runId: kernelReplayRunId, fault: fault, speed: newSpeed, progress: kernelReplayIdx, total: kernelReplayData.length });
                }
            }, intervalMs);
        }
        io.emit('kernelReplayStatus', { running: true, runId: kernelReplayRunId, fault: fault, speed: newSpeed, progress: kernelReplayIdx, total: kernelReplayData.length });
    });

    // ── PCBA Kernel Socket Events ──
    socket.emit('initialPcbaKernelData', {
        devices: Object.fromEntries(Object.entries(pcbaDevices).map(([id, d]) => [id, {
            device_id: id, profile: d.profile.name, location_name: d.profile.location_name,
            lat: d.profile.lat, lon: d.profile.lon,
            current_state: d.currentState, markov_maturity: d.markovEngine.maturity,
            total_transitions: d.markovEngine.totalTransitions,
        }])),
        alerts: pcbaAlerts,
        simulatorRunning: pcbaSimulatorRunning,
        tick: pcbaSimulatorTick,
        pcbaMlpLoaded: !!pcbaMlpWeights,
    });

    socket.on('startPcbaSimulator', () => startPcbaSimulator());
    socket.on('stopPcbaSimulator', () => stopPcbaSimulator());

    socket.on('disconnect', () => {
        console.log('📴 Dashboard client disconnected:', socket.id);
    });
});

// ==================== PCBA KERNEL SIGNAL INTELLIGENCE ====================
// Parallel path: 14-feature pipeline from temp + vibration (accelerometer) + door
// Uses real PCBA hardware sensors: DS18B20, MPU6050, MC-38

// PCBA MLP weights loading
let pcbaMlpWeights = null;
try {
    const pcbaWeightsPath = path.join(__dirname, 'kernel', 'pcba_mlp_weights.json');
    if (fs.existsSync(pcbaWeightsPath)) {
        pcbaMlpWeights = JSON.parse(fs.readFileSync(pcbaWeightsPath, 'utf8'));
        console.log('🧠 PCBA Kernel MLP weights loaded successfully');
    } else {
        console.log('⚠️ PCBA Kernel MLP weights not found — will use rules-only classification');
    }
} catch (e) {
    console.log('⚠️ Failed to load PCBA Kernel MLP weights:', e.message);
}

// PCBA in-memory stores (parallel to existing kernel stores)
const pcbaDevices = {};
const pcbaHistory = {};
const pcbaAlerts = {};
let pcbaSimulatorRunning = false;
let pcbaSimulatorInterval = null;
let pcbaSimulatorTick = 0;
const PCBA_MAX_HISTORY = 200;
const PCBA_MAX_ALERTS = 50;
const PCBA_NOISE_THRESHOLD = 0.1;

// ── PCBA Feature Computation ──────────────────────────────────────

function computePcbaFeatures(blockWindow) {
    if (!blockWindow || blockWindow.length < 2) return null;

    let sensorWindow = blockWindow.slice();
    sensorWindow = sensorWindow.filter(function(b) {
        return Number.isFinite(b.temp) && Number.isFinite(b.block_rms) &&
               Number.isFinite(b.block_dom_freq) && Number.isFinite(b.block_spectral_entropy);
    });
    if (sensorWindow.length < 2) return null;

    const temps = sensorWindow.map(b => b.temp);
    const rmsValues = sensorWindow.map(b => b.block_rms);
    const domFreqs = sensorWindow.map(b => b.block_dom_freq);
    const entropies = sensorWindow.map(b => b.block_spectral_entropy);

    const lastBlock = sensorWindow[sensorWindow.length - 1];

    // Temperature domain (4 features)
    const tempMean = mean(temps);
    const tempDelta = temps[temps.length - 1] - temps[0];
    const tempRate = linearRegSlope(temps);
    const tempVolatility = stddev(temps);

    // Vibration domain (6 features)
    const vibRms = mean(rmsValues);
    const vibRmsDelta = rmsValues[rmsValues.length - 1] - rmsValues[0];
    const vibDomFreq = mean(domFreqs);
    const freqMean = mean(domFreqs);
    const freqStd = stddev(domFreqs);
    const vibSpectralStability = freqMean > 0 ? Math.max(0, Math.min(1, 1 - freqStd / freqMean)) : 0;
    const vibSpectralEntropy = mean(entropies);
    const activeBlocks = rmsValues.filter(r => r > PCBA_NOISE_THRESHOLD).length;
    const vibDutyCycle = rmsValues.length > 0 ? activeBlocks / rmsValues.length : 0;

    // Door domain (2 features) — accelerometer gravity vector derived
    const doorAngleDeg = Number.isFinite(lastBlock.door_angle_deg) ? lastBlock.door_angle_deg : 0;
    const doorAngleNorm = Math.max(0, Math.min(1, doorAngleDeg / 180));
    const doorOpenDuration = lastBlock.door_open_duration_s || 0;

    // Cross-domain (2 features)
    const epsilon = 0.01;
    let coolingEfficiencyProxy = 0;
    if (vibDutyCycle > 0.3 && vibRms > epsilon) {
        coolingEfficiencyProxy = Math.min(1, Math.abs(tempRate) / (vibRms + epsilon));
    }

    const tempRates = [];
    for (let i = 1; i < temps.length; i++) {
        tempRates.push(temps[i] - temps[i - 1]);
    }
    const tempRateVsVib = correlation(tempRates, rmsValues.slice(1));

    return {
        temp_mean: tempMean,
        temp_delta: tempDelta,
        temp_rate: tempRate,
        temp_volatility: tempVolatility,
        vib_rms: vibRms,
        vib_rms_delta: vibRmsDelta,
        vib_dom_freq: vibDomFreq,
        vib_spectral_stability: vibSpectralStability,
        vib_spectral_entropy: vibSpectralEntropy,
        vib_duty_cycle: vibDutyCycle,
        door_angle_norm: doorAngleNorm,
        door_open_duration: doorOpenDuration,
        cooling_efficiency_proxy: Math.max(0, Math.min(1, coolingEfficiencyProxy)),
        temp_rate_vs_vib: tempRateVsVib,
    };
}

// ── PCBA Rule Classifier ──────────────────────────────────────────

function pcbaRuleClassify(features) {
    // 1. DOOR_OPEN: accelerometer gravity vector angle > threshold
    if (features.door_angle_norm > 0.15) {
        return { state: 1, state_name: 'DOOR_OPEN', confidence: 0.95, method: 'rule' };
    }
    // 2. DEFROST: inferred from low duty cycle + temp rising
    //    No volatility check — defrost has controlled but significant temp rise
    if (features.vib_duty_cycle < 0.2 && features.temp_rate > 0.05) {
        return { state: 3, state_name: 'DEFROST', confidence: 0.90, method: 'rule' };
    }
    // 3. STABLE: low volatility + small delta + small rate + steady vibration
    if (features.temp_volatility < 0.4 && Math.abs(features.temp_delta) < 1.0 &&
        Math.abs(features.temp_rate) < 0.05 && features.vib_spectral_stability > 0.85) {
        return { state: 0, state_name: 'STABLE', confidence: 0.95, method: 'rule' };
    }
    // 4. RECOVERING: negative temp_rate + high vib_rms
    if (features.temp_rate < -0.05 && features.vib_rms > 0.5) {
        return { state: 2, state_name: 'RECOVERING', confidence: 0.90, method: 'rule' };
    }
    // NO FAULT rule — PCBA has no fault bus
    return null;
}

// ── PCBA MLP Classifier ──────────────────────────────────────────

function pcbaMlpClassify(features) {
    if (!pcbaMlpWeights) return null;

    const featureArray = [
        features.temp_mean, features.temp_delta, features.temp_rate, features.temp_volatility,
        features.vib_rms, features.vib_rms_delta, features.vib_dom_freq, features.vib_spectral_stability,
        features.vib_spectral_entropy, features.vib_duty_cycle,
        features.door_angle_norm, features.door_open_duration,
        features.cooling_efficiency_proxy, features.temp_rate_vs_vib,
    ];

    const probabilities = mlpForward(featureArray, pcbaMlpWeights);
    if (!probabilities) return null;

    let maxIdx = 0;
    for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > probabilities[maxIdx]) maxIdx = i;
    }

    return {
        state: maxIdx,
        state_name: KERNEL_STATES[maxIdx],
        confidence: probabilities[maxIdx],
        method: 'mlp',
        probabilities: probabilities,
    };
}

// ── PCBA Sensor Cross-Validation ──────────────────────────────────

function pcbaSensorCrossValidation(state, features) {
    let score = 1.0;
    const penalties = [];

    switch (state) {
        case 0: // STABLE
            if (features.temp_volatility > 1.0) { score -= 0.3; penalties.push('high_volatility'); }
            if (Math.abs(features.temp_rate) > 0.1) { score -= 0.2; penalties.push('temp_changing'); }
            if (features.vib_spectral_stability < 0.7) { score -= 0.3; penalties.push('unstable_vibration'); }
            break;
        case 1: // DOOR_OPEN
            if (features.door_angle_norm < 0.15) { score -= 0.5; penalties.push('door_closed'); }
            break;
        case 2: // RECOVERING
            if (features.temp_rate >= 0) { score -= 0.3; penalties.push('not_cooling'); }
            if (features.vib_rms < 0.3) { score -= 0.2; penalties.push('low_vibration'); }
            break;
        case 3: // DEFROST
            if (features.vib_duty_cycle > 0.5) { score -= 0.3; penalties.push('compressor_running'); }
            break;
        case 4: // DRIFT_WARM
            if (features.temp_rate <= 0) { score -= 0.3; penalties.push('not_warming'); }
            if (features.vib_duty_cycle < 0.3) { score -= 0.2; penalties.push('low_duty_cycle'); }
            break;
        case 5: // DRIFT_COLD
            if (features.temp_rate >= 0) { score -= 0.3; penalties.push('not_cooling'); }
            if (features.vib_duty_cycle < 0.3) { score -= 0.2; penalties.push('low_duty_cycle'); }
            break;
        case 6: // EXCURSION
            if (features.temp_mean < -15) { score -= 0.4; penalties.push('temp_normal'); }
            break;
        case 7: // COMP_STRESS
            if (features.vib_spectral_entropy < 3.0) { score -= 0.3; penalties.push('low_spectral_entropy'); }
            if (features.vib_spectral_stability > 0.85) { score -= 0.2; penalties.push('vibration_stable'); }
            break;
        case 8: // FAULT
            if (features.vib_rms > 0.3 && features.vib_spectral_stability > 0.8) { score -= 0.3; penalties.push('systems_ok'); }
            break;
    }

    return { score: Math.max(0, score), penalties: penalties };
}

// ── PCBA Full Classification Pipeline ─────────────────────────────

function classifyPcbaSensorData(blockWindow) {
    const features = computePcbaFeatures(blockWindow);
    if (!features) return null;

    // Stage 1: Rule-based classification
    let result = pcbaRuleClassify(features);

    // Stage 2: MLP classification (if rules didn't match)
    if (!result) {
        result = pcbaMlpClassify(features);
    }

    // Stage 3: Heuristic fallback
    if (!result) {
        if (features.temp_rate < -0.05 && features.vib_rms > 0.4) {
            result = { state: 2, state_name: 'RECOVERING', confidence: 0.7, method: 'heuristic' };
        } else if (features.temp_rate > 0.02 && features.temp_mean > -18) {
            result = { state: 4, state_name: 'DRIFT_WARM', confidence: 0.6, method: 'heuristic' };
        } else if (features.temp_rate < -0.02 && features.temp_mean < -22) {
            result = { state: 5, state_name: 'DRIFT_COLD', confidence: 0.6, method: 'heuristic' };
        } else if (features.temp_mean > -8) {
            result = { state: 6, state_name: 'EXCURSION', confidence: 0.7, method: 'heuristic' };
        } else if (features.vib_spectral_entropy > 3.5 || features.vib_spectral_stability < 0.5) {
            result = { state: 7, state_name: 'COMP_STRESS', confidence: 0.6, method: 'heuristic' };
        } else if (features.vib_duty_cycle < 0.2 && features.vib_rms < 0.1) {
            result = { state: 8, state_name: 'FAULT', confidence: 0.5, method: 'heuristic' };
        } else {
            result = { state: 0, state_name: 'STABLE', confidence: 0.5, method: 'heuristic' };
        }
    }

    // Stage 4: Sensor cross-validation
    const crossVal = pcbaSensorCrossValidation(result.state, features);

    return {
        state: result.state,
        state_name: result.state_name,
        confidence: result.confidence,
        method: result.method,
        sensor_consistency: crossVal.score,
        consistency_penalties: crossVal.penalties,
        feature_snapshot: features,
        timestamp: new Date().toISOString(),
    };
}

// ── PCBA Device Profiles ──────────────────────────────────────────

const PCBA_DEVICE_PROFILES = {
    PCBA_001: {
        name: 'Bristol Cold Store',
        lat: 51.4545, lon: -2.5879,
        location_name: 'Bristol, UK',
        profile: 'healthy',
        doorProb: 0.02, faultProb: 0.0001,
        targetTemp: -20, baseVibRms: 0.30, baseFreq: 50,
    },
    PCBA_002: {
        name: 'Leeds Distribution',
        lat: 53.8008, lon: -1.5491,
        location_name: 'Leeds, UK',
        profile: 'problematic',
        doorProb: 0.15, faultProb: 0.002,
        targetTemp: -18, baseVibRms: 0.35, baseFreq: 52,
    },
    PCBA_003: {
        name: 'Edinburgh Pharma Depot',
        lat: 55.9533, lon: -3.1883,
        location_name: 'Edinburgh, UK',
        profile: 'degrading',
        doorProb: 0.05, faultProb: 0.001,
        targetTemp: -20, baseVibRms: 0.32, baseFreq: 51,
        degradationRate: 0.0005,
    },
    PCBA_004: {
        name: 'Cardiff Seafood Hub',
        lat: 51.4816, lon: -3.1791,
        location_name: 'Cardiff, UK',
        profile: 'healthy',
        doorProb: 0.03, faultProb: 0.0002,
        targetTemp: -22, baseVibRms: 0.28, baseFreq: 50,
    },
};

// ── PCBA Device Init & Simulation ─────────────────────────────────

function initPcbaDevice(deviceId, profile) {
    return {
        deviceId: deviceId,
        profile: profile,
        temp: profile.targetTemp + (Math.random() - 0.5) * 2,
        compressorOn: true,
        inFault: false,
        vibRms: profile.baseVibRms,
        vibDomFreq: profile.baseFreq,
        vibSpectralEntropy: 2.1,
        doorAngle: 0,
        doorTimer: 0,
        defrostOn: false,
        defrostTimer: 0,
        degradation: 0,
        blockWindow: [],
        currentState: null,
        markovEngine: createMarkovEngine(),
    };
}

function simulatePcbaTick(device) {
    const p = device.profile;

    // Degradation
    if (p.degradationRate) {
        device.degradation += p.degradationRate;
    }

    // Door events (accelerometer gravity vector — continuous angle)
    if (device.doorAngle < 5 && Math.random() < p.doorProb) {
        device.doorAngle = 70 + Math.random() * 40; // 70-110° open angle
        device.doorTimer = 10 + Math.random() * 40;
    }
    if (device.doorAngle > 5) {
        device.doorTimer -= 5;
        if (device.doorTimer <= 0) { device.doorAngle = 1 + Math.random() * 2; device.doorTimer = 0; }
    }

    // Defrost cycles (triggered by frost buildup proxy — use degradation as proxy)
    if (!device.defrostOn && device.degradation > 0.1 && Math.random() < 0.005) {
        device.defrostOn = true;
        device.defrostTimer = 30 + Math.random() * 30;
        device.compressorOn = false;
    }
    if (device.defrostOn) {
        device.defrostTimer -= 5;
        if (device.defrostTimer <= 0) {
            device.defrostOn = false;
            if (!device.inFault) {
                device.compressorOn = true;
            }
        }
    }

    // Temperature physics
    if (device.doorAngle > 5) device.temp += 0.005 * (22 - device.temp);
    if (device.compressorOn && !device.defrostOn) {
        device.temp += 0.003 * (p.targetTemp - device.temp);
    } else if (device.defrostOn) {
        device.temp += 0.002 * (22 - device.temp); // Warming during defrost
    }
    // Ambient leak
    device.temp += 0.001 * (22 - device.temp);
    // Noise
    device.temp += (Math.random() - 0.5) * 0.1;

    // Fault injection
    if (!device.inFault && Math.random() < (p.faultProb + device.degradation * 0.01)) {
        device.inFault = true;
        device.compressorOn = false;
    } else if (device.inFault && Math.random() < 0.05) {
        device.inFault = false;
        if (!device.defrostOn) {
            device.compressorOn = true;
        }
    }

    // Vibration physics
    if (device.inFault) {
        device.vibRms = 0.02 + Math.random() * 0.06;
        device.vibDomFreq = 10 + Math.random() * 15;
        device.vibSpectralEntropy = 3.5 + Math.random();
    } else if (device.compressorOn && !device.defrostOn) {
        // Normal operation with load-based variation
        const load = Math.abs(device.temp - p.targetTemp) / 10;
        device.vibRms = p.baseVibRms + load * 0.1 + (Math.random() - 0.5) * 0.02;
        device.vibDomFreq = p.baseFreq + load * 5 + (Math.random() - 0.5) * 1;
        device.vibSpectralEntropy = 2.1 + load * 0.3 + (Math.random() - 0.5) * 0.2;

        // Degradation increases stress
        if (device.degradation > 0.05) {
            device.vibRms += device.degradation * 0.5;
            device.vibDomFreq += device.degradation * 10 + (Math.random() - 0.5) * 3;
            device.vibSpectralEntropy += device.degradation * 2;
        }
    } else if (device.defrostOn) {
        // Compressor off
        device.vibRms = 0.02 + Math.random() * 0.03;
        device.vibDomFreq = 2 + Math.random() * 3;
        device.vibSpectralEntropy = 3.5 + Math.random() * 0.5;
    }

    // Clamp vibration
    device.vibRms = Math.max(0, device.vibRms);
    device.vibDomFreq = Math.max(0, device.vibDomFreq);
    device.vibSpectralEntropy = Math.max(0, device.vibSpectralEntropy);

    // Build PCBA block
    const doorOpen = device.doorAngle > 5;
    const block = {
        temp: Math.round(device.temp * 10) / 10,
        block_rms: Math.round(device.vibRms * 1000) / 1000,
        block_dom_freq: Math.round(device.vibDomFreq * 10) / 10,
        block_spectral_entropy: Math.round(device.vibSpectralEntropy * 100) / 100,
        door_angle_deg: Math.round(device.doorAngle * 10) / 10,
        door_open_duration_s: doorOpen ? Math.max(0, Math.round((10 + Math.random() * 40 - device.doorTimer))) : 0,
        timestamp: new Date().toISOString(),
    };

    // Rolling window (max 24 blocks = 120 seconds at 5s per block)
    device.blockWindow.push(block);
    if (device.blockWindow.length > 24) device.blockWindow.shift();

    // Classification (need at least 6 blocks)
    let classification = null;
    if (device.blockWindow.length >= 6) {
        classification = classifyPcbaSensorData(device.blockWindow);

        if (classification) {
            const prevState = device.currentState;
            device.currentState = classification;

            // Markov learning
            if (prevState && prevState.state !== classification.state) {
                const tp = getTimePeriod(new Date());
                const learned = markovLearn(device.markovEngine, prevState.state, classification.state, tp, classification.confidence, classification.sensor_consistency);
                if (learned) {
                    const anomaly = checkMarkovAnomaly(device.markovEngine, prevState.state, classification.state, tp);
                    if (anomaly) {
                        anomaly.device_id = device.deviceId;
                        anomaly.classification = classification;
                        anomaly.timestamp = new Date().toISOString();
                        pcbaAlerts[device.deviceId] = pcbaAlerts[device.deviceId] || [];
                        pcbaAlerts[device.deviceId].push(anomaly);
                        if (pcbaAlerts[device.deviceId].length > PCBA_MAX_ALERTS) pcbaAlerts[device.deviceId].shift();
                        io.emit('pcbaKernelAlert', anomaly);
                    }
                }
            }
        }
    }

    return { block: block, classification: classification };
}

// ── PCBA Simulator Start/Stop ─────────────────────────────────────

function startPcbaSimulator() {
    if (pcbaSimulatorRunning) return;
    pcbaSimulatorRunning = true;
    // Clear stale data from previous run
    Object.keys(pcbaDevices).forEach(function(k) { delete pcbaDevices[k]; });
    Object.keys(pcbaHistory).forEach(function(k) { delete pcbaHistory[k]; });
    Object.keys(pcbaAlerts).forEach(function(k) { delete pcbaAlerts[k]; });
    pcbaSimulatorTick = 0;

    // Initialize devices
    Object.keys(PCBA_DEVICE_PROFILES).forEach(deviceId => {
        const profile = PCBA_DEVICE_PROFILES[deviceId];
        pcbaDevices[deviceId] = initPcbaDevice(deviceId, profile);
    });

    console.log('🔬 PCBA Kernel simulator started with', Object.keys(PCBA_DEVICE_PROFILES).length, 'devices');

    pcbaSimulatorInterval = setInterval(() => {
        pcbaSimulatorTick++;

        Object.keys(pcbaDevices).forEach(deviceId => {
            const device = pcbaDevices[deviceId];
            const { block, classification } = simulatePcbaTick(device);

            // Store history
            pcbaHistory[deviceId] = pcbaHistory[deviceId] || [];
            pcbaHistory[deviceId].push(Object.assign({}, block, { classification: classification }));
            if (pcbaHistory[deviceId].length > PCBA_MAX_HISTORY) pcbaHistory[deviceId].shift();

            // Emit state update
            io.emit('pcbaKernelStateUpdate', {
                device_id: deviceId,
                block: block,
                classification: classification,
                markov_maturity: device.markovEngine.maturity,
                total_transitions: device.markovEngine.totalTransitions,
            });
        });

        // Emit summary every 12 ticks (60 seconds)
        if (pcbaSimulatorTick % 12 === 0) {
            io.emit('pcbaKernelSummary', generatePcbaKernelSummary());
        }
    }, 5000);

    io.emit('pcbaKernelSimulatorStatus', { running: true, tick: 0 });
}

function stopPcbaSimulator() {
    if (!pcbaSimulatorRunning) return;
    pcbaSimulatorRunning = false;
    if (pcbaSimulatorInterval) { clearInterval(pcbaSimulatorInterval); pcbaSimulatorInterval = null; }
    console.log('🛑 PCBA Kernel simulator stopped at tick', pcbaSimulatorTick);
    io.emit('pcbaKernelSimulatorStatus', { running: false, tick: pcbaSimulatorTick });
}

function generatePcbaKernelSummary() {
    const now = new Date();
    const devices = Object.values(pcbaDevices).map(d => ({
        device_id: d.deviceId,
        profile: d.profile.name,
        location_name: d.profile.location_name,
        lat: d.profile.lat,
        lon: d.profile.lon,
        current_state: d.currentState ? d.currentState.state_name : 'UNKNOWN',
        confidence: d.currentState ? d.currentState.confidence : 0,
        method: d.currentState ? d.currentState.method : 'none',
        sensor_consistency: d.currentState ? d.currentState.sensor_consistency : 0,
        markov_maturity: d.markovEngine.maturity,
        total_transitions: d.markovEngine.totalTransitions,
        temp: d.temp,
        vib_rms: d.vibRms,
        vib_dom_freq: d.vibDomFreq,
    }));

    const stateCounts = {};
    KERNEL_STATES.forEach(s => { stateCounts[s] = 0; });
    devices.forEach(d => { if (d.current_state in stateCounts) stateCounts[d.current_state]++; });

    const recentAlerts = [];
    Object.values(pcbaAlerts).forEach(alerts => {
        alerts.forEach(a => {
            if (now - new Date(a.timestamp) < 120000) recentAlerts.push(a);
        });
    });

    return {
        device_count: devices.length,
        devices: devices,
        state_distribution: stateCounts,
        active_alerts: recentAlerts.length,
        alerts: recentAlerts.slice(-10),
        simulator_running: pcbaSimulatorRunning,
        tick: pcbaSimulatorTick,
        timestamp: now.toISOString(),
    };
}

// ── PCBA API Endpoints ────────────────────────────────────────────

app.get('/api/kernel-pcba/status', (req, res) => {
    res.json(generatePcbaKernelSummary());
});

app.get('/api/kernel-pcba/device/:id/history', (req, res) => {
    const id = req.params.id;
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 100));
    const history = (pcbaHistory[id] || []).slice(-limit);
    res.json({ device_id: id, history: history, count: history.length });
});

app.get('/api/kernel-pcba/device/:id/markov', (req, res) => {
    const id = req.params.id;
    const device = pcbaDevices[id];
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ device_id: id, markov: getMarkovData(device.markovEngine) });
});

app.get('/api/kernel-pcba/device/:id/alerts', (req, res) => {
    const id = req.params.id;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const alerts = (pcbaAlerts[id] || []).slice(-limit);
    res.json({ device_id: id, alerts: alerts, count: alerts.length });
});

app.post('/api/kernel-pcba/data', (req, res) => {
    const data = req.body;
    if (!data || !data.device_id) return res.status(400).json({ error: 'device_id required' });

    const deviceId = data.device_id;
    if (typeof deviceId !== 'string' || deviceId.length < 1 || deviceId.length > 50 || !/^[A-Za-z0-9_-]+$/.test(deviceId)) {
        return res.status(400).json({ error: 'invalid device_id format' });
    }

    const numericFields = ['temp', 'block_rms', 'block_dom_freq', 'block_spectral_entropy'];
    for (let i = 0; i < numericFields.length; i++) {
        const field = numericFields[i];
        if (!Number.isFinite(data[field])) {
            return res.status(400).json({ error: field + ' must be a finite number' });
        }
    }
    if (data.block_rms < 0 || data.block_dom_freq < 0 || data.block_spectral_entropy < 0) {
        return res.status(400).json({ error: 'vibration metrics must be non-negative' });
    }
    const doorAngleDeg = Number.isFinite(data.door_angle_deg) ? data.door_angle_deg : 0;
    if (doorAngleDeg < 0 || doorAngleDeg > 180) {
        return res.status(400).json({ error: 'door_angle_deg must be between 0 and 180' });
    }
    const doorOpenDuration = Number.isFinite(data.door_open_duration_s) ? data.door_open_duration_s : 0;
    if (doorOpenDuration < 0) {
        return res.status(400).json({ error: 'door_open_duration_s must be non-negative' });
    }

    const isNewDevice = !pcbaDevices[deviceId];
    if (isNewDevice && Object.keys(pcbaDevices).length >= 100) {
        return res.status(429).json({ error: 'device limit reached' });
    }

    // Auto-create device if not exists
    if (!pcbaDevices[deviceId]) {
        pcbaDevices[deviceId] = initPcbaDevice(deviceId, {
            name: deviceId,
            lat: data.lat || 0, lon: data.lon || 0,
            location_name: data.location_name || 'Unknown',
            profile: 'external',
            doorProb: 0, faultProb: 0,
            targetTemp: -20, baseVibRms: 0.30, baseFreq: 50,
        });
    }

    const device = pcbaDevices[deviceId];
    const block = {
        temp: data.temp,
        block_rms: data.block_rms,
        block_dom_freq: data.block_dom_freq,
        block_spectral_entropy: data.block_spectral_entropy,
        door_angle_deg: doorAngleDeg,
        door_open_duration_s: doorOpenDuration,
        timestamp: data.timestamp || new Date().toISOString(),
    };

    device.blockWindow.push(block);
    if (device.blockWindow.length > 24) device.blockWindow.shift();

    let classification = null;
    if (device.blockWindow.length >= 6) {
        classification = classifyPcbaSensorData(device.blockWindow);
        if (classification) device.currentState = classification;
    }

    pcbaHistory[deviceId] = pcbaHistory[deviceId] || [];
    pcbaHistory[deviceId].push(Object.assign({}, block, { classification: classification }));
    if (pcbaHistory[deviceId].length > PCBA_MAX_HISTORY) pcbaHistory[deviceId].shift();

    io.emit('pcbaKernelStateUpdate', {
        device_id: deviceId, block: block, classification: classification,
        markov_maturity: device.markovEngine.maturity,
        total_transitions: device.markovEngine.totalTransitions,
    });

    res.json({ status: 'ok', device_id: deviceId, classification: classification });
});

app.post('/api/kernel-pcba/simulator/start', (req, res) => {
    startPcbaSimulator();
    res.json({ status: 'started', devices: Object.keys(PCBA_DEVICE_PROFILES) });
});

app.post('/api/kernel-pcba/simulator/stop', (req, res) => {
    stopPcbaSimulator();
    res.json({ status: 'stopped', tick: pcbaSimulatorTick });
});

// ==================== START SERVER ====================

httpServer.listen(PORT, '0.0.0.0', async () => {
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
    console.log(`👉 Kernel Intelligence: http://localhost:4001/kernel`);
    console.log(`👉 PCBA Kernel: http://localhost:4001/kernel (PCBA tab)`);

    // Load historical fleet data from Supabase
    await loadFleetDataFromSupabase();
});
