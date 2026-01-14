/*
 * IoT Server - ESP32 Firmware with OTA Updates
 *
 * This firmware sends sensor data to the server and supports
 * Over-The-Air (OTA) updates via the server's firmware endpoint.
 *
 * Supports both weather station and car telemetry modes.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32httpUpdate.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* SERVER_URL = "https://iot-dashboard-dij1.onrender.com";
const char* DEVICE_TYPE = "iot_server";

// Firmware version - increment this when you push new code
const char* FIRMWARE_VERSION = "1.0.0";

// Device mode: "weather_station" or "car_telemetry"
const char* SENSOR_TYPE = "weather_station";

// Device ID
const char* DEVICE_ID = "ESP32_001";

// Timing intervals (milliseconds)
const unsigned long DATA_SEND_INTERVAL = 5000;      // Send data every 5 seconds
const unsigned long OTA_CHECK_INTERVAL = 3600000;   // Check for updates every hour

// ==================== GLOBALS ====================

unsigned long lastDataSend = 0;
unsigned long lastOtaCheck = 0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("IoT Server ESP32 Firmware");
  Serial.printf("Version: %s\n", FIRMWARE_VERSION);
  Serial.printf("Device: %s\n", DEVICE_ID);
  Serial.printf("Mode: %s\n", SENSOR_TYPE);
  Serial.println("========================================\n");

  // Connect to WiFi
  connectWiFi();

  // Check for OTA updates on boot
  Serial.println("Checking for firmware updates...");
  checkForOTAUpdate();
}

// ==================== MAIN LOOP ====================

void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Send sensor data at regular intervals
  if (now - lastDataSend >= DATA_SEND_INTERVAL) {
    sendSensorData();
    lastDataSend = now;
  }

  // Check for OTA updates periodically
  if (now - lastOtaCheck >= OTA_CHECK_INTERVAL) {
    checkForOTAUpdate();
    lastOtaCheck = now;
  }

  delay(100);
}

// ==================== WIFI ====================

void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println(" Failed!");
    Serial.println("Will retry in main loop...");
  }
}

// ==================== SENSOR DATA ====================

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping data send");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload based on sensor type
  JsonDocument doc;
  doc["sensor_type"] = SENSOR_TYPE;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = millis();
  doc["firmware_version"] = FIRMWARE_VERSION;

  if (strcmp(SENSOR_TYPE, "weather_station") == 0) {
    // Weather station data
    // TODO: Replace with actual sensor readings
    doc["temp_c"] = readTemperature();
    doc["pressure_hpa"] = readPressure();
  } else if (strcmp(SENSOR_TYPE, "car_telemetry") == 0) {
    // Car telemetry data
    // TODO: Replace with actual OBD readings
    doc["speed_kmh"] = readSpeed();
    doc["rpm"] = readRPM();
    doc["throttle_pos"] = readThrottlePosition();
    doc["coolant_temp_c"] = readCoolantTemp();
  }

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      Serial.printf("Data sent successfully: %s\n", payload.c_str());
    } else {
      Serial.printf("HTTP error: %d\n", httpCode);
    }
  } else {
    Serial.printf("Connection error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ==================== OTA UPDATE ====================

void checkForOTAUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping OTA check");
    return;
  }

  HTTPClient http;
  String checkUrl = String(SERVER_URL) + "/api/firmware/" + DEVICE_TYPE + "/check?current_version=" + FIRMWARE_VERSION;

  Serial.printf("Checking for updates at: %s\n", checkUrl.c_str());

  http.begin(checkUrl);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.printf("Update check response: %s\n", payload.c_str());

    // Parse JSON response
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool updateAvailable = doc["update_available"] | false;
      const char* latestVersion = doc["latest_version"] | "unknown";

      if (updateAvailable) {
        Serial.printf("Update available! Current: %s, Latest: %s\n", FIRMWARE_VERSION, latestVersion);
        performOTAUpdate();
      } else {
        Serial.println("Firmware is up to date");
      }
    } else {
      Serial.printf("JSON parse error: %s\n", error.c_str());
    }
  } else {
    Serial.printf("Update check failed: %d\n", httpCode);
  }

  http.end();
}

void performOTAUpdate() {
  Serial.println("\n========================================");
  Serial.println("Starting OTA Update...");
  Serial.println("DO NOT power off the device!");
  Serial.println("========================================\n");

  String downloadUrl = String(SERVER_URL) + "/api/firmware/" + DEVICE_TYPE + "/download";

  // Configure HTTP update
  httpUpdate.setLedPin(LED_BUILTIN, LOW);  // LED on during update

  t_httpUpdate_return ret = httpUpdate.update(downloadUrl);

  switch (ret) {
    case HTTP_UPDATE_OK:
      Serial.println("Update successful! Restarting...");
      delay(1000);
      ESP.restart();
      break;

    case HTTP_UPDATE_FAILED:
      Serial.printf("Update FAILED! Error (%d): %s\n",
                    httpUpdate.getLastError(),
                    httpUpdate.getLastErrorString().c_str());
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("No update available");
      break;
  }
}

// ==================== SENSOR READINGS ====================
// TODO: Replace these mock functions with actual sensor code

float readTemperature() {
  // Mock temperature reading
  // Replace with actual sensor code (e.g., BME280, DHT22)
  return 22.0 + random(-50, 50) / 10.0;
}

float readPressure() {
  // Mock pressure reading
  // Replace with actual sensor code
  return 1013.0 + random(-50, 50) / 10.0;
}

float readSpeed() {
  // Mock speed reading
  // Replace with actual OBD-II reading
  return random(0, 120);
}

int readRPM() {
  // Mock RPM reading
  // Replace with actual OBD-II reading
  return random(800, 6000);
}

int readThrottlePosition() {
  // Mock throttle position
  // Replace with actual OBD-II reading
  return random(0, 100);
}

float readCoolantTemp() {
  // Mock coolant temperature
  // Replace with actual OBD-II reading
  return 85.0 + random(-10, 20);
}
