-- Add operations columns to locations
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS stock_hours decimal(5,2),
  ADD COLUMN IF NOT EXISTS pick_hours decimal(5,2),
  ADD COLUMN IF NOT EXISTS machine_count integer,
  ADD COLUMN IF NOT EXISTS machine_type_label text,
  ADD COLUMN IF NOT EXISTS software_web text,
  ADD COLUMN IF NOT EXISTS software_type text,
  ADD COLUMN IF NOT EXISTS access_hours text;

-- Service schedule per location per day
CREATE TABLE IF NOT EXISTS service_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES teams(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),
  action text NOT NULL CHECK (action IN ('pick', 'stock', 'pick_stock', 'nothing')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, day_of_week)
);

-- Operator weekly plan (planned and actual hours per day)
CREATE TABLE IF NOT EXISTS operator_weekly_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES teams(id),
  operator_id uuid NOT NULL REFERENCES users(id),
  week_start date NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),
  planned_stops integer,
  planned_driving_hrs decimal(5,2),
  planned_gas_tolls_hrs decimal(5,2),
  planned_warehouse_hrs decimal(5,2),
  planned_load_van_hrs decimal(5,2),
  planned_stock_hrs decimal(5,2),
  planned_pick_hrs decimal(5,2),
  actual_stops integer,
  actual_driving_hrs decimal(5,2),
  actual_gas_tolls_hrs decimal(5,2),
  actual_warehouse_hrs decimal(5,2),
  actual_load_van_hrs decimal(5,2),
  actual_stock_hrs decimal(5,2),
  actual_pick_hrs decimal(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id, week_start, day_of_week)
);

-- Operator pay rates
CREATE TABLE IF NOT EXISTS operator_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES teams(id),
  operator_id uuid NOT NULL REFERENCES users(id),
  hourly_rate decimal(8,2) NOT NULL DEFAULT 25.00,
  gas_rate_per_hr decimal(8,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id)
);

-- RLS policies
ALTER TABLE service_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_weekly_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service_schedule for their team"
  ON service_schedule FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage service_schedule for their team"
  ON service_schedule FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can view operator_weekly_plan for their team"
  ON operator_weekly_plan FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage operator_weekly_plan for their team"
  ON operator_weekly_plan FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can view operator_rates for their team"
  ON operator_rates FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage operator_rates for their team"
  ON operator_rates FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
