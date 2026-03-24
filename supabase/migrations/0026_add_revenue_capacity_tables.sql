-- Revenue records per location per period
CREATE TABLE IF NOT EXISTS revenue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES teams(id),
  location_id uuid REFERENCES locations(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue decimal(12,2) NOT NULL DEFAULT 0,
  processing_fees decimal(12,2) NOT NULL DEFAULT 0,
  net_deposited decimal(12,2) NOT NULL DEFAULT 0,
  cash_revenue decimal(12,2) NOT NULL DEFAULT 0,
  card_revenue decimal(12,2) NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, location_id, period_start, period_end)
);

-- Add capacity-related columns to employees (table already exists)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS max_weekly_hours decimal(5,2) NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS hourly_rate decimal(8,2) NOT NULL DEFAULT 25.00;

-- Capacity alerts
CREATE TABLE IF NOT EXISTS capacity_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES teams(id),
  employee_id uuid NOT NULL REFERENCES employees(id),
  alert_type text NOT NULL CHECK (alert_type IN ('approaching', 'at_capacity', 'over_capacity')),
  message text NOT NULL,
  current_utilization decimal(5,2) NOT NULL,
  threshold decimal(5,2) NOT NULL DEFAULT 85,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revenue_records for their team"
  ON revenue_records FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage revenue_records for their team"
  ON revenue_records FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can view capacity_alerts for their team"
  ON capacity_alerts FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage capacity_alerts for their team"
  ON capacity_alerts FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_records_business_period ON revenue_records(business_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_revenue_records_location ON revenue_records(location_id);
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_business ON capacity_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_employee ON capacity_alerts(employee_id);
