-- VendCFO Demo Seed Script
-- Idempotent: safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- Team ID: 37a44499-0807-43c2-aed5-38f7909e8627
-- User ID: e68ad16d-0905-4eb7-82f5-0bb122d0e3f1

BEGIN;

-- =============================================================================
-- PART A: Create missing SQL functions that TRPC routes depend on
-- =============================================================================

-- 1. get_team_bank_accounts_balances(uuid)
-- Called by: packages/db/src/queries/bank-accounts.ts → getBankAccountsBalances
-- Returns: id, currency, balance, name, logo_url
CREATE OR REPLACE FUNCTION public.get_team_bank_accounts_balances(p_team_id uuid)
RETURNS TABLE (
  id uuid,
  currency text,
  balance numeric,
  name text,
  logo_url text
) LANGUAGE sql STABLE AS $$
  SELECT
    ba.id,
    COALESCE(ba.currency, 'USD') AS currency,
    COALESCE(ba.balance, 0) AS balance,
    COALESCE(ba.name, 'Unknown Account') AS name,
    bc.logo_url
  FROM bank_accounts ba
  LEFT JOIN bank_connections bc ON ba.bank_connection_id = bc.id
  WHERE ba.team_id = p_team_id
    AND ba.enabled = true
  ORDER BY ba.created_at ASC;
$$;

-- 2. get_bank_account_currencies(uuid)
-- Called by: packages/db/src/queries/bank-accounts.ts → getBankAccountsCurrencies
-- Returns: currency
CREATE OR REPLACE FUNCTION public.get_bank_account_currencies(p_team_id uuid)
RETURNS TABLE (
  currency text
) LANGUAGE sql STABLE AS $$
  SELECT DISTINCT COALESCE(ba.currency, 'USD') AS currency
  FROM bank_accounts ba
  WHERE ba.team_id = p_team_id
    AND ba.enabled = true;
$$;

-- 3. global_search(...)
-- Called by: packages/db/src/queries/search.ts → globalSearchQuery
-- Params: search_term, team_id, language, limit, items_per_table_limit, relevance_threshold
-- Returns: id, type, title, relevance, created_at, data
CREATE OR REPLACE FUNCTION public.global_search(
  p_search_term text DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  p_language text DEFAULT 'english',
  p_limit integer DEFAULT 20,
  p_items_per_table_limit integer DEFAULT 5,
  p_relevance_threshold numeric DEFAULT NULL
)
RETURNS TABLE (
  id text,
  type text,
  title text,
  relevance numeric,
  created_at timestamptz,
  data jsonb
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_query tsquery;
BEGIN
  -- Build the search query if a search term is provided
  IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
    v_query := to_tsquery(p_language::regconfig, websearch_to_tsquery(p_language::regconfig, p_search_term)::text);
  END IF;

  RETURN QUERY
  (
    -- Search transactions
    SELECT
      t.id::text,
      'transaction'::text AS type,
      t.name AS title,
      CASE WHEN v_query IS NOT NULL THEN ts_rank(t.fts_vector, v_query) ELSE 1.0 END AS relevance,
      t.created_at::timestamptz,
      jsonb_build_object('amount', t.amount, 'currency', t.currency, 'date', t.date) AS data
    FROM transactions t
    WHERE t.team_id = p_team_id
      AND (v_query IS NULL OR t.fts_vector @@ v_query)
    ORDER BY CASE WHEN v_query IS NOT NULL THEN ts_rank(t.fts_vector, v_query) ELSE 0 END DESC, t.created_at DESC
    LIMIT p_items_per_table_limit
  )
  UNION ALL
  (
    -- Search customers
    SELECT
      c.id::text,
      'customer'::text AS type,
      c.name AS title,
      CASE WHEN v_query IS NOT NULL THEN ts_rank(c.fts, v_query) ELSE 1.0 END AS relevance,
      c.created_at::timestamptz,
      jsonb_build_object('email', c.email, 'website', c.website) AS data
    FROM customers c
    WHERE c.team_id = p_team_id
      AND (v_query IS NULL OR c.fts @@ v_query)
    ORDER BY CASE WHEN v_query IS NOT NULL THEN ts_rank(c.fts, v_query) ELSE 0 END DESC, c.created_at DESC
    LIMIT p_items_per_table_limit
  )
  UNION ALL
  (
    -- Search invoices
    SELECT
      i.id::text,
      'invoice'::text AS type,
      COALESCE(i.invoice_number, 'Invoice') AS title,
      CASE WHEN v_query IS NOT NULL THEN ts_rank(i.fts, v_query) ELSE 1.0 END AS relevance,
      i.created_at::timestamptz,
      jsonb_build_object('amount', i.amount, 'currency', i.currency, 'status', i.status, 'customer_name', i.customer_name) AS data
    FROM invoices i
    WHERE i.team_id = p_team_id
      AND (v_query IS NULL OR i.fts @@ v_query)
    ORDER BY CASE WHEN v_query IS NOT NULL THEN ts_rank(i.fts, v_query) ELSE 0 END DESC, i.created_at DESC
    LIMIT p_items_per_table_limit
  )
  LIMIT p_limit;
END;
$$;

-- 4. global_semantic_search(...)
-- Called by: packages/db/src/queries/search.ts → globalSemanticSearchQuery
-- Full-featured search with filters
CREATE OR REPLACE FUNCTION public.global_semantic_search(
  p_team_id uuid DEFAULT NULL,
  p_search_term text DEFAULT NULL,
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL,
  p_types text[] DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_amount_min numeric DEFAULT NULL,
  p_amount_max numeric DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_due_date_start text DEFAULT NULL,
  p_due_date_end text DEFAULT NULL,
  p_max_results integer DEFAULT 20,
  p_items_per_table_limit integer DEFAULT 5
)
RETURNS TABLE (
  id text,
  type text,
  title text,
  relevance numeric,
  created_at timestamptz,
  data jsonb
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  -- Delegate to global_search for now; filters are applied client-side where needed
  RETURN QUERY
  SELECT gs.id, gs.type, gs.title, gs.relevance, gs.created_at, gs.data
  FROM global_search(p_search_term, p_team_id, COALESCE(p_language, 'english'), p_max_results, p_items_per_table_limit, NULL) gs;
END;
$$;

-- 5. get_assigned_users_for_project(record)
-- Called by: packages/db/src/queries/tracker-projects.ts
-- Returns: JSON array of {user_id, full_name, avatar_url}
CREATE OR REPLACE FUNCTION public.get_assigned_users_for_project(p_project tracker_projects)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id', u.id,
        'full_name', COALESCE(u.full_name, ''),
        'avatar_url', COALESCE(u.avatar_url, '')
      )
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT te.assigned_id
    FROM tracker_entries te
    WHERE te.project_id = p_project.id
      AND te.assigned_id IS NOT NULL
  ) sub
  JOIN users u ON u.id = sub.assigned_id;
