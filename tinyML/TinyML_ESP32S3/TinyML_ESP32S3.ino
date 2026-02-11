/*
 * TinyML_ESP32S3.ino — Cold Storage Anomaly Detection via TFLite Micro
 *
 * Reads accelerometer (MPU6050) and temperature (DS18B20) at 10Hz,
 * runs a Conv1D autoencoder for anomaly detection, and logs detected
 * events to SPIFFS as JSONL for LLM narrative generation.
 *
 * Hardware:
 *   - ESP32-S3 Dev Module (512KB SRAM, 2MB PSRAM, 4MB Flash)
 *   - MPU6050 accelerometer on I2C (SDA=GPIO8, SCL=GPIO9)
 *   - DS18B20 temperature sensor on GPIO4 (with 4.7k pull-up)
 *
 * Arduino IDE Settings:
 *   Board: ESP32S3 Dev Module
 *   PSRAM: OPI PSRAM
 *   Flash Size: 4MB
 *   Partition Scheme: Default 4MB with SPIFFS
 *
 * Dependencies:
 *   - TensorFlowLite_ESP32 (or tflite-micro-arduino-examples)
 */

#include <TensorFlowLite_ESP32.h>
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "model_data.h"

#include <Wire.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <time.h>
#include <math.h>

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

// Wi-Fi (for NTP time sync)
const char *WIFI_SSID = "YOUR_SSID";
const char *WIFI_PASS = "YOUR_PASSWORD";

// Sensor pins
#define I2C_SDA 8
#define I2C_SCL 9
#define TEMP_PIN 4

// MPU6050
#define MPU6050_ADDR 0x68

// Sampling
#define WINDOW_SIZE 50
#define NUM_CHANNELS 4
#define SAMPLE_INTERVAL_MS 100  // 10 Hz

// Anomaly detection — values from trained_model/deploy_params.json
#define ANOMALY_THRESHOLD 0.0284f
float ch_min[NUM_CHANNELS] = {-0.0490f, -0.0665f, 0.9487f, 2.0500f};
float ch_max[NUM_CHANNELS] = { 0.0909f,  0.0484f, 1.0502f, 6.2700f};

// TFLite Micro arena
constexpr int kTensorArenaSize = 50 * 1024;  // 50 KB

// Event log
#define EVENT_LOG_PATH "/events.jsonl"
#define MAX_LOG_SIZE (512 * 1024)  // 512KB max log before rotation

// Event cooldown: don't log more than once per 30 seconds
#define EVENT_COOLDOWN_MS 30000

// ═══════════════════════════════════════════════════════════
// Globals
// ═══════════════════════════════════════════════════════════

// TFLite
uint8_t *tensor_arena = nullptr;
tflite::MicroInterpreter *interpreter = nullptr;
TfLiteTensor *input = nullptr;
TfLiteTensor *output = nullptr;

// Sensor buffer
float sensor_buffer[WINDOW_SIZE][NUM_CHANNELS];
int buffer_idx = 0;

// Temperature (read at slower rate)
float current_temperature = 0.0f;
unsigned long last_temp_read = 0;

// Timing
unsigned long last_sample = 0;
unsigned long last_event_logged = 0;
unsigned long inference_count = 0;
unsigned long anomaly_count = 0;

// ═══════════════════════════════════════════════════════════
// Setup
// ═══════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== Cold Storage Anomaly Detector ===");

  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("ERROR: SPIFFS mount failed");
    while (1) delay(1000);
  }
  Serial.printf("SPIFFS: %u/%u bytes used\n", SPIFFS.usedBytes(), SPIFFS.totalBytes());

  // Initialize I2C and MPU6050
  Wire.begin(I2C_SDA, I2C_SCL);
  mpu6050_init();
  Serial.println("MPU6050 initialized");

  // Temperature pin
  pinMode(TEMP_PIN, INPUT);
  Serial.println("DS18B20 configured");

  // Connect Wi-Fi for NTP
  wifi_connect();

  // Initialize TFLite Micro
  if (!tflite_init()) {
    Serial.println("ERROR: TFLite initialization failed");
    while (1) delay(1000);
  }
  Serial.println("TFLite Micro initialized");
  Serial.printf("Input shape: [%d, %d]\n", input->dims->data[1], input->dims->data[2]);
  Serial.printf("Arena used: %u bytes\n", interpreter->arena_used_bytes());

  Serial.println("\nRunning inference. Send commands via Serial:");
  Serial.println("  DUMP   — Download event log");
  Serial.println("  CLEAR  — Clear event log");
  Serial.println("  STATUS — Show stats");
}

