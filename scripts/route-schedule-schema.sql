CREATE TABLE IF NOT EXISTS public.route_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  action text NOT NULL DEFAULT 'nothing',
  operator_id uuid REFERENCES public.users(id),
  estimated_hours numeric(4,2) DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, location_id, day_of_week)
);

ALTER TABLE public.route_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON public.route_schedules FOR ALL USING (true);
CREATE INDEX idx_route_schedules_team ON public.route_schedules(team_id);
CREATE INDEX idx_route_schedules_location ON public.route_schedules(location_id);
