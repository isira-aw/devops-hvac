-- Migration: Convert existing UTC timestamps to Asia/Colombo (UTC+5:30)
--
-- The application was storing timestamps using LocalDateTime.now() with the
-- JVM running in UTC timezone. All existing timestamps are therefore in UTC
-- and need to be shifted forward by 5 hours 30 minutes to reflect Sri Lanka time.
--
-- IMPORTANT: Run this migration ONLY ONCE. Running it again will corrupt data.
-- After applying, the backend timezone is set to Asia/Colombo so new data
-- will be stored correctly.

-- Fix telemetry timestamps
UPDATE telemetry
SET timestamp = timestamp + INTERVAL '5 hours 30 minutes'
WHERE timestamp IS NOT NULL;

-- Fix device timestamps
UPDATE devices
SET last_heartbeat = last_heartbeat + INTERVAL '5 hours 30 minutes'
WHERE last_heartbeat IS NOT NULL;

UPDATE devices
SET created_at = created_at + INTERVAL '5 hours 30 minutes'
WHERE created_at IS NOT NULL;

UPDATE devices
SET updated_at = updated_at + INTERVAL '5 hours 30 minutes'
WHERE updated_at IS NOT NULL;

-- Fix fault log timestamps
UPDATE fault_logs
SET created_at = created_at + INTERVAL '5 hours 30 minutes'
WHERE created_at IS NOT NULL;

UPDATE fault_logs
SET resolved_at = resolved_at + INTERVAL '5 hours 30 minutes'
WHERE resolved_at IS NOT NULL;
