CREATE TABLE IF NOT EXISTS public.password_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  created_by uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  username text,
  encrypted_password text NOT NULL,
  website_url text,
  category text DEFAULT 'general',
  notes text,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON public.password_vault FOR ALL USING (true);
CREATE INDEX idx_password_vault_team ON public.password_vault(team_id);
CREATE INDEX idx_password_vault_created_by ON public.password_vault(created_by);
