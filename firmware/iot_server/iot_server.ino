/*
 * IoT Server - ESP32 Firmware with OTA Updates
 *
 * Sends car telemetry and weather data to server.
 * Supports Over-The-Air (OTA) firmware updates via HTTPS.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION
// ==========================================
const char* ssid     = "Starlink wide";
const char* password = "oghouse25";

// Server Endpoints
const char* serverUrl = "https://iot-dashboard-dij1.onrender.com/api/data";
const char* SERVER_BASE = "https://iot-dashboard-dij1.onrender.com";
const char* DEVICE_TYPE = "iot_server";

// ⚠️ INCREMENT THIS when you push new code!
const char* FIRMWARE_VERSION = "1.0.0";

// --- TIMING CONFIGURATION ---
const long CAR_INTERVAL = 500;           // Car updates every 0.5 seconds
const long WEATHER_INTERVAL = 10000;     // Weather updates every 10 seconds
const long OTA_CHECK_INTERVAL = 3600000; // Check for updates every hour (1hr = 3600000ms)

// Timers
unsigned long lastCarUpdate = 0;
unsigned long lastWeatherUpdate = 0;
unsigned long lastOtaCheck = 0;

// Simulation Variables
float carSpeed = 0;
float carRPM = 800;
float weatherTemp = 24.0;
float weatherPressure = 1013.0;

// Function Declarations
void sendData(String jsonPayload);
void checkForOTAUpdate();
void performOTAUpdate();

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.println("\n========================================");
  Serial.println("IoT Server ESP32 Firmware");
  Serial.printf("Version: %s\n", FIRMWARE_VERSION);
  Serial.println("========================================");

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected! IP: " + WiFi.localIP().toString());

  // Check for OTA updates immediately on boot
  Serial.println("🔍 Checking for firmware updates...");
  checkForOTAUpdate();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();

    // ==================================================
    // TASK 1: CAR TELEMETRY (Fast Update)
    // ==================================================
    if (now - lastCarUpdate >= CAR_INTERVAL) {
      lastCarUpdate = now;

      float throttle = random(0, 100);
      if (throttle > 50) carSpeed += 2.5;
      else carSpeed -= 1.5;

      if (carSpeed < 0) carSpeed = 0;
      if (carSpeed > 160) carSpeed = 160;

      if (carSpeed == 0) carRPM = 800 + random(-20, 20);
      else carRPM = 1500 + (carSpeed * 25) + random(-50, 50);

      String json = "{";
      json += "\"sensor_type\": \"car_telemetry\",";
      json += "\"device_id\": \"OBD_UNIT_01\",";
      json += "\"timestamp\": " + String(now) + ",";
      json += "\"speed_kmh\": " + String(carSpeed) + ",";
      json += "\"rpm\": " + String(carRPM) + ",";
      json += "\"throttle_pos\": " + String(throttle) + ",";
      json += "\"firmware_version\": \"" + String(FIRMWARE_VERSION) + "\"";
      json += "}";

      sendData(json);
    }

    // ==================================================
    // TASK 2: WEATHER STATION (Slow Update)
    // ==================================================
    if (now - lastWeatherUpdate >= WEATHER_INTERVAL) {
      lastWeatherUpdate = now;

      weatherTemp += (random(-10, 10) / 10.0);
      weatherPressure += (random(-20, 20) / 10.0);

      String json = "{";
      json += "\"sensor_type\": \"weather_station\",";
      json += "\"device_id\": \"METEO_UNIT_01\",";
      json += "\"timestamp\": " + String(now) + ",";
      json += "\"temp_c\": " + String(weatherTemp) + ",";
      json += "\"pressure_hpa\": " + String(weatherPressure) + ",";
      json += "\"firmware_version\": \"" + String(FIRMWARE_VERSION) + "\"";
      json += "}";

      sendData(json);
    }

    // ==================================================
    // TASK 3: OTA UPDATE CHECK (Every Hour)
    // ==================================================
    if (now - lastOtaCheck >= OTA_CHECK_INTERVAL) {
      lastOtaCheck = now;
      checkForOTAUpdate();
    }

  } else {
    Serial.println("⚠️ WiFi Lost. Retrying...");
    WiFi.reconnect();
    delay(5000);
  }
}

// --- HELPER: SEND DATA ---
void sendData(String jsonPayload) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(jsonPayload);

  if (responseCode > 0) {
    Serial.println("📡 Sent: " + jsonPayload);
  } else {
    Serial.println("❌ Error sending data: " + String(responseCode));
  }

  http.end();
}

// --- OTA: CHECK FOR UPDATES ---
void checkForOTAUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String checkUrl = String(SERVER_BASE) + "/api/firmware/" + DEVICE_TYPE + "/check?current_version=" + FIRMWARE_VERSION;

  Serial.println("🔍 Checking: " + checkUrl);

  http.begin(checkUrl);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("📦 Response: " + payload);

    // Parse JSON using ArduinoJson
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool updateAvailable = doc["update_available"] | false;
      const char* latestVersion = doc["latest_version"] | "unknown";

      if (updateAvailable) {
        Serial.printf("🆕 Update available! %s -> %s\n", FIRMWARE_VERSION, latestVersion);
        performOTAUpdate();
      } else {
        Serial.println("✅ Firmware is up to date");
      }
    } else {
      Serial.println("❌ JSON Parsing Error");
    }
  } else {
    Serial.printf("❌ Update check failed: %d\n", httpCode);
  }

  http.end();
}

// --- OTA: PERFORM UPDATE ---
void performOTAUpdate() {
  Serial.println("\n========================================");
  Serial.println("🔄 Starting OTA Update...");
  Serial.println("⚠️ DO NOT power off the device!");
  Serial.println("========================================\n");

  String downloadUrl = String(SERVER_BASE) + "/api/firmware/" + DEVICE_TYPE + "/download";

  WiFiClientSecure client;
  client.setInsecure(); // Skip certificate validation for simplicity

  // Set LED pin if available (usually GPIO 2)
  httpUpdate.setLedPin(2, HIGH);

  t_httpUpdate_return ret = httpUpdate.update(client, downloadUrl);

  switch (ret) {
    case HTTP_UPDATE_OK:
      Serial.println("✅ Update successful! Restarting...");
      delay(1000);
      ESP.restart();
      break;

    case HTTP_UPDATE_FAILED:
      Serial.printf("❌ Update FAILED! Error (%d): %s\n",
                    httpUpdate.getLastError(),
                    httpUpdate.getLastErrorString().c_str());
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("ℹ️ No update available");
      break;
  }
}
