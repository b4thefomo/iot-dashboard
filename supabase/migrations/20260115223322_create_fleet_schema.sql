-- =============================================
-- SUBZERO FLEET COMMAND - DATABASE SCHEMA
-- IoT Freezer Monitoring System
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. LOCATIONS TABLE
-- Regional groupings for freezer units
-- =============================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    lat DECIMAL(10, 7) NOT NULL,
    lon DECIMAL(10, 7) NOT NULL,
    region VARCHAR(100),
    address TEXT,
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. DEVICES TABLE
-- Individual freezer units
-- =============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL UNIQUE,  -- e.g., SUBZ_001
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    installed_at TIMESTAMPTZ,
    last_maintenance TIMESTAMPTZ,
    next_maintenance_due TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'offline', 'maintenance', 'decommissioned')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. READINGS TABLE
-- Time-series telemetry data (high volume)
-- =============================================
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Temperature readings
    temp_cabinet DECIMAL(5, 2) NOT NULL,
    temp_ambient DECIMAL(5, 2),

    -- Compressor data
    compressor_power_w DECIMAL(8, 2),
    compressor_freq_hz DECIMAL(6, 2),
    cop DECIMAL(4, 2),  -- Coefficient of Performance

    -- Status flags
    door_open BOOLEAN DEFAULT FALSE,
    defrost_on BOOLEAN DEFAULT FALSE,
    frost_level DECIMAL(3, 2) DEFAULT 0,  -- 0.0 to 1.0

    -- Fault information
    fault VARCHAR(50) DEFAULT 'NORMAL',
    fault_id INTEGER DEFAULT 0,

    -- Calculated status
    status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN fault != 'NORMAL' OR temp_cabinet > -5 THEN 'critical'
            WHEN door_open OR frost_level > 0.5 OR temp_cabinet > -10 THEN 'warning'
            ELSE 'healthy'
        END
    ) STORED
);

-- Create index for time-series queries (critical for performance)
CREATE INDEX idx_readings_device_timestamp ON readings(device_id, timestamp DESC);
CREATE INDEX idx_readings_timestamp ON readings(timestamp DESC);
CREATE INDEX idx_readings_status ON readings(status) WHERE status != 'healthy';

-- =============================================
-- 4. ALERTS TABLE
-- Triggered events and notifications
-- =============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL CHECK (type IN (
        'TEMP_HIGH', 'TEMP_CRITICAL',
        'DOOR_OPEN', 'DOOR_OPEN_EXTENDED',
        'FAULT', 'COMPRESSOR_FAULT',
        'FROST_HIGH', 'POWER_ANOMALY',
        'OFFLINE', 'MAINTENANCE_DUE'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),

    message TEXT NOT NULL,
    reading_id UUID REFERENCES readings(id),  -- Link to the reading that triggered it

    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),

    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active alerts
CREATE INDEX idx_alerts_active ON alerts(device_id, triggered_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_severity ON alerts(severity, triggered_at DESC);

-- =============================================
-- 5. MAINTENANCE_LOGS TABLE
-- Service and maintenance history
-- =============================================
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL CHECK (type IN (
        'scheduled', 'emergency', 'inspection',
        'repair', 'replacement', 'calibration'
    )),

    description TEXT NOT NULL,
    performed_by VARCHAR(100),
    performed_at TIMESTAMPTZ DEFAULT NOW(),

    parts_replaced TEXT[],
    cost DECIMAL(10, 2),

    next_due TIMESTAMPTZ,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_device ON maintenance_logs(device_id, performed_at DESC);

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for updated_at
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (can read all)
CREATE POLICY "Allow authenticated read on locations" ON locations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on devices" ON devices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on readings" ON readings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on alerts" ON alerts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on maintenance_logs" ON maintenance_logs
    FOR SELECT TO authenticated USING (true);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Allow service role all on locations" ON locations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all on devices" ON devices
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all on readings" ON readings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all on alerts" ON alerts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role all on maintenance_logs" ON maintenance_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- 8. SEED DATA - UK LOCATIONS
-- =============================================

INSERT INTO locations (name, lat, lon, region, address) VALUES
    ('London', 51.5074, -0.1278, 'South East', 'Central London Distribution Centre'),
    ('Manchester', 53.4808, -2.2426, 'North West', 'Manchester Logistics Hub'),
    ('Birmingham', 52.4862, -1.8904, 'West Midlands', 'Birmingham Cold Storage'),
    ('Leeds', 53.8008, -1.5491, 'Yorkshire', 'Leeds Distribution Centre'),
    ('Glasgow', 55.8642, -4.2518, 'Scotland', 'Glasgow Operations Base'),
    ('Liverpool', 53.4084, -2.9916, 'North West', 'Liverpool Port Facility'),
    ('Bristol', 51.4545, -2.5879, 'South West', 'Bristol Regional Centre'),
    ('Edinburgh', 55.9533, -3.1883, 'Scotland', 'Edinburgh Storage Facility'),
    ('Cardiff', 51.4816, -3.1791, 'Wales', 'Cardiff Distribution Hub'),
    ('Newcastle', 54.9783, -1.6178, 'North East', 'Newcastle Operations');

-- =============================================
-- 9. VIEWS FOR COMMON QUERIES
-- =============================================

-- Current fleet status view
CREATE VIEW fleet_status AS
SELECT
    d.device_id,
    d.status as device_status,
    l.name as location_name,
    l.lat,
    l.lon,
    l.region,
    r.temp_cabinet,
    r.temp_ambient,
    r.compressor_power_w,
    r.frost_level,
    r.door_open,
    r.fault,
    r.status as reading_status,
    r.timestamp as last_reading
FROM devices d
LEFT JOIN locations l ON d.location_id = l.id
LEFT JOIN LATERAL (
    SELECT * FROM readings
    WHERE readings.device_id = d.device_id
    ORDER BY timestamp DESC
    LIMIT 1
) r ON true
WHERE d.status = 'active';

-- Active alerts view
CREATE VIEW active_alerts AS
SELECT
    a.id,
    a.device_id,
    a.type,
    a.severity,
    a.message,
    a.reading_id,
    a.triggered_at,
    a.resolved_at,
    a.acknowledged_at,
    a.acknowledged_by,
    a.notes,
    a.metadata,
    a.created_at,
    l.name as location_name
FROM alerts a
JOIN devices d ON a.device_id = d.device_id
LEFT JOIN locations l ON d.location_id = l.id
WHERE a.resolved_at IS NULL
ORDER BY
    CASE a.severity
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        ELSE 3
    END,
    a.triggered_at DESC;

-- Fleet summary stats
CREATE VIEW fleet_summary AS
SELECT
    COUNT(*) as total_devices,
    COUNT(*) FILTER (WHERE r.status = 'healthy') as healthy_count,
    COUNT(*) FILTER (WHERE r.status = 'warning') as warning_count,
    COUNT(*) FILTER (WHERE r.status = 'critical') as critical_count,
    AVG(r.temp_cabinet) as avg_temperature,
    SUM(r.compressor_power_w) as total_power,
    COUNT(*) FILTER (WHERE r.door_open) as doors_open
FROM devices d
LEFT JOIN LATERAL (
    SELECT * FROM readings
    WHERE readings.device_id = d.device_id
    ORDER BY timestamp DESC
    LIMIT 1
) r ON true
WHERE d.status = 'active';