$$;

-- 6. total_duration(record)
-- Called by: packages/db/src/queries/tracker-projects.ts
-- Returns: total tracked seconds for a project
CREATE OR REPLACE FUNCTION public.total_duration(p_project tracker_projects)
RETURNS bigint LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(te.duration), 0)::bigint
  FROM tracker_entries te
  WHERE te.project_id = p_project.id;
$$;

-- 7. get_project_total_amount(record)
-- Called by: packages/db/src/queries/tracker-projects.ts
-- Returns: total billable amount (duration_hours * rate)
CREATE OR REPLACE FUNCTION public.get_project_total_amount(p_project tracker_projects)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    SUM(
      (COALESCE(te.duration, 0)::numeric / 3600.0) *
      COALESCE(te.rate, p_project.rate, 0)
    ),
    0
  )
  FROM tracker_entries te
  WHERE te.project_id = p_project.id;
$$;


-- =============================================================================
-- PART B: Seed demo data
-- =============================================================================

-- Constants
-- team_id  = '37a44499-0807-43c2-aed5-38f7909e8627'
-- user_id  = 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1'

-- ---------------------------------------------------------------------------
-- B1. Locations (5)
-- ---------------------------------------------------------------------------
INSERT INTO locations (id, business_id, name, address, location_type, contact_name, contact_email, monthly_rent, service_frequency_days, is_active)
VALUES
  ('a0000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'Downtown Mall',         '100 Main St, Austin, TX 78701',      'other',   'Sarah Chen',     'sarah@downtownmall.com',   450.00, 3, true),
  ('a0000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'Airport Terminal A',     '3600 Presidential Blvd, Austin, TX',  'transit', 'Mike Torres',    'mike@austinairport.com',   800.00, 2, true),
  ('a0000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'TechHub Office Park',    '2200 Tech Blvd, Austin, TX 78758',    'office',  'Lisa Park',      'lisa@techhub.io',          300.00, 7, true),
  ('a0000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'Riverside Fitness Center','500 Riverside Dr, Austin, TX 78704',  'gym',     'Jake Martinez',  'jake@riversidefit.com',    350.00, 5, true),
  ('a0000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'Lakeview University',    '1 University Ave, Austin, TX 78712',  'school',  'Dr. Amy Nguyen', 'amy@lakeviewu.edu',        250.00, 4, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B2. Routes (5)
-- ---------------------------------------------------------------------------
INSERT INTO routes (id, business_id, name, description, operator_id, is_active)
VALUES
  ('b0000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'North Loop',    'Downtown Mall + Airport',                 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', true),
  ('b0000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'South Route',   'Riverside Fitness + Lakeview University',  'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', true),
  ('b0000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'Tech Corridor', 'TechHub Office Park loop',                'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', true),
  ('b0000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'Express Run',   'Airport only — high-traffic weekday',      'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', true),
  ('b0000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'Weekend Mix',   'All locations — Saturday restocking',       'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', true)
ON CONFLICT (id) DO NOTHING;

-- Assign routes to locations
UPDATE locations SET route_id = 'b0000001-0000-4000-8000-000000000001' WHERE id = 'a0000001-0000-4000-8000-000000000001';
UPDATE locations SET route_id = 'b0000001-0000-4000-8000-000000000001' WHERE id = 'a0000001-0000-4000-8000-000000000002';
UPDATE locations SET route_id = 'b0000001-0000-4000-8000-000000000003' WHERE id = 'a0000001-0000-4000-8000-000000000003';
UPDATE locations SET route_id = 'b0000001-0000-4000-8000-000000000002' WHERE id = 'a0000001-0000-4000-8000-000000000004';
UPDATE locations SET route_id = 'b0000001-0000-4000-8000-000000000002' WHERE id = 'a0000001-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- B3. Machines (14)
-- ---------------------------------------------------------------------------
INSERT INTO machines (id, business_id, location_id, serial_number, make_model, machine_type, capacity_slots, is_active)
VALUES
  -- Downtown Mall (3)
  ('c0000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000001', 'SN-DM-001', 'AMS Sensit 3 Combo', 'combo',    60, true),
  ('c0000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000001', 'SN-DM-002', 'Vendo 721 Beverage', 'beverage', 45, true),
  ('c0000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000001', 'SN-DM-003', 'Crane National 167', 'snack',    40, true),
  -- Airport Terminal A (4)
  ('c0000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000002', 'SN-AT-001', 'AMS Sensit 3 Combo', 'combo',    60, true),
  ('c0000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000002', 'SN-AT-002', 'Vendo 721 Beverage', 'beverage', 45, true),
  ('c0000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000002', 'SN-AT-003', 'Crane National 167', 'snack',    40, true),
  ('c0000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000002', 'SN-AT-004', 'Lavazza Blue Coffee','coffee',   30, true),
  -- TechHub Office Park (3)
  ('c0000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000003', 'SN-TH-001', 'AMS Sensit 3 Combo', 'combo',    60, true),
  ('c0000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000003', 'SN-TH-002', 'Lavazza Blue Coffee','coffee',   30, true),
  ('c0000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000003', 'SN-TH-003', 'Vendo 721 Beverage', 'beverage', 45, true),
  -- Riverside Fitness (2)
  ('c0000001-0000-4000-8000-000000000011', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000004', 'SN-RF-001', 'Vendo 721 Beverage', 'beverage', 45, true),
  ('c0000001-0000-4000-8000-000000000012', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000004', 'SN-RF-002', 'Crane National 167', 'snack',    40, true),
  -- Lakeview University (2)
  ('c0000001-0000-4000-8000-000000000013', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000005', 'SN-LU-001', 'AMS Sensit 3 Combo', 'combo',    60, true),
  ('c0000001-0000-4000-8000-000000000014', '37a44499-0807-43c2-aed5-38f7909e8627', 'a0000001-0000-4000-8000-000000000005', 'SN-LU-002', 'Vendo 721 Beverage', 'beverage', 45, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B4. SKUs / Products (12)
-- ---------------------------------------------------------------------------
INSERT INTO skus (id, business_id, name, category, unit_cost, retail_price, upc_code, supplier)
VALUES
  ('d0000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'Coca-Cola 20oz',        'soda',         0.65, 2.00, '049000042566', 'Coca-Cola Bottling'),
  ('d0000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'Pepsi 20oz',            'soda',         0.62, 2.00, '012000001537', 'PepsiCo'),
  ('d0000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'Dasani Water 16.9oz',   'water',        0.30, 1.75, '049000042573', 'Coca-Cola Bottling'),
  ('d0000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'Monster Energy 16oz',   'energy_drink', 1.25, 3.50, '070847811169', 'Monster Beverage'),
  ('d0000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'Red Bull 8.4oz',        'energy_drink', 1.40, 3.75, '611269991000', 'Red Bull NA'),
  ('d0000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', 'Lays Classic Chips',    'chips',        0.55, 1.75, '028400443463', 'Frito-Lay'),
  ('d0000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', 'Doritos Nacho Cheese',  'chips',        0.60, 1.75, '028400090858', 'Frito-Lay'),
  ('d0000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', 'Snickers Bar',          'candy',        0.50, 1.50, '040000424178', 'Mars Inc'),
  ('d0000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', 'M&Ms Peanut',           'candy',        0.55, 1.50, '040000452645', 'Mars Inc'),
  ('d0000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', 'Pop-Tarts Strawberry',  'pastry',       0.45, 1.50, '038000317309', 'Kelloggs'),
  ('d0000001-0000-4000-8000-000000000011', '37a44499-0807-43c2-aed5-38f7909e8627', 'Starbucks Frappuccino', 'soda',         1.50, 3.50, '012000028434', 'PepsiCo'),
  ('d0000001-0000-4000-8000-000000000012', '37a44499-0807-43c2-aed5-38f7909e8627', 'Kind Bar Almond',       'pastry',       0.75, 2.25, '602652171413', 'Kind Snacks')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B5. Customers (20)
-- ---------------------------------------------------------------------------
INSERT INTO customers (id, team_id, name, email, phone, website, country, city, state, status, token)
VALUES
  ('e0000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'Downtown Mall Management',   'ap@downtownmall.com',     '512-555-0101', 'https://downtownmall.com',     'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'Austin-Bergstrom Airport',   'vendor@austinairport.com', '512-555-0102', 'https://austinairport.com',    'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'TechHub Properties LLC',     'billing@techhub.io',       '512-555-0103', 'https://techhub.io',           'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'Riverside Fitness Inc',       'accounts@riversidefit.com','512-555-0104', 'https://riversidefit.com',     'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'Lakeview University',         'procurement@lakeviewu.edu','512-555-0105', 'https://lakeviewu.edu',       'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', 'Cedar Park Schools',          'ap@cedarpark.k12.tx.us',  '512-555-0106', NULL,                           'US', 'Cedar Park', 'TX', 'prospect', ''),
  ('e0000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', 'Round Rock Medical Center',   'vendor@roundrockmc.com',  '512-555-0107', 'https://roundrockmc.com',     'US', 'Round Rock', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', 'Pflugerville Rec Center',     'info@pflugervillerec.org','512-555-0108', NULL,                           'US', 'Pflugerville', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', 'Capitol Metro Transit',       'contracts@capmetro.org',  '512-555-0109', 'https://capmetro.org',        'US', 'Austin', 'TX', 'prospect', ''),
  ('e0000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', 'Lone Star Automotive',        'office@lonestarauto.com', '512-555-0110', 'https://lonestarauto.com',    'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000011', '37a44499-0807-43c2-aed5-38f7909e8627', 'Hill Country Builders',       'ap@hillcountrybuilders.com','512-555-0111','https://hillcountrybuilders.com','US','Austin','TX','active', ''),
  ('e0000001-0000-4000-8000-000000000012', '37a44499-0807-43c2-aed5-38f7909e8627', 'Barton Springs Hotel',        'gm@bartonspringshotel.com','512-555-0112','https://bartonspringshotel.com','US','Austin','TX','active', ''),
  ('e0000001-0000-4000-8000-000000000013', '37a44499-0807-43c2-aed5-38f7909e8627', 'South Congress Co-Working',   'hello@soco-cowork.com',   '512-555-0113', 'https://soco-cowork.com',     'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000014', '37a44499-0807-43c2-aed5-38f7909e8627', 'East Side Warehousing',       'admin@eastsidewh.com',    '512-555-0114', NULL,                           'US', 'Austin', 'TX', 'inactive', ''),
  ('e0000001-0000-4000-8000-000000000015', '37a44499-0807-43c2-aed5-38f7909e8627', 'Dripping Springs ISD',        'ap@dsisd.k12.tx.us',     '512-555-0115', NULL,                           'US', 'Dripping Springs', 'TX', 'prospect', ''),
  ('e0000001-0000-4000-8000-000000000016', '37a44499-0807-43c2-aed5-38f7909e8627', 'Bee Cave Corporate Park',     'mgmt@beecavecorp.com',    '512-555-0116', 'https://beecavecorp.com',     'US', 'Bee Cave', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000017', '37a44499-0807-43c2-aed5-38f7909e8627', 'Lakeway Resort & Spa',        'ops@lakewayresort.com',   '512-555-0117', 'https://lakewayresort.com',   'US', 'Lakeway', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000018', '37a44499-0807-43c2-aed5-38f7909e8627', 'Austin Convention Center',    'vendor@austincc.com',     '512-555-0118', 'https://austincc.com',        'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000019', '37a44499-0807-43c2-aed5-38f7909e8627', 'Samsung Austin Semiconductor','facilities@samsung.com',  '512-555-0119', 'https://samsung.com',         'US', 'Austin', 'TX', 'active', ''),
  ('e0000001-0000-4000-8000-000000000020', '37a44499-0807-43c2-aed5-38f7909e8627', 'Tesla Gigafactory Texas',     'vendor@tesla.com',        '512-555-0120', 'https://tesla.com',           'US', 'Austin', 'TX', 'prospect', '')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B6. Bank Account (for transactions to reference)
-- ---------------------------------------------------------------------------
INSERT INTO bank_accounts (id, team_id, created_by, name, currency, account_id, balance, enabled, manual, type)
VALUES
  ('f0000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 'Business Checking', 'USD', 'demo-checking-001', 24350.75, true, true, 'depository'),
  ('f0000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 'Business Credit Card', 'USD', 'demo-credit-001', -2180.50, true, true, 'credit')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B7. Transactions (50 — last 90 days)
-- ---------------------------------------------------------------------------
INSERT INTO transactions (id, team_id, date, name, method, amount, currency, internal_id, status, bank_account_id, category_slug, description)
VALUES
  -- Revenue / deposits (positive amounts)
  ('10000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 1,  'Vending Revenue - Downtown Mall',       'deposit',  847.50, 'USD', 'demo-txn-001', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 3,  'Vending Revenue - Airport',             'deposit', 1235.00, 'USD', 'demo-txn-002', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 5,  'Vending Revenue - TechHub',             'deposit',  412.75, 'USD', 'demo-txn-003', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 7,  'Vending Revenue - Riverside Fitness',   'deposit',  378.25, 'USD', 'demo-txn-004', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 8,  'Vending Revenue - Lakeview University', 'deposit',  562.00, 'USD', 'demo-txn-005', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 10, 'Vending Revenue - Downtown Mall',       'deposit',  795.00, 'USD', 'demo-txn-006', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 14, 'Vending Revenue - Airport',             'deposit', 1180.50, 'USD', 'demo-txn-007', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 17, 'Vending Revenue - TechHub',             'deposit',  398.00, 'USD', 'demo-txn-008', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 21, 'Vending Revenue - Riverside Fitness',   'deposit',  345.75, 'USD', 'demo-txn-009', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 22, 'Vending Revenue - Lakeview University', 'deposit',  520.50, 'USD', 'demo-txn-010', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000011', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 28, 'Vending Revenue - Downtown Mall',       'deposit',  810.25, 'USD', 'demo-txn-011', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000012', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 30, 'Vending Revenue - Airport',             'deposit', 1310.00, 'USD', 'demo-txn-012', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000013', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 35, 'Vending Revenue - TechHub',             'deposit',  425.00, 'USD', 'demo-txn-013', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Weekly collection'),
  ('10000001-0000-4000-8000-000000000014', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 42, 'Vending Revenue - All Locations',       'deposit', 3150.00, 'USD', 'demo-txn-014', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly consolidated'),
  ('10000001-0000-4000-8000-000000000015', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 56, 'Vending Revenue - All Locations',       'deposit', 2980.50, 'USD', 'demo-txn-015', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly consolidated'),
  ('10000001-0000-4000-8000-000000000016', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 70, 'Vending Revenue - All Locations',       'deposit', 3275.00, 'USD', 'demo-txn-016', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly consolidated'),
  ('10000001-0000-4000-8000-000000000017', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 84, 'Vending Revenue - All Locations',       'deposit', 2890.75, 'USD', 'demo-txn-017', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly consolidated'),

  -- Expenses (negative amounts)
  ('10000001-0000-4000-8000-000000000018', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 2,  'Coca-Cola Bottling - Inventory',        'card_purchase', -1250.00, 'USD', 'demo-txn-018', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly beverage restock'),
  ('10000001-0000-4000-8000-000000000019', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 2,  'Frito-Lay - Inventory',                 'card_purchase',  -680.00, 'USD', 'demo-txn-019', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly snack restock'),
  ('10000001-0000-4000-8000-000000000020', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 4,  'Mars Inc - Inventory',                  'card_purchase',  -420.00, 'USD', 'demo-txn-020', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly candy restock'),
  ('10000001-0000-4000-8000-000000000021', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 6,  'Shell Gas Station - Fuel',              'card_purchase',  -185.40, 'USD', 'demo-txn-021', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Route fuel'),
  ('10000001-0000-4000-8000-000000000022', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 9,  'AT&T - Telemetry Service',              'payment',        -149.99, 'USD', 'demo-txn-022', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly wireless for 14 machines'),
  ('10000001-0000-4000-8000-000000000023', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 10, 'State Farm - Vehicle Insurance',        'payment',        -210.00, 'USD', 'demo-txn-023', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly premium'),
  ('10000001-0000-4000-8000-000000000024', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 12, 'Grainger - Machine Parts',              'card_purchase',  -312.50, 'USD', 'demo-txn-024', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Replacement coin mech'),
  ('10000001-0000-4000-8000-000000000025', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 15, 'Downtown Mall - Location Rent',         'payment',        -450.00, 'USD', 'demo-txn-025', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000026', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 15, 'Airport Authority - Location Rent',     'payment',        -800.00, 'USD', 'demo-txn-026', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000027', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 15, 'TechHub - Location Rent',               'payment',        -300.00, 'USD', 'demo-txn-027', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000028', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 15, 'Riverside Fitness - Location Rent',     'payment',        -350.00, 'USD', 'demo-txn-028', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000029', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 15, 'Lakeview University - Location Rent',   'payment',        -250.00, 'USD', 'demo-txn-029', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000030', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 18, 'QuickBooks Online - Software',          'payment',         -85.00, 'USD', 'demo-txn-030', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly subscription'),
  ('10000001-0000-4000-8000-000000000031', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 20, 'Shell Gas Station - Fuel',              'card_purchase',  -172.30, 'USD', 'demo-txn-031', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Route fuel'),
  ('10000001-0000-4000-8000-000000000032', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 25, 'Coca-Cola Bottling - Inventory',        'card_purchase', -1180.00, 'USD', 'demo-txn-032', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly beverage restock'),
  ('10000001-0000-4000-8000-000000000033', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 26, 'Frito-Lay - Inventory',                 'card_purchase',  -640.00, 'USD', 'demo-txn-033', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly snack restock'),
  ('10000001-0000-4000-8000-000000000034', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 30, 'Mars Inc - Inventory',                  'card_purchase',  -395.00, 'USD', 'demo-txn-034', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly candy restock'),
  ('10000001-0000-4000-8000-000000000035', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 33, 'Shell Gas Station - Fuel',              'card_purchase',  -195.60, 'USD', 'demo-txn-035', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Route fuel'),
  ('10000001-0000-4000-8000-000000000036', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 38, 'VendSoft - Machine Telemetry',          'payment',        -199.00, 'USD', 'demo-txn-036', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Annual plan monthly'),
  ('10000001-0000-4000-8000-000000000037', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 40, 'Home Depot - Supplies',                 'card_purchase',   -87.45, 'USD', 'demo-txn-037', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Cleaning supplies'),
  ('10000001-0000-4000-8000-000000000038', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 45, 'Downtown Mall - Location Rent',         'payment',        -450.00, 'USD', 'demo-txn-038', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000039', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 45, 'Airport Authority - Location Rent',     'payment',        -800.00, 'USD', 'demo-txn-039', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000040', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 45, 'TechHub - Location Rent',               'payment',        -300.00, 'USD', 'demo-txn-040', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly rent'),
  ('10000001-0000-4000-8000-000000000041', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 48, 'Coca-Cola Bottling - Inventory',        'card_purchase', -1310.00, 'USD', 'demo-txn-041', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly beverage restock'),
  ('10000001-0000-4000-8000-000000000042', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 50, 'Frito-Lay - Inventory',                 'card_purchase',  -710.00, 'USD', 'demo-txn-042', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Monthly snack restock'),
  ('10000001-0000-4000-8000-000000000043', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 55, 'AT&T - Telemetry Service',              'payment',        -149.99, 'USD', 'demo-txn-043', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly wireless'),
  ('10000001-0000-4000-8000-000000000044', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 60, 'Shell Gas Station - Fuel',              'card_purchase',  -168.90, 'USD', 'demo-txn-044', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Route fuel'),
  ('10000001-0000-4000-8000-000000000045', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 65, 'Kelloggs - Inventory',                  'card_purchase',  -280.00, 'USD', 'demo-txn-045', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Pastry restock'),
  ('10000001-0000-4000-8000-000000000046', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 68, 'Kind Snacks - Inventory',               'card_purchase',  -195.00, 'USD', 'demo-txn-046', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Health snack restock'),
  ('10000001-0000-4000-8000-000000000047', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 72, 'Red Bull NA - Inventory',               'card_purchase',  -560.00, 'USD', 'demo-txn-047', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Energy drink restock'),
  ('10000001-0000-4000-8000-000000000048', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 75, 'Monster Beverage - Inventory',          'card_purchase',  -475.00, 'USD', 'demo-txn-048', 'posted', 'f0000001-0000-4000-8000-000000000002', NULL, 'Energy drink restock'),
  ('10000001-0000-4000-8000-000000000049', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 80, 'State Farm - Vehicle Insurance',        'payment',        -210.00, 'USD', 'demo-txn-049', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly premium'),
  ('10000001-0000-4000-8000-000000000050', '37a44499-0807-43c2-aed5-38f7909e8627', CURRENT_DATE - 85, 'QuickBooks Online - Software',          'payment',         -85.00, 'USD', 'demo-txn-050', 'posted', 'f0000001-0000-4000-8000-000000000001', NULL, 'Monthly subscription')
ON CONFLICT (internal_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B8. Invoices (30 — mix of paid, open/unpaid, overdue, draft)
-- ---------------------------------------------------------------------------
INSERT INTO invoices (id, team_id, invoice_number, customer_id, customer_name, amount, currency, status, issue_date, due_date, paid_at, user_id, token)
VALUES
  -- Paid invoices (12)
  ('20000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-001', 'e0000001-0000-4000-8000-000000000001', 'Downtown Mall Management',  1350.00, 'USD', 'paid',    (CURRENT_DATE - 80)::timestamptz, (CURRENT_DATE - 50)::timestamptz, (CURRENT_DATE - 48)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-002', 'e0000001-0000-4000-8000-000000000002', 'Austin-Bergstrom Airport',  2400.00, 'USD', 'paid',    (CURRENT_DATE - 78)::timestamptz, (CURRENT_DATE - 48)::timestamptz, (CURRENT_DATE - 45)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-003', 'e0000001-0000-4000-8000-000000000003', 'TechHub Properties LLC',     900.00, 'USD', 'paid',    (CURRENT_DATE - 75)::timestamptz, (CURRENT_DATE - 45)::timestamptz, (CURRENT_DATE - 44)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-004', 'e0000001-0000-4000-8000-000000000004', 'Riverside Fitness Inc',       750.00, 'USD', 'paid',    (CURRENT_DATE - 70)::timestamptz, (CURRENT_DATE - 40)::timestamptz, (CURRENT_DATE - 38)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-005', 'e0000001-0000-4000-8000-000000000005', 'Lakeview University',        1100.00, 'USD', 'paid',    (CURRENT_DATE - 65)::timestamptz, (CURRENT_DATE - 35)::timestamptz, (CURRENT_DATE - 32)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-006', 'e0000001-0000-4000-8000-000000000007', 'Round Rock Medical Center',  1800.00, 'USD', 'paid',    (CURRENT_DATE - 60)::timestamptz, (CURRENT_DATE - 30)::timestamptz, (CURRENT_DATE - 28)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-007', 'e0000001-0000-4000-8000-000000000008', 'Pflugerville Rec Center',     620.00, 'USD', 'paid',    (CURRENT_DATE - 55)::timestamptz, (CURRENT_DATE - 25)::timestamptz, (CURRENT_DATE - 24)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-008', 'e0000001-0000-4000-8000-000000000010', 'Lone Star Automotive',        480.00, 'USD', 'paid',    (CURRENT_DATE - 50)::timestamptz, (CURRENT_DATE - 20)::timestamptz, (CURRENT_DATE - 18)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-009', 'e0000001-0000-4000-8000-000000000011', 'Hill Country Builders',       550.00, 'USD', 'paid',    (CURRENT_DATE - 48)::timestamptz, (CURRENT_DATE - 18)::timestamptz, (CURRENT_DATE - 15)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-010', 'e0000001-0000-4000-8000-000000000012', 'Barton Springs Hotel',       1250.00, 'USD', 'paid',    (CURRENT_DATE - 45)::timestamptz, (CURRENT_DATE - 15)::timestamptz, (CURRENT_DATE - 12)::timestamptz, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000011', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-011', 'e0000001-0000-4000-8000-000000000013', 'South Congress Co-Working',   380.00, 'USD', 'paid',    (CURRENT_DATE - 40)::timestamptz, (CURRENT_DATE - 10)::timestamptz, (CURRENT_DATE - 8)::timestamptz,  'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000012', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-012', 'e0000001-0000-4000-8000-000000000016', 'Bee Cave Corporate Park',     950.00, 'USD', 'paid',    (CURRENT_DATE - 38)::timestamptz, (CURRENT_DATE - 8)::timestamptz,  (CURRENT_DATE - 5)::timestamptz,  'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),

  -- Unpaid / open invoices (8)
  ('20000001-0000-4000-8000-000000000013', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-013', 'e0000001-0000-4000-8000-000000000001', 'Downtown Mall Management',  1400.00, 'USD', 'unpaid',  (CURRENT_DATE - 20)::timestamptz, (CURRENT_DATE + 10)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000014', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-014', 'e0000001-0000-4000-8000-000000000002', 'Austin-Bergstrom Airport',  2600.00, 'USD', 'unpaid',  (CURRENT_DATE - 18)::timestamptz, (CURRENT_DATE + 12)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000015', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-015', 'e0000001-0000-4000-8000-000000000003', 'TechHub Properties LLC',     920.00, 'USD', 'unpaid',  (CURRENT_DATE - 15)::timestamptz, (CURRENT_DATE + 15)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000016', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-016', 'e0000001-0000-4000-8000-000000000005', 'Lakeview University',        1150.00, 'USD', 'unpaid',  (CURRENT_DATE - 12)::timestamptz, (CURRENT_DATE + 18)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000017', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-017', 'e0000001-0000-4000-8000-000000000017', 'Lakeway Resort & Spa',       1680.00, 'USD', 'unpaid',  (CURRENT_DATE - 10)::timestamptz, (CURRENT_DATE + 20)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000018', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-018', 'e0000001-0000-4000-8000-000000000018', 'Austin Convention Center',   2200.00, 'USD', 'unpaid',  (CURRENT_DATE - 8)::timestamptz,  (CURRENT_DATE + 22)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000019', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-019', 'e0000001-0000-4000-8000-000000000019', 'Samsung Austin Semiconductor',3500.00, 'USD', 'unpaid',  (CURRENT_DATE - 5)::timestamptz,  (CURRENT_DATE + 25)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000020', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-020', 'e0000001-0000-4000-8000-000000000004', 'Riverside Fitness Inc',       780.00, 'USD', 'unpaid',  (CURRENT_DATE - 3)::timestamptz,  (CURRENT_DATE + 27)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),

  -- Overdue invoices (6)
  ('20000001-0000-4000-8000-000000000021', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-021', 'e0000001-0000-4000-8000-000000000014', 'East Side Warehousing',       420.00, 'USD', 'overdue', (CURRENT_DATE - 60)::timestamptz, (CURRENT_DATE - 30)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000022', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-022', 'e0000001-0000-4000-8000-000000000006', 'Cedar Park Schools',          680.00, 'USD', 'overdue', (CURRENT_DATE - 50)::timestamptz, (CURRENT_DATE - 20)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000023', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-023', 'e0000001-0000-4000-8000-000000000009', 'Capitol Metro Transit',       1100.00, 'USD', 'overdue', (CURRENT_DATE - 45)::timestamptz, (CURRENT_DATE - 15)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000024', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-024', 'e0000001-0000-4000-8000-000000000015', 'Dripping Springs ISD',         540.00, 'USD', 'overdue', (CURRENT_DATE - 42)::timestamptz, (CURRENT_DATE - 12)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000025', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-025', 'e0000001-0000-4000-8000-000000000010', 'Lone Star Automotive',         495.00, 'USD', 'overdue', (CURRENT_DATE - 40)::timestamptz, (CURRENT_DATE - 10)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000026', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-026', 'e0000001-0000-4000-8000-000000000008', 'Pflugerville Rec Center',      650.00, 'USD', 'overdue', (CURRENT_DATE - 38)::timestamptz, (CURRENT_DATE - 8)::timestamptz,  NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),

  -- Draft invoices (4)
  ('20000001-0000-4000-8000-000000000027', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-027', 'e0000001-0000-4000-8000-000000000020', 'Tesla Gigafactory Texas',     4500.00, 'USD', 'draft',   (CURRENT_DATE - 2)::timestamptz,  (CURRENT_DATE + 28)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000028', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-028', 'e0000001-0000-4000-8000-000000000009', 'Capitol Metro Transit',       1350.00, 'USD', 'draft',   (CURRENT_DATE - 1)::timestamptz,  (CURRENT_DATE + 29)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000029', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-029', 'e0000001-0000-4000-8000-000000000006', 'Cedar Park Schools',           890.00, 'USD', 'draft',   CURRENT_DATE::timestamptz,        (CURRENT_DATE + 30)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', ''),
  ('20000001-0000-4000-8000-000000000030', '37a44499-0807-43c2-aed5-38f7909e8627', 'INV-2026-030', 'e0000001-0000-4000-8000-000000000007', 'Round Rock Medical Center',   1950.00, 'USD', 'draft',   CURRENT_DATE::timestamptz,        (CURRENT_DATE + 30)::timestamptz, NULL, 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', '')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B9. Tracker Projects (10)
-- ---------------------------------------------------------------------------
INSERT INTO tracker_projects (id, team_id, name, description, status, rate, currency, billable, customer_id)
VALUES
  ('30000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', 'Airport Expansion',       'Install 3 new machines at Terminal B',           'in_progress', 85.00,  'USD', true,  'e0000001-0000-4000-8000-000000000002'),
  ('30000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', 'TechHub Coffee Upgrade',  'Replace coffee machine with premium model',      'in_progress', 75.00,  'USD', true,  'e0000001-0000-4000-8000-000000000003'),
  ('30000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', 'Q1 Route Optimization',   'Analyze and optimize delivery routes',           'completed',   100.00, 'USD', true,  NULL),
  ('30000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', 'University Micro Market',  'Set up micro market at Lakeview student union',  'in_progress', 90.00,  'USD', true,  'e0000001-0000-4000-8000-000000000005'),
  ('30000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', 'Cashless Retrofit',        'Upgrade 8 machines to accept card payments',     'completed',   70.00,  'USD', true,  NULL),
  ('30000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', 'Samsung Proposal',         'Site survey and proposal for Samsung campus',    'in_progress', 95.00,  'USD', true,  'e0000001-0000-4000-8000-000000000019'),
  ('30000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', 'Tesla Site Survey',        'Evaluate vending needs at Gigafactory',          'in_progress', 95.00,  'USD', true,  'e0000001-0000-4000-8000-000000000020'),
  ('30000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', 'Preventive Maintenance',   'Quarterly PM on all 14 machines',                'in_progress', 65.00,  'USD', false, NULL),
  ('30000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', 'Revenue Dashboard Setup',  'Configure VendCFO for real-time analytics',      'completed',   0.00,   'USD', false, NULL),
  ('30000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', 'Convention Center Bid',    'Prepare bid for Austin Convention Center',        'in_progress', 85.00,  'USD', true,  'e0000001-0000-4000-8000-000000000018')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- B10. Tracker Entries (for the projects above — gives them duration data)
-- ---------------------------------------------------------------------------
INSERT INTO tracker_entries (id, team_id, project_id, assigned_id, duration, date, description, rate, currency)
VALUES
  -- Airport Expansion
  ('40000001-0000-4000-8000-000000000001', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000001', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 7200,  CURRENT_DATE - 5,  'Site survey Terminal B',        85.00, 'USD'),
  ('40000001-0000-4000-8000-000000000002', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000001', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 10800, CURRENT_DATE - 3,  'Electrical and placement plan', 85.00, 'USD'),
  -- TechHub Coffee Upgrade
  ('40000001-0000-4000-8000-000000000003', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000002', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 5400,  CURRENT_DATE - 8,  'Remove old machine',            75.00, 'USD'),
  ('40000001-0000-4000-8000-000000000004', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000002', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 3600,  CURRENT_DATE - 7,  'Install new Lavazza unit',      75.00, 'USD'),
  -- Q1 Route Optimization (completed)
  ('40000001-0000-4000-8000-000000000005', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000003', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 14400, CURRENT_DATE - 30, 'Data analysis and mapping',     100.00, 'USD'),
  ('40000001-0000-4000-8000-000000000006', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000003', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 7200,  CURRENT_DATE - 25, 'Route testing',                 100.00, 'USD'),
  -- University Micro Market
  ('40000001-0000-4000-8000-000000000007', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000004', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 3600,  CURRENT_DATE - 10, 'Initial meeting with admin',    90.00, 'USD'),
  -- Cashless Retrofit (completed)
  ('40000001-0000-4000-8000-000000000008', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000005', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 28800, CURRENT_DATE - 45, 'Install card readers on 8 units',70.00, 'USD'),
  -- Samsung Proposal
  ('40000001-0000-4000-8000-000000000009', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000006', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 5400,  CURRENT_DATE - 4,  'Campus walkthrough',            95.00, 'USD'),
  -- Tesla Site Survey
  ('40000001-0000-4000-8000-000000000010', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000007', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 7200,  CURRENT_DATE - 2,  'Gigafactory floor plan review', 95.00, 'USD'),
  -- Preventive Maintenance
  ('40000001-0000-4000-8000-000000000011', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000008', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 10800, CURRENT_DATE - 6,  'PM on North Loop machines',     65.00, 'USD'),
  ('40000001-0000-4000-8000-000000000012', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000008', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 10800, CURRENT_DATE - 1,  'PM on South Route machines',    65.00, 'USD'),
  -- Convention Center Bid
  ('40000001-0000-4000-8000-000000000013', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000010', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 3600,  CURRENT_DATE - 9,  'RFP review',                    85.00, 'USD'),
  ('40000001-0000-4000-8000-000000000014', '37a44499-0807-43c2-aed5-38f7909e8627', '30000001-0000-4000-8000-000000000010', 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1', 5400,  CURRENT_DATE - 7,  'Draft proposal and pricing',    85.00, 'USD')
ON CONFLICT (id) DO NOTHING;

COMMIT;
