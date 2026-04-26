/*
  # Create Events and Alerts Tables

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `camera_id` (text, references camera by ID or name from ML service)
      - `camera_uuid` (uuid, nullable FK to cameras table)
      - `event_type` (text, e.g. LOITERING, INTRUSION, TAILGATING)
      - `zone` (text, zone name)
      - `duration` (integer, seconds)
      - `confidence` (float, 0.0-1.0)
      - `timestamp` (timestamptz, when event occurred)
      - `raw_payload` (jsonb, original ML payload)
      - `created_at` (timestamptz)

    - `alerts`
      - `id` (uuid, primary key)
      - `event_id` (uuid, FK to events)
      - `camera_id` (uuid, nullable FK to cameras)
      - `camera_name` (text, denormalized for display)
      - `event_type` (text, denormalized)
      - `zone` (text, denormalized)
      - `risk_level` (text, derived from zone or event type)
      - `confidence` (float)
      - `is_read` (boolean)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow service role (for ML ingest) and authenticated users
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id text NOT NULL,
  camera_uuid uuid REFERENCES cameras(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  zone text NOT NULL DEFAULT '',
  duration integer DEFAULT 0,
  confidence float NOT NULL DEFAULT 0.0,
  timestamp timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  camera_id uuid REFERENCES cameras(id) ON DELETE SET NULL,
  camera_name text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  zone text NOT NULL DEFAULT '',
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence float NOT NULL DEFAULT 0.0,
  is_read boolean NOT NULL DEFAULT false,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_camera_id_idx ON events(camera_id);
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS alerts_is_read_idx ON alerts(is_read);
CREATE INDEX IF NOT EXISTS alerts_timestamp_idx ON alerts(timestamp DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can insert events"
  ON events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can insert alerts"
  ON alerts FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