// ═══════════════════════════════════════════════════════════
// Main Loop
// ═══════════════════════════════════════════════════════════

void loop() {
  // Handle serial commands
  handle_serial_commands();

  unsigned long now = millis();

  // Read temperature at 1Hz
  if (now - last_temp_read >= 1000) {
    current_temperature = ds18b20_read();
    last_temp_read = now;
  }

  // Sample sensors at 10Hz
  if (now - last_sample >= SAMPLE_INTERVAL_MS) {
    last_sample = now;

    // Read accelerometer
    float ax, ay, az;
    mpu6050_read(ax, ay, az);

    // Store in buffer
    sensor_buffer[buffer_idx][0] = ax;
    sensor_buffer[buffer_idx][1] = ay;
    sensor_buffer[buffer_idx][2] = az;
    sensor_buffer[buffer_idx][3] = current_temperature;
    buffer_idx++;

    // Run inference when window is full
    if (buffer_idx >= WINDOW_SIZE) {
      buffer_idx = 0;
      run_anomaly_detection(now);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// TFLite Micro
// ═══════════════════════════════════════════════════════════

bool tflite_init() {
  // Allocate tensor arena in PSRAM if available
  tensor_arena = (uint8_t *)ps_malloc(kTensorArenaSize);
  if (!tensor_arena) {
    Serial.println("PSRAM alloc failed, using SRAM");
    tensor_arena = (uint8_t *)malloc(kTensorArenaSize);
  }
  if (!tensor_arena) {
    Serial.println("ERROR: Cannot allocate tensor arena");
    return false;
  }

  // Load model
  const tflite::Model *model = tflite::GetModel(model_data);
  if (model->version() != TFLITE_SCHEMA_VERSION) {
    Serial.printf("ERROR: Model schema version %lu != expected %d\n",
                  model->version(), TFLITE_SCHEMA_VERSION);
    return false;
  }

  // Create interpreter
  static tflite::AllOpsResolver resolver;
  static tflite::MicroInterpreter static_interpreter(
      model, resolver, tensor_arena, kTensorArenaSize);
  interpreter = &static_interpreter;

  if (interpreter->AllocateTensors() != kTfLiteOk) {
    Serial.println("ERROR: AllocateTensors failed");
    return false;
  }

  input = interpreter->input(0);
  output = interpreter->output(0);
  return true;
}

void run_anomaly_detection(unsigned long now) {
  // Fill input tensor (normalize + quantize)
  fill_input_tensor();

  // Run inference
  unsigned long t0 = micros();
  TfLiteStatus status = interpreter->Invoke();
  unsigned long dt = micros() - t0;

  inference_count++;

  if (status != kTfLiteOk) {
    Serial.println("ERROR: Inference failed");
    return;
  }

  // Compute reconstruction error
  float mse = compute_reconstruction_error();

  // Log stats periodically
  if (inference_count % 12 == 0) {  // ~every 60 seconds
    Serial.printf("[%lu] inferences=%lu anomalies=%lu mse=%.6f temp=%.1f latency=%luus\n",
                  now / 1000, inference_count, anomaly_count, mse,
                  current_temperature, dt);
  }

  // Check for anomaly
  if (mse > ANOMALY_THRESHOLD) {
    // Cooldown check
    if (now - last_event_logged > EVENT_COOLDOWN_MS) {
      last_event_logged = now;
      anomaly_count++;
      log_event("anomaly", mse);
    }
  }
}

void fill_input_tensor() {
  float scale = input->params.scale;
  int32_t zero_point = input->params.zero_point;

  for (int i = 0; i < WINDOW_SIZE; i++) {
    for (int j = 0; j < NUM_CHANNELS; j++) {
      // Normalize to [0, 1]
      float normalized = (sensor_buffer[i][j] - ch_min[j])
                        / (ch_max[j] - ch_min[j] + 1e-8f);
      // Clamp
      if (normalized < 0.0f) normalized = 0.0f;
      if (normalized > 1.0f) normalized = 1.0f;
      // Quantize to int8
      int32_t quantized = (int32_t)(normalized / scale + zero_point);
      if (quantized < -128) quantized = -128;
      if (quantized > 127) quantized = 127;
      input->data.int8[i * NUM_CHANNELS + j] = (int8_t)quantized;
    }
  }
}

float compute_reconstruction_error() {
  float out_scale = output->params.scale;
  int32_t out_zp = output->params.zero_point;
  float mse = 0.0f;

  for (int i = 0; i < WINDOW_SIZE; i++) {
    for (int j = 0; j < NUM_CHANNELS; j++) {
      // Original normalized value
      float orig = (sensor_buffer[i][j] - ch_min[j])
                  / (ch_max[j] - ch_min[j] + 1e-8f);
      if (orig < 0.0f) orig = 0.0f;
      if (orig > 1.0f) orig = 1.0f;

      // Dequantize output
      float recon = (output->data.int8[i * NUM_CHANNELS + j] - out_zp) * out_scale;

      float diff = orig - recon;
      mse += diff * diff;
    }
  }
  return mse / (WINDOW_SIZE * NUM_CHANNELS);
}

// ═══════════════════════════════════════════════════════════
// Event Logging
// ═══════════════════════════════════════════════════════════

void log_event(const char *label, float score) {
  // Rotate log if too large
  File check = SPIFFS.open(EVENT_LOG_PATH, FILE_READ);
  if (check) {
    if (check.size() > MAX_LOG_SIZE) {
      check.close();
      SPIFFS.remove(EVENT_LOG_PATH);
      Serial.println("Event log rotated (exceeded max size)");
    } else {
      check.close();
    }
  }

  File f = SPIFFS.open(EVENT_LOG_PATH, FILE_APPEND);
  if (!f) {
    Serial.println("ERROR: Cannot open event log");
    return;
  }

  time_t now = time(nullptr);
  float temp = sensor_buffer[WINDOW_SIZE - 1][3];
  float ax = sensor_buffer[WINDOW_SIZE - 1][0];
  float ay = sensor_buffer[WINDOW_SIZE - 1][1];
  float az = sensor_buffer[WINDOW_SIZE - 1][2];
  float accel_mag = sqrtf(ax * ax + ay * ay + az * az);

  f.printf("{\"ts\":%ld,\"event\":\"%s\",\"score\":%.4f,\"temp\":%.1f,\"accel_mag\":%.2f}\n",
           (long)now, label, score, temp, accel_mag);
  f.close();

  Serial.printf("EVENT: %s score=%.4f temp=%.1f accel=%.2f\n",
                label, score, temp, accel_mag);
}

// ═══════════════════════════════════════════════════════════
// MPU6050 Functions
// ═══════════════════════════════════════════════════════════

void mpu6050_init() {
  // Wake up
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1
  Wire.write(0x00);
  Wire.endTransmission(true);
  delay(100);

  // Accel range ±2g
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x1C);
  Wire.write(0x00);
  Wire.endTransmission(true);

  // Low-pass filter: 44Hz bandwidth (reduces noise)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x1A);  // CONFIG register
  Wire.write(0x03);  // DLPF_CFG = 3 (44Hz accel, 42Hz gyro)
  Wire.endTransmission(true);
}

void mpu6050_read(float &ax, float &ay, float &az) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);  // ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)6, (uint8_t)true);

  int16_t raw_ax = (Wire.read() << 8) | Wire.read();
  int16_t raw_ay = (Wire.read() << 8) | Wire.read();
  int16_t raw_az = (Wire.read() << 8) | Wire.read();

  // ±2g range: 16384 LSB/g
  ax = raw_ax / 16384.0f;
  ay = raw_ay / 16384.0f;
  az = raw_az / 16384.0f;
}

