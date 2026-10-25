-- Smart Capture Multi-Tenant Architecture & Row Level Security (RLS)
-- Commercial-grade additive migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Dealerships Table
CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  plan_id TEXT NOT NULL DEFAULT 'basic' CHECK (plan_id IN ('basic', 'pro', 'dealer_group')),
  max_active_templates INT NOT NULL DEFAULT 3,
  monthly_vehicle_quota INT NOT NULL DEFAULT 50,
  storage_quota_gb INT NOT NULL DEFAULT 5,
  storage_used_mb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Dealership Members (Multi-Tenant User Roles)
CREATE TABLE IF NOT EXISTS dealership_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- references auth.users(id)
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'photographer' CHECK (role IN ('platform_admin', 'owner', 'manager', 'photographer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dealership_id, user_id)
);

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  vin TEXT,
  year INT,
  make TEXT,
  model TEXT,
  trim TEXT,
  body_style TEXT NOT NULL DEFAULT 'sedan',
  stock_number TEXT,
  color TEXT,
  mileage INT,
  created_by UUID REFERENCES dealership_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_dealership ON vehicles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- 4. Capture Templates
CREATE TABLE IF NOT EXISTS capture_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  body_style TEXT NOT NULL DEFAULT 'sedan',
  aspect_ratio TEXT NOT NULL DEFAULT '4:3',
  target_resolution_width INT NOT NULL DEFAULT 2048,
  target_resolution_height INT NOT NULL DEFAULT 1536,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_dealership ON capture_templates(dealership_id);

-- 5. Capture Template Shots
CREATE TABLE IF NOT EXISTS capture_template_shots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES capture_templates(id) ON DELETE CASCADE,
  shot_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exterior', 'exterior_detail', 'interior', 'additional')),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_hero BOOLEAN NOT NULL DEFAULT FALSE,
  guidance_text TEXT NOT NULL,
  recommended_distance_meters NUMERIC(4, 2),
  sequence_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_shots ON capture_template_shots(template_id, sequence_order);

-- 6. Vehicle Capture Sessions
CREATE TABLE IF NOT EXISTS vehicle_capture_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES capture_templates(id),
  employee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'paused', 'pending_upload', 'uploading', 'completed', 'failed', 'archived')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_dealership ON vehicle_capture_sessions(dealership_id);
CREATE INDEX IF NOT EXISTS idx_sessions_vehicle ON vehicle_capture_sessions(vehicle_id);

-- 7. Capture Shots
CREATE TABLE IF NOT EXISTS capture_shots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES vehicle_capture_sessions(id) ON DELETE CASCADE,
  shot_code TEXT NOT NULL,
  shot_name TEXT NOT NULL,
  sequence_order INT NOT NULL,
  storage_path TEXT,
  public_url TEXT,
  is_hero BOOLEAN NOT NULL DEFAULT FALSE,
  retake_count INT NOT NULL DEFAULT 0,
  blur_score NUMERIC(8, 2),
  is_blurry BOOLEAN DEFAULT FALSE,
  exposure TEXT DEFAULT 'normal',
  tilt_degrees NUMERIC(5, 2) DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shots_session ON capture_shots(session_id, sequence_order);

-- 8. Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  actor_id UUID,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_dealership ON audit_events(dealership_id, created_at);

-- 9. Row Level Security (RLS) Enablement
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealership_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_template_shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_capture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Security Helper Functions
CREATE OR REPLACE FUNCTION current_user_has_dealership_access(target_dealership_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM dealership_members
    WHERE dealership_id = target_dealership_id
      AND user_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies: Isolation by Dealership
CREATE POLICY dealership_member_isolation ON dealerships
  FOR ALL
  USING (current_user_has_dealership_access(id));

CREATE POLICY members_dealership_isolation ON dealership_members
  FOR ALL
  USING (current_user_has_dealership_access(dealership_id));

CREATE POLICY vehicles_dealership_isolation ON vehicles
  FOR ALL
  USING (current_user_has_dealership_access(dealership_id));

CREATE POLICY templates_dealership_isolation ON capture_templates
  FOR ALL
  USING (current_user_has_dealership_access(dealership_id));

CREATE POLICY template_shots_isolation ON capture_template_shots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM capture_templates t
      WHERE t.id = capture_template_shots.template_id
        AND current_user_has_dealership_access(t.dealership_id)
    )
  );

CREATE POLICY sessions_dealership_isolation ON vehicle_capture_sessions
  FOR ALL
  USING (current_user_has_dealership_access(dealership_id));

CREATE POLICY shots_dealership_isolation ON capture_shots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_capture_sessions s
      WHERE s.id = capture_shots.session_id
        AND current_user_has_dealership_access(s.dealership_id)
    )
  );

CREATE POLICY audit_dealership_isolation ON audit_events
  FOR ALL
  USING (current_user_has_dealership_access(dealership_id));
