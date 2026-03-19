CREATE TABLE IF NOT EXISTS public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  created_by uuid REFERENCES public.users(id),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category text DEFAULT 'general',
  is_public boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON public.training_videos FOR ALL USING (true);
CREATE INDEX idx_training_videos_team ON public.training_videos(team_id);
CREATE INDEX idx_training_videos_public ON public.training_videos(is_public);
