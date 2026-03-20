-- Stores conversation insights extracted by the AI memory system.
-- One row per team, upserted on each chat interaction.
CREATE TABLE IF NOT EXISTS user_ai_context (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  conversation_insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (service-key access only — no user-facing policies needed)
ALTER TABLE user_ai_context ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_ai_context IS 'AI-extracted conversation insights per team (goals, decisions, concerns, corrections, preferences)';
