-- ============================================================================
-- VendCFO RLS Policy Fix -- Security Audit 2026-03-19
-- ============================================================================
-- PROBLEM: All custom tables have `FOR ALL USING (true)` policies that apply
-- to ALL roles (including anon and authenticated), not just service_role.
-- This allows any authenticated user to read/modify ANY team's data,
-- and anon users (with just the public anon key) to do the same.
--
-- FIX: Drop the overly permissive policies and replace with:
-- 1. service_role: full access (used by server-side operations)
-- 2. authenticated: team-scoped access via users_on_team membership
-- ============================================================================

-- Helper function: get teams for the current authenticated user
CREATE OR REPLACE FUNCTION private.get_teams_for_authenticated_user()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- PASSWORD VAULT
-- ============================================================================
DROP POLICY IF EXISTS "Service role access" ON public.password_vault;

CREATE POLICY "Service role full access" ON public.password_vault
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Team members can read vault" ON public.password_vault
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can insert vault" ON public.password_vault
  FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can update vault" ON public.password_vault
  FOR UPDATE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can delete vault" ON public.password_vault
  FOR DELETE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- ============================================================================
-- REV SHARE PAYMENTS
-- ============================================================================
DROP POLICY IF EXISTS "Service role access" ON public.rev_share_payments;

CREATE POLICY "Service role full access" ON public.rev_share_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Team members can read payments" ON public.rev_share_payments
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can insert payments" ON public.rev_share_payments
  FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can update payments" ON public.rev_share_payments
  FOR UPDATE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- ============================================================================
-- ROUTE SCHEDULES
-- ============================================================================
DROP POLICY IF EXISTS "Service role access" ON public.route_schedules;

CREATE POLICY "Service role full access" ON public.route_schedules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Team members can read schedules" ON public.route_schedules
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can insert schedules" ON public.route_schedules
  FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can update schedules" ON public.route_schedules
  FOR UPDATE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can delete schedules" ON public.route_schedules
  FOR DELETE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- ============================================================================
-- TRAINING VIDEOS
-- ============================================================================
DROP POLICY IF EXISTS "Service role access" ON public.training_videos;

CREATE POLICY "Service role full access" ON public.training_videos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Team members can read videos" ON public.training_videos
  FOR SELECT TO authenticated
  USING (
    team_id IN (SELECT private.get_teams_for_authenticated_user())
    OR is_public = true
  );

CREATE POLICY "Team members can insert videos" ON public.training_videos
  FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can update videos" ON public.training_videos
  FOR UPDATE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can delete videos" ON public.training_videos
  FOR DELETE TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
