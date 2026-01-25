/*
 * IoT Server - ESP32-S3 Firmware (Home Freezer 2)
 * - Pins: Temp=D2, Accel SDA=D4, Accel SCL=D3
 * - SSID: "Starlink wide"
 * - Device ID: FREEZER_MAIN (routes to Freezer 2 tab)
 * - Endpoint: POST /api/data with sensor_type: freezer_monitor
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

// ==========================================
// 1. CONFIGURATION
// ==========================================
const char* ssid     = "Starlink wide";
const char* password = "oghouse25";

const char* serverUrl = "https://iot-dashboard-dij1.onrender.com/api/data";
const char* FIRMWARE_VERSION = "2.8.0-WIFI-RESTORED";

// ==========================================
// 2. HARDWARE PIN DEFINITIONS
// ==========================================
#define I2C_SDA_PIN 4  // D4
#define I2C_SCL_PIN 3  // D3
#define ONE_WIRE_BUS 2 // D2

// --- SENSOR OBJECTS ---
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

Adafruit_MPU6050 mpu;
bool accelFound = false;

// --- TIMING ---
const long SENSOR_INTERVAL = 2000; // Read/Upload every 2 seconds
unsigned long lastSensorUpdate = 0;

// Forward declaration
void sendData(String jsonPayload);

void setup() {
  Serial.begin(115200);
  delay(3000);

  Serial.println("\n--------------------------------");
  Serial.println("ESP32-S3 Booting (WiFi + Sensors)...");

  // 1. Start Sensors
  sensors.begin();
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  if (!mpu.begin()) {
    Serial.println("MPU6050 NOT FOUND. Check Wiring!");
    accelFound = false;
  } else {
    Serial.println("MPU6050 Found!");
    accelFound = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // 2. WiFi Setup (With Timeout Safety)
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  int retryCount = 0;
  // Try for 15 seconds (30 * 500ms), then give up so we don't freeze
  while (WiFi.status() != WL_CONNECTED && retryCount < 30) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi Failed (Timeout). Continuing to sensors offline...");
  }

  lastSensorUpdate = millis();
}

void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if lost (Non-blocking check)
  if (WiFi.status() != WL_CONNECTED && (now % 10000 == 0)) {
     Serial.println("WiFi Disconnected. Attempting background reconnect...");
     WiFi.reconnect();
  }

  if (now - lastSensorUpdate >= SENSOR_INTERVAL) {
    lastSensorUpdate = now;

    // --- READ SENSORS ---
    sensors.requestTemperatures();
    float externalTemp = sensors.getTempCByIndex(0);

    // --- READ ACCEL ---
    float accelX = 0, accelY = 0, accelZ = 0;
    if (accelFound) {
      sensors_event_t a, g, temp;
      mpu.getEvent(&a, &g, &temp);
      accelX = a.acceleration.x;
      accelY = a.acceleration.y;
      accelZ = a.acceleration.z;
    }

    // --- PRINT TO SERIAL (Always works) ---
    Serial.print("Sensors: ");
    if (externalTemp == -127.00) Serial.print("Temp Error | ");
    else { Serial.print(externalTemp); Serial.print("C | "); }
    Serial.print("AX: "); Serial.println(accelX);

    // --- UPLOAD IF WIFI IS READY ---
    if (WiFi.status() == WL_CONNECTED) {
      String json = "{";
      json += "\"sensor_type\": \"freezer_monitor\",";
      json += "\"device_id\": \"FREEZER_MAIN\",";
      json += "\"timestamp\": " + String(now) + ",";

      if (externalTemp == -127.00) json += "\"temp_c\": null,";
      else json += "\"temp_c\": " + String(externalTemp) + ",";

      json += "\"compressor_vib_x\": " + String(accelX) + ",";
      json += "\"compressor_vib_y\": " + String(accelY) + ",";
      json += "\"compressor_vib_z\": " + String(accelZ) + ",";
      json += "\"firmware_version\": \"" + String(FIRMWARE_VERSION) + "\"";
      json += "}";

      sendData(json);
    }
  }
}

void sendData(String jsonPayload) {
  WiFiClientSecure client;
  client.setInsecure(); // Skip HTTPS certificate check
  HTTPClient http;

  if (http.begin(client, serverUrl)) {
    http.addHeader("Content-Type", "application/json");
    int responseCode = http.POST(jsonPayload);

    if (responseCode > 0) {
      Serial.println("   Upload: OK (" + String(responseCode) + ")");
    } else {
      Serial.println("   Upload: Fail (" + http.errorToString(responseCode) + ")");
    }
    http.end();
  } else {
     Serial.println("   HTTP Begin Failed");
  }
}
