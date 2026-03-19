-- Revenue Share Schema
-- Extend locations with revenue share partner details

ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS rev_share_contact_name text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS rev_share_contact_email text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS rev_share_payment_method text DEFAULT 'check';
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS rev_share_payable_to text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS machine_count integer DEFAULT 1;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS machine_type text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS unit_count integer;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS status text DEFAULT 'current';

-- Revenue share payment tracking
CREATE TABLE IF NOT EXISTS public.rev_share_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric(12,2) NOT NULL DEFAULT 0,
  cogs numeric(12,2) NOT NULL DEFAULT 0,
  rev_share_pct numeric(5,2) NOT NULL DEFAULT 0,
  rev_share_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'check',
  payment_status text DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rev_share_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON public.rev_share_payments FOR ALL USING (true);
CREATE INDEX idx_rev_share_payments_team ON public.rev_share_payments(team_id);
CREATE INDEX idx_rev_share_payments_location ON public.rev_share_payments(location_id);
