-- Quarterly Reporting Tables
-- Revenue records, sales tax records, rev share agreements,
-- location groups, and generated reports

-- Revenue records per location per period
CREATE TABLE IF NOT EXISTS public.revenue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.teams(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric(12,2) NOT NULL DEFAULT 0,
  processing_fees numeric(12,2) NOT NULL DEFAULT 0,
  net_deposited numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view revenue_records for their team"
  ON public.revenue_records FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage revenue_records for their team"
  ON public.revenue_records FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE INDEX idx_revenue_records_team ON public.revenue_records(business_id);
CREATE INDEX idx_revenue_records_location ON public.revenue_records(location_id);
CREATE INDEX idx_revenue_records_period ON public.revenue_records(period_start, period_end);

-- Sales tax records per location per jurisdiction per period
CREATE TABLE IF NOT EXISTS public.sales_tax_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.teams(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  jurisdiction text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  tax_rate numeric(6,4) NOT NULL DEFAULT 0,
  taxable_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_tax_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sales_tax_records for their team"
  ON public.sales_tax_records FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage sales_tax_records for their team"
  ON public.sales_tax_records FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE INDEX idx_sales_tax_records_team ON public.sales_tax_records(business_id);
CREATE INDEX idx_sales_tax_records_jurisdiction ON public.sales_tax_records(jurisdiction);

-- Rev share agreements per location
CREATE TABLE IF NOT EXISTS public.rev_share_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.teams(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  share_percentage numeric(5,2) NOT NULL DEFAULT 0,
  effective_date date,
  contact_name text,
  contact_email text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rev_share_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rev_share_agreements for their team"
  ON public.rev_share_agreements FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage rev_share_agreements for their team"
  ON public.rev_share_agreements FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE INDEX idx_rev_share_agreements_location ON public.rev_share_agreements(location_id);

-- Location groups (for batching locations under property managers)
CREATE TABLE IF NOT EXISTS public.location_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.teams(id),
  name text NOT NULL,
  contact_name text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view location_groups for their team"
  ON public.location_groups FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage location_groups for their team"
  ON public.location_groups FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));

-- Location group members (many-to-many)
CREATE TABLE IF NOT EXISTS public.location_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.location_groups(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, location_id)
);

ALTER TABLE public.location_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view location_group_members for their team"
  ON public.location_group_members FOR SELECT
  USING (group_id IN (SELECT id FROM location_groups WHERE business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid())));
CREATE POLICY "Users can manage location_group_members for their team"
  ON public.location_group_members FOR ALL
  USING (group_id IN (SELECT id FROM location_groups WHERE business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid())));

-- Generated reports
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.teams(id),
  report_type text NOT NULL CHECK (report_type IN ('rev_share', 'sales_tax', 'profitability', 'employee_productivity')),
  title text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  location_group_id uuid REFERENCES public.location_groups(id),
  employee_id uuid REFERENCES public.users(id),
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_to text,
  email_subject text,
  email_body text,
  email_sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view generated_reports for their team"
  ON public.generated_reports FOR SELECT
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage generated_reports for their team"
  ON public.generated_reports FOR ALL
  USING (business_id IN (SELECT team_id FROM users_on_team WHERE user_id = auth.uid()));
CREATE INDEX idx_generated_reports_team ON public.generated_reports(business_id);
CREATE INDEX idx_generated_reports_type ON public.generated_reports(report_type);
CREATE INDEX idx_generated_reports_status ON public.generated_reports(status);