// ═══════════════════════════════════════════════════════════
// DS18B20 Temperature (minimal OneWire bit-bang)
// ═══════════════════════════════════════════════════════════

static bool ow_reset() {
  pinMode(TEMP_PIN, OUTPUT);
  digitalWrite(TEMP_PIN, LOW);
  delayMicroseconds(480);
  pinMode(TEMP_PIN, INPUT);
  delayMicroseconds(70);
  bool present = !digitalRead(TEMP_PIN);
  delayMicroseconds(410);
  return present;
}

static void ow_write(uint8_t data) {
  for (int i = 0; i < 8; i++) {
    pinMode(TEMP_PIN, OUTPUT);
    if (data & 0x01) {
      digitalWrite(TEMP_PIN, LOW);
      delayMicroseconds(6);
      pinMode(TEMP_PIN, INPUT);
      delayMicroseconds(64);
    } else {
      digitalWrite(TEMP_PIN, LOW);
      delayMicroseconds(60);
      pinMode(TEMP_PIN, INPUT);
      delayMicroseconds(10);
    }
    data >>= 1;
  }
}

static uint8_t ow_read() {
  uint8_t data = 0;
  for (int i = 0; i < 8; i++) {
    pinMode(TEMP_PIN, OUTPUT);
    digitalWrite(TEMP_PIN, LOW);
    delayMicroseconds(3);
    pinMode(TEMP_PIN, INPUT);
    delayMicroseconds(10);
    if (digitalRead(TEMP_PIN)) data |= (1 << i);
    delayMicroseconds(53);
  }
  return data;
}

