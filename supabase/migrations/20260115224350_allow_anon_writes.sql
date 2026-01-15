-- Allow anonymous/server writes for IoT data ingestion
-- This enables the server to write readings and alerts without authentication

-- Readings: Allow insert and select for anon (server writes, dashboard reads)
CREATE POLICY "Allow anon insert on readings" ON readings
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select on readings" ON readings
    FOR SELECT TO anon USING (true);

-- Devices: Allow insert/update for anon (auto-register new devices)
CREATE POLICY "Allow anon insert on devices" ON devices
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update on devices" ON devices
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon select on devices" ON devices
    FOR SELECT TO anon USING (true);

-- Alerts: Allow insert for anon (server creates alerts)
CREATE POLICY "Allow anon insert on alerts" ON alerts
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update on alerts" ON alerts
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon select on alerts" ON alerts
    FOR SELECT TO anon USING (true);

-- Locations: Read-only for anon
CREATE POLICY "Allow anon select on locations" ON locations
    FOR SELECT TO anon USING (true);

-- Maintenance logs: Read-only for anon
CREATE POLICY "Allow anon select on maintenance_logs" ON maintenance_logs
    FOR SELECT TO anon USING (true);
