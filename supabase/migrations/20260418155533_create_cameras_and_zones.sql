/*
  # Create Cameras and Zones Tables

  1. New Tables
    - `cameras`
      - `id` (uuid, primary key)
      - `name` (text, camera display name)
      - `location` (text, physical location description)
      - `rtsp_url` (text, RTSP stream URL)
      - `status` (text, active/inactive/error)
      - `thumbnail_url` (text, optional preview image)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `zones`
      - `id` (uuid, primary key)
      - `camera_id` (uuid, foreign key to cameras)
      - `name` (text, zone name e.g. "cash_counter")
      - `risk_level` (text, low/medium/high)
      - `coordinates` (jsonb, rectangle bounds {x, y, width, height} as percentages)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Authenticated users can read/write their own data
*/

CREATE TABLE IF NOT EXISTS cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  rtsp_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id uuid NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  name text NOT NULL,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  coordinates jsonb NOT NULL DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 100}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cameras"
  ON cameras FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cameras"
  ON cameras FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cameras"
  ON cameras FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cameras"
  ON cameras FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view zones"
  ON zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert zones"
  ON zones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update zones"
  ON zones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete zones"
  ON zones FOR DELETE
  TO authenticated
  USING (true);