float ds18b20_read() {
  if (!ow_reset()) return current_temperature;

  ow_write(0xCC);  // Skip ROM
  ow_write(0x44);  // Start conversion

  if (!ow_reset()) return current_temperature;
  ow_write(0xCC);
  ow_write(0xBE);  // Read scratchpad

  uint8_t lsb = ow_read();
  uint8_t msb = ow_read();

  int16_t raw = (msb << 8) | lsb;
  return raw / 16.0f;
}

// ═══════════════════════════════════════════════════════════
// Wi-Fi & NTP
// ═══════════════════════════════════════════════════════════

void wifi_connect() {
  if (strcmp(WIFI_SSID, "YOUR_SSID") == 0) {
    Serial.println("Wi-Fi not configured — timestamps will be relative");
    return;
  }

  Serial.printf("Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected: %s\n", WiFi.localIP().toString().c_str());
    // Sync NTP
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    Serial.println("NTP time sync initiated");
  } else {
    Serial.println("\nWi-Fi connection failed — continuing without NTP");
  }
}

// ═══════════════════════════════════════════════════════════
// Serial Command Handler
// ═══════════════════════════════════════════════════════════

void handle_serial_commands() {
  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();

  if (cmd == "DUMP" || cmd == "DUMP_EVENTS") {
    Serial.println("=== BEGIN EVENTS ===");
    File f = SPIFFS.open(EVENT_LOG_PATH, FILE_READ);
    if (f) {
      while (f.available()) {
        Serial.write(f.read());
      }
      f.close();
    }
    Serial.println("=== END EVENTS ===");

  } else if (cmd == "CLEAR") {
    SPIFFS.remove(EVENT_LOG_PATH);
    anomaly_count = 0;
    Serial.println("Event log cleared");

  } else if (cmd == "STATUS") {
    Serial.printf("Inferences: %lu\n", inference_count);
    Serial.printf("Anomalies:  %lu\n", anomaly_count);
    Serial.printf("Temperature: %.1f C\n", current_temperature);
    Serial.printf("SPIFFS: %u/%u bytes\n", SPIFFS.usedBytes(), SPIFFS.totalBytes());
    Serial.printf("Free heap: %u bytes\n", ESP.getFreeHeap());
    Serial.printf("Free PSRAM: %u bytes\n", ESP.getFreePsram());
    time_t now = time(nullptr);
    if (now > 1000000000) {
      Serial.printf("Time: %s", ctime(&now));
    }
  }
}
