-- Add notifications_sent jsonb column to timeline_events
-- Tracks which D-day notifications have been sent (e.g. {"d7": true, "d3": true, "d0": true})
ALTER TABLE timeline_events
ADD COLUMN IF NOT EXISTS notifications_sent jsonb DEFAULT '{}'::jsonb;
