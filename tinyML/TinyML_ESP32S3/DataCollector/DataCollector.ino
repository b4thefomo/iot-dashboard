/*
 * DataCollector.ino — Phase 1: Baseline Data Collection
 *
 * Reads accelerometer (MPU6050 via I2C) and temperature (DS18B20 via OneWire)
 * at 10Hz and logs CSV data to SPIFFS for later model training.
 *
 * Hardware:
 *   - ESP32-S3 Dev Module
 *   - MPU6050 on I2C (SDA=GPIO8, SCL=GPIO9)
 *   - DS18B20 on GPIO4 (with 4.7k pull-up)
 *
 * Arduino IDE Settings:
 *   Board: ESP32S3 Dev Module
 *   PSRAM: OPI PSRAM
 *   Flash Size: 4MB
 *   Partition Scheme: Default 4MB with SPIFFS
 */

#include <Wire.h>
#include <SPIFFS.h>

// ─── MPU6050 I2C ────────────────────────────────────────────
#define MPU6050_ADDR 0x68
#define MPU6050_PWR_MGMT_1 0x6B
#define MPU6050_ACCEL_XOUT_H 0x3B
#define I2C_SDA 8
#define I2C_SCL 9

// ─── DS18B20 OneWire (simplified bit-bang, no library dep) ──
#define TEMP_PIN 4

// ─── Sampling ───────────────────────────────────────────────
#define SAMPLE_INTERVAL_MS 100  // 10 Hz
#define LOG_FILE "/baseline.csv"
#define SERIAL_DUMP_CMD "DUMP"

// ─── State ──────────────────────────────────────────────────
unsigned long last_sample = 0;
unsigned long sample_count = 0;
float temperature = 0.0;
unsigned long last_temp_read = 0;
#define TEMP_READ_INTERVAL_MS 1000  // DS18B20 conversion takes ~750ms

// ─── Forward declarations ───────────────────────────────────
void mpu6050_init();
void mpu6050_read(float &ax, float &ay, float &az);
float ds18b20_read();
void dump_log_to_serial();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== Cold Storage Data Collector ===");

  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("ERROR: SPIFFS mount failed");
    while (1) delay(1000);
  }
  Serial.printf("SPIFFS total: %u bytes, used: %u bytes\n",
                SPIFFS.totalBytes(), SPIFFS.usedBytes());

  // Initialize I2C and MPU6050
  Wire.begin(I2C_SDA, I2C_SCL);
  mpu6050_init();
  Serial.println("MPU6050 initialized");

  // Initialize temperature pin
  pinMode(TEMP_PIN, INPUT);
  Serial.println("DS18B20 pin configured");

  // Write CSV header if file doesn't exist or is empty
  if (!SPIFFS.exists(LOG_FILE)) {
    File f = SPIFFS.open(LOG_FILE, FILE_WRITE);
    if (f) {
      f.println("timestamp_ms,accel_x,accel_y,accel_z,temperature");
      f.close();
    }
  }

  Serial.println("Logging started. Send 'DUMP' over Serial to download data.");
  Serial.println("Send 'CLEAR' to erase log. Send 'STATUS' for stats.");
}

