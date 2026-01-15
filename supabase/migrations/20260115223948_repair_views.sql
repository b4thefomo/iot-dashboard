-- Repair migration: Create views that failed in initial migration

-- Drop views if they exist (for idempotency)
DROP VIEW IF EXISTS active_alerts;
DROP VIEW IF EXISTS fleet_summary;

-- Active alerts view (fixed - no duplicate columns)
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