void loop() {
  // Check for serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "DUMP") {
      dump_log_to_serial();
      return;
    } else if (cmd == "CLEAR") {
      SPIFFS.remove(LOG_FILE);
      File f = SPIFFS.open(LOG_FILE, FILE_WRITE);
      if (f) {
        f.println("timestamp_ms,accel_x,accel_y,accel_z,temperature");
        f.close();
      }
      sample_count = 0;
      Serial.println("Log cleared.");
      return;
    } else if (cmd == "STATUS") {
      Serial.printf("Samples: %lu, SPIFFS used: %u/%u bytes\n",
                    sample_count, SPIFFS.usedBytes(), SPIFFS.totalBytes());
      return;
    }
  }

  unsigned long now = millis();

  // Read temperature at slower rate (sensor limitation)
  if (now - last_temp_read >= TEMP_READ_INTERVAL_MS) {
    temperature = ds18b20_read();
    last_temp_read = now;
  }

  // Sample accelerometer at 10Hz
  if (now - last_sample >= SAMPLE_INTERVAL_MS) {
    last_sample = now;

    float ax, ay, az;
    mpu6050_read(ax, ay, az);

    // Append to CSV
    File f = SPIFFS.open(LOG_FILE, FILE_APPEND);
    if (f) {
      f.printf("%lu,%.4f,%.4f,%.4f,%.2f\n", now, ax, ay, az, temperature);
      f.close();
      sample_count++;
    }

    // Print every 100 samples (~10 seconds)
    if (sample_count % 100 == 0) {
      Serial.printf("[%lu] samples=%lu ax=%.3f ay=%.3f az=%.3f temp=%.2f\n",
                    now, sample_count, ax, ay, az, temperature);
    }

    // Warn if SPIFFS is getting full (>90%)
    if (sample_count % 1000 == 0) {
      float usage = (float)SPIFFS.usedBytes() / SPIFFS.totalBytes();
      if (usage > 0.9) {
        Serial.println("WARNING: SPIFFS >90% full. Dump data soon!");
      }
    }
  }
}

// ─── MPU6050 Functions ──────────────────────────────────────

void mpu6050_init() {
  // Wake up MPU6050 (clear sleep bit)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_PWR_MGMT_1);
  Wire.write(0x00);
  Wire.endTransmission(true);
  delay(100);

  // Set accelerometer range to ±2g (most sensitive)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x1C);  // ACCEL_CONFIG register
  Wire.write(0x00);  // ±2g
  Wire.endTransmission(true);
}

void mpu6050_read(float &ax, float &ay, float &az) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)6, (uint8_t)true);

  int16_t raw_ax = (Wire.read() << 8) | Wire.read();
  int16_t raw_ay = (Wire.read() << 8) | Wire.read();
  int16_t raw_az = (Wire.read() << 8) | Wire.read();

  // Convert to g (±2g range, 16384 LSB/g)
  ax = raw_ax / 16384.0;
  ay = raw_ay / 16384.0;
  az = raw_az / 16384.0;
}

// ─── DS18B20 Simplified Read ────────────────────────────────
// Note: For production, use the DallasTemperature library.
// This is a minimal bit-bang implementation for single sensor.

static bool onewire_reset() {
  pinMode(TEMP_PIN, OUTPUT);
  digitalWrite(TEMP_PIN, LOW);
  delayMicroseconds(480);
  pinMode(TEMP_PIN, INPUT);
  delayMicroseconds(70);
  bool present = !digitalRead(TEMP_PIN);
  delayMicroseconds(410);
  return present;
}

static void onewire_write_byte(uint8_t data) {
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

static uint8_t onewire_read_byte() {
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
  if (!onewire_reset()) return temperature;  // return last reading if sensor not found

  onewire_write_byte(0xCC);  // Skip ROM (single sensor)
  onewire_write_byte(0x44);  // Start conversion
  // Don't wait here — we read the previous conversion result

  if (!onewire_reset()) return temperature;
  onewire_write_byte(0xCC);  // Skip ROM
  onewire_write_byte(0xBE);  // Read scratchpad

  uint8_t lsb = onewire_read_byte();
  uint8_t msb = onewire_read_byte();

  int16_t raw = (msb << 8) | lsb;
  return raw / 16.0;  // 12-bit resolution: 0.0625°C per bit
}

// ─── Serial Dump ────────────────────────────────────────────

void dump_log_to_serial() {
  Serial.println("=== BEGIN CSV DUMP ===");
  File f = SPIFFS.open(LOG_FILE, FILE_READ);
  if (!f) {
    Serial.println("ERROR: Cannot open log file");
    return;
  }
  while (f.available()) {
    Serial.write(f.read());
  }
  f.close();
  Serial.println("=== END CSV DUMP ===");
}
