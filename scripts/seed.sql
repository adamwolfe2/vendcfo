-- ============================================================================
-- VendCFO Seed Data — 5 Years of Realistic Vending Business Data
-- Team: AIMS (37a44499-0807-43c2-aed5-38f7909e8627)
-- User: e68ad16d-0905-4eb7-82f5-0bb122d0e3f1
-- ============================================================================

-- Variables
DO $$
DECLARE
  v_team_id uuid := '37a44499-0807-43c2-aed5-38f7909e8627';
  v_user_id uuid := 'e68ad16d-0905-4eb7-82f5-0bb122d0e3f1';
BEGIN

-- ─── BANK ACCOUNTS ──────────────────────────────────────────────────────────
INSERT INTO bank_accounts (id, created_by, team_id, name, currency, enabled, account_id, balance, manual, type, base_currency) VALUES
  ('aa000001-0000-0000-0000-000000000001', v_user_id, v_team_id, 'AIMS Business Checking', 'USD', true, 'manual-checking-001', 47250.00, true, 'depository', 'USD'),
  ('aa000001-0000-0000-0000-000000000002', v_user_id, v_team_id, 'AIMS Business Savings', 'USD', true, 'manual-savings-001', 125000.00, true, 'depository', 'USD'),
  ('aa000001-0000-0000-0000-000000000003', v_user_id, v_team_id, 'AIMS Business Credit Card', 'USD', true, 'manual-credit-001', -3200.00, true, 'credit', 'USD');

-- ─── CUSTOMERS (Location Contacts / Vendors) ───────────────────────────────
INSERT INTO customers (id, name, email, country, address_line_1, city, state, zip, team_id, phone, status, token, country_code, industry) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'Metro Office Park LLC', 'billing@metroofficepk.com', 'US', '1200 Commerce Blvd', 'Austin', 'TX', '78701', v_team_id, '512-555-0101', 'active', '', 'US', 'Real Estate'),
  ('c1000001-0000-0000-0000-000000000002', 'Riverside Corporate Center', 'accounts@riversidecc.com', 'US', '800 River Walk Dr', 'San Antonio', 'TX', '78205', v_team_id, '210-555-0202', 'active', '', 'US', 'Real Estate'),
  ('c1000001-0000-0000-0000-000000000003', 'Lone Star University', 'procurement@lonestaruni.edu', 'US', '500 University Ave', 'Dallas', 'TX', '75201', v_team_id, '214-555-0303', 'active', '', 'US', 'Education'),
  ('c1000001-0000-0000-0000-000000000004', 'FitZone Gym Network', 'ops@fitzonegyms.com', 'US', '2300 Fitness Ln', 'Houston', 'TX', '77001', v_team_id, '713-555-0404', 'active', '', 'US', 'Health & Fitness'),
  ('c1000001-0000-0000-0000-000000000005', 'TechHub Coworking', 'admin@techhubcw.com', 'US', '900 Innovation Pkwy', 'Austin', 'TX', '78702', v_team_id, '512-555-0505', 'active', '', 'US', 'Technology'),
  ('c1000001-0000-0000-0000-000000000006', 'Greenfield Hospital', 'purchasing@greenfieldhsp.com', 'US', '4500 Medical Center Dr', 'Houston', 'TX', '77030', v_team_id, '713-555-0606', 'active', '', 'US', 'Healthcare'),
  ('c1000001-0000-0000-0000-000000000007', 'Summit Manufacturing', 'facilities@summitmfg.com', 'US', '7800 Industrial Blvd', 'Fort Worth', 'TX', '76102', v_team_id, '817-555-0707', 'active', '', 'US', 'Manufacturing'),
  ('c1000001-0000-0000-0000-000000000008', 'Westlake Mall Group', 'leasing@westlakemall.com', 'US', '3200 Westlake Blvd', 'Austin', 'TX', '78746', v_team_id, '512-555-0808', 'active', '', 'US', 'Retail'),
  ('c1000001-0000-0000-0000-000000000009', 'Capital City Schools', 'admin@capitalcityschools.org', 'US', '1100 Education Way', 'Austin', 'TX', '78703', v_team_id, '512-555-0909', 'active', '', 'US', 'Education'),
  ('c1000001-0000-0000-0000-000000000010', 'PepsiCo Bottling (Supplier)', 'orders@pepsibottling.com', 'US', '100 Beverage Dr', 'Dallas', 'TX', '75202', v_team_id, '214-555-1010', 'active', '', 'US', 'Food & Beverage'),
  ('c1000001-0000-0000-0000-000000000011', 'Frito-Lay Distribution (Supplier)', 'vendorsales@fritolay.com', 'US', '200 Snack Ave', 'Plano', 'TX', '75024', v_team_id, '972-555-1111', 'active', '', 'US', 'Food & Beverage'),
  ('c1000001-0000-0000-0000-000000000012', 'AutoCrib Vending (Equipment)', 'sales@autocrib.com', 'US', '5000 Vend Tech Way', 'Phoenix', 'AZ', '85001', v_team_id, '602-555-1212', 'active', '', 'US', 'Manufacturing');

-- ─── ROUTES ─────────────────────────────────────────────────────────────────
INSERT INTO routes (id, business_id, name, description, operator_id, is_active) VALUES
  ('a1000001-0000-0000-0000-000000000001', v_team_id, 'Austin Downtown', 'Downtown Austin office buildings and coworking spaces', v_user_id, true),
  ('a1000001-0000-0000-0000-000000000002', v_team_id, 'Austin South', 'South Austin gyms, hospitals, and retail', v_user_id, true),
  ('a1000001-0000-0000-0000-000000000003', v_team_id, 'San Antonio Metro', 'San Antonio corporate centers', v_user_id, true),
  ('a1000001-0000-0000-0000-000000000004', v_team_id, 'Dallas-Fort Worth', 'DFW area universities and manufacturing', v_user_id, true),
  ('a1000001-0000-0000-0000-000000000005', v_team_id, 'Houston Medical', 'Houston medical center and surrounding area', v_user_id, true);

-- ─── LOCATIONS ──────────────────────────────────────────────────────────────
INSERT INTO locations (id, business_id, route_id, name, address, location_type, rev_share_pct, contact_name, contact_email, monthly_rent, service_frequency_days, is_active) VALUES
  ('b1000001-0000-0000-0000-000000000001', v_team_id, 'a1000001-0000-0000-0000-000000000001', 'Metro Office Park - Lobby', '1200 Commerce Blvd, Austin TX', 'office', 8.00, 'Sarah Chen', 'schen@metroofficepk.com', 150.00, 7, true),
  ('b1000001-0000-0000-0000-000000000002', v_team_id, 'a1000001-0000-0000-0000-000000000001', 'TechHub Coworking - 2nd Floor', '900 Innovation Pkwy, Austin TX', 'office', 10.00, 'Mike Torres', 'mtorres@techhubcw.com', 0.00, 5, true),
  ('b1000001-0000-0000-0000-000000000003', v_team_id, 'a1000001-0000-0000-0000-000000000001', 'Capital City High School', '1100 Education Way, Austin TX', 'school', 5.00, 'Linda Park', 'lpark@capitalcityschools.org', 100.00, 5, true),
  ('b1000001-0000-0000-0000-000000000004', v_team_id, 'a1000001-0000-0000-0000-000000000002', 'FitZone Gym - South Lamar', '2300 Fitness Ln, Austin TX', 'gym', 12.00, 'Jake Hernandez', 'jake@fitzonegyms.com', 0.00, 3, true),
  ('b1000001-0000-0000-0000-000000000005', v_team_id, 'a1000001-0000-0000-0000-000000000002', 'Westlake Mall - Food Court', '3200 Westlake Blvd, Austin TX', 'transit', 15.00, 'Amy Walsh', 'awalsh@westlakemall.com', 250.00, 3, true),
  ('b1000001-0000-0000-0000-000000000006', v_team_id, 'a1000001-0000-0000-0000-000000000003', 'Riverside Corporate Center', '800 River Walk Dr, San Antonio TX', 'office', 7.00, 'Carlos Ruiz', 'cruiz@riversidecc.com', 175.00, 7, true),
  ('b1000001-0000-0000-0000-000000000007', v_team_id, 'a1000001-0000-0000-0000-000000000004', 'Lone Star University - Student Union', '500 University Ave, Dallas TX', 'school', 6.00, 'Dr. Rachel Kim', 'rkim@lonestaruni.edu', 200.00, 3, true),
  ('b1000001-0000-0000-0000-000000000008', v_team_id, 'a1000001-0000-0000-0000-000000000004', 'Summit Manufacturing - Break Room', '7800 Industrial Blvd, Fort Worth TX', 'other', 0.00, 'Tom Bradley', 'tbradley@summitmfg.com', 0.00, 7, true),
  ('b1000001-0000-0000-0000-000000000009', v_team_id, 'a1000001-0000-0000-0000-000000000005', 'Greenfield Hospital - Main Lobby', '4500 Medical Center Dr, Houston TX', 'other', 10.00, 'Nurse Patel', 'npatel@greenfieldhsp.com', 300.00, 3, true),
  ('b1000001-0000-0000-0000-000000000010', v_team_id, 'a1000001-0000-0000-0000-000000000005', 'Greenfield Hospital - Staff Lounge', '4500 Medical Center Dr, Houston TX', 'other', 10.00, 'Nurse Patel', 'npatel@greenfieldhsp.com', 0.00, 5, true);

-- ─── MACHINES ───────────────────────────────────────────────────────────────
INSERT INTO machines (id, business_id, location_id, serial_number, make_model, machine_type, capacity_slots, date_acquired, purchase_price, is_active) VALUES
  ('d1000001-0000-0000-0000-000000000001', v_team_id, 'b1000001-0000-0000-0000-000000000001', 'SN-2021-001', 'AMS Sensit 3 Combo', 'combo', 45, '2021-03-15', 4500.00, true),
  ('d1000001-0000-0000-0000-000000000002', v_team_id, 'b1000001-0000-0000-0000-000000000002', 'SN-2021-002', 'Crane Merchant 6 Snack', 'snack', 40, '2021-06-01', 3800.00, true),
  ('d1000001-0000-0000-0000-000000000003', v_team_id, 'b1000001-0000-0000-0000-000000000002', 'SN-2021-003', 'Vendo 721 Beverage', 'beverage', 30, '2021-06-01', 3200.00, true),
  ('d1000001-0000-0000-0000-000000000004', v_team_id, 'b1000001-0000-0000-0000-000000000003', 'SN-2022-001', 'AMS Sensit 3 Combo', 'combo', 45, '2022-01-10', 4200.00, true),
  ('d1000001-0000-0000-0000-000000000005', v_team_id, 'b1000001-0000-0000-0000-000000000004', 'SN-2022-002', 'Vendo 721 Beverage', 'beverage', 30, '2022-04-20', 3200.00, true),
  ('d1000001-0000-0000-0000-000000000006', v_team_id, 'b1000001-0000-0000-0000-000000000005', 'SN-2022-003', 'AMS Sensit 3 Combo', 'combo', 45, '2022-07-01', 4800.00, true),
  ('d1000001-0000-0000-0000-000000000007', v_team_id, 'b1000001-0000-0000-0000-000000000005', 'SN-2022-004', 'Crane Merchant 6 Snack', 'snack', 40, '2022-07-01', 3800.00, true),
  ('d1000001-0000-0000-0000-000000000008', v_team_id, 'b1000001-0000-0000-0000-000000000006', 'SN-2023-001', 'AMS Sensit 3 Combo', 'combo', 45, '2023-02-15', 5000.00, true),
  ('d1000001-0000-0000-0000-000000000009', v_team_id, 'b1000001-0000-0000-0000-000000000007', 'SN-2023-002', 'Crane Merchant 6 Snack', 'snack', 40, '2023-05-01', 4000.00, true),
  ('d1000001-0000-0000-0000-000000000010', v_team_id, 'b1000001-0000-0000-0000-000000000007', 'SN-2023-003', 'Vendo 721 Beverage', 'beverage', 30, '2023-05-01', 3500.00, true),
  ('d1000001-0000-0000-0000-000000000011', v_team_id, 'b1000001-0000-0000-0000-000000000008', 'SN-2023-004', 'AMS Sensit 3 Combo', 'combo', 45, '2023-09-01', 4500.00, true),
  ('d1000001-0000-0000-0000-000000000012', v_team_id, 'b1000001-0000-0000-0000-000000000009', 'SN-2024-001', 'AMS Sensit 3 Combo', 'combo', 45, '2024-01-15', 5200.00, true),
  ('d1000001-0000-0000-0000-000000000013', v_team_id, 'b1000001-0000-0000-0000-000000000009', 'SN-2024-002', 'Vendo 721 Beverage', 'beverage', 30, '2024-01-15', 3500.00, true),
  ('d1000001-0000-0000-0000-000000000014', v_team_id, 'b1000001-0000-0000-0000-000000000010', 'SN-2024-003', 'Crane Merchant 6 Snack', 'snack', 40, '2024-06-01', 4200.00, true);

-- ─── SKUs / PRODUCTS ────────────────────────────────────────────────────────
INSERT INTO skus (id, business_id, name, category, unit_cost, retail_price, target_margin_pct, upc_code, supplier) VALUES
  ('e1000001-0000-0000-0000-000000000001', v_team_id, 'Coca-Cola 20oz', 'soda', 0.85, 2.00, 57.5, '049000042559', 'PepsiCo Bottling'),
  ('e1000001-0000-0000-0000-000000000002', v_team_id, 'Diet Coke 20oz', 'soda', 0.85, 2.00, 57.5, '049000006346', 'PepsiCo Bottling'),
  ('e1000001-0000-0000-0000-000000000003', v_team_id, 'Dasani Water 20oz', 'water', 0.45, 1.75, 74.3, '049000042726', 'PepsiCo Bottling'),
  ('e1000001-0000-0000-0000-000000000004', v_team_id, 'Red Bull 12oz', 'energy_drink', 1.65, 3.50, 52.9, '611269991000', 'PepsiCo Bottling'),
  ('e1000001-0000-0000-0000-000000000005', v_team_id, 'Monster Energy 16oz', 'energy_drink', 1.45, 3.25, 55.4, '070847811169', 'PepsiCo Bottling'),
  ('e1000001-0000-0000-0000-000000000006', v_team_id, 'Lays Classic Chips', 'chips', 0.65, 1.75, 62.9, '028400443685', 'Frito-Lay Distribution'),
  ('e1000001-0000-0000-0000-000000000007', v_team_id, 'Doritos Nacho Cheese', 'chips', 0.65, 1.75, 62.9, '028400443692', 'Frito-Lay Distribution'),
  ('e1000001-0000-0000-0000-000000000008', v_team_id, 'Snickers Bar', 'candy', 0.55, 1.50, 63.3, '040000423041', 'Frito-Lay Distribution'),
  ('e1000001-0000-0000-0000-000000000009', v_team_id, 'M&Ms Peanut', 'candy', 0.55, 1.50, 63.3, '040000424284', 'Frito-Lay Distribution'),
  ('e1000001-0000-0000-0000-000000000010', v_team_id, 'Pop-Tarts Strawberry', 'pastry', 0.50, 1.50, 66.7, '038000317361', 'Frito-Lay Distribution'),
  ('e1000001-0000-0000-0000-000000000011', v_team_id, 'Grandmas Cookies Choc Chip', 'pastry', 0.45, 1.25, 64.0, '028400015509', 'Frito-Lay Distribution'),
  ('e1000001-0000-0000-0000-000000000012', v_team_id, 'Gatorade Fruit Punch 20oz', 'soda', 0.95, 2.25, 57.8, '052000328981', 'PepsiCo Bottling');

-- ─── TRANSACTION CATEGORIES ─────────────────────────────────────────────────
INSERT INTO transaction_categories (id, name, team_id, slug, system, color) VALUES
  ('00000001-0000-0000-0000-000000000001', 'Vending Revenue', v_team_id, 'vending-revenue', false, '#22c55e'),
  ('00000001-0000-0000-0000-000000000002', 'Inventory Purchase', v_team_id, 'inventory-purchase', false, '#ef4444'),
  ('00000001-0000-0000-0000-000000000003', 'Equipment Purchase', v_team_id, 'equipment-purchase', false, '#f97316'),
  ('00000001-0000-0000-0000-000000000004', 'Vehicle Expense', v_team_id, 'vehicle-expense', false, '#8b5cf6'),
  ('00000001-0000-0000-0000-000000000005', 'Location Rent', v_team_id, 'location-rent', false, '#06b6d4'),
  ('00000001-0000-0000-0000-000000000006', 'Insurance', v_team_id, 'insurance', false, '#64748b'),
  ('00000001-0000-0000-0000-000000000007', 'Repairs & Maintenance', v_team_id, 'repairs-maintenance', false, '#eab308'),
  ('00000001-0000-0000-0000-000000000008', 'Fuel & Mileage', v_team_id, 'fuel-mileage', false, '#a855f7')
ON CONFLICT DO NOTHING;

-- ─── TRANSACTIONS (5 years: 2021-2025) ─────────────────────────────────────
-- Generate monthly revenue deposits + expense transactions
INSERT INTO transactions (id, date, name, method, amount, currency, team_id, internal_id, status, manual, category_slug, bank_account_id, description)
SELECT
  gen_random_uuid(),
  d::date,
  'Vending Collections - ' || to_char(d, 'Mon YYYY'),
  'transfer',
  -- Revenue grows: ~$4k/mo in 2021, scaling to ~$18k/mo in 2025
  round((3500 + (EXTRACT(YEAR FROM d) - 2021) * 250 * 12 / 12 + random() * 1500 + EXTRACT(MONTH FROM d) * 100)::numeric, 2),
  'USD',
  v_team_id,
  'rev-' || to_char(d, 'YYYY-MM'),
  'posted',
  true,
  'vending-revenue',
    'aa000001-0000-0000-0000-000000000001',
  'Monthly vending machine collections deposited'
FROM generate_series('2021-01-15'::date, '2025-12-15'::date, '1 month') AS d;

-- Monthly COGS (inventory purchases ~45% of revenue)
INSERT INTO transactions (id, date, name, method, amount, currency, team_id, internal_id, status, manual, category_slug, bank_account_id, description)
SELECT
  gen_random_uuid(),
  (d + interval '5 days')::date,
  'Wholesale Inventory Restock',
  'card_purchase',
  round((-1 * (1500 + (EXTRACT(YEAR FROM d) - 2021) * 120 * 12 / 12 + random() * 800))::numeric, 2),
  'USD',
  v_team_id,
  'cogs-' || to_char(d, 'YYYY-MM'),
  'posted',
  true,
  'inventory-purchase',
    'aa000001-0000-0000-0000-000000000001',
  'Monthly inventory restock - snacks and beverages'
FROM generate_series('2021-01-20'::date, '2025-12-20'::date, '1 month') AS d;

-- Monthly vehicle expenses
INSERT INTO transactions (id, date, name, method, amount, currency, team_id, internal_id, status, manual, category_slug, bank_account_id, description)
SELECT
  gen_random_uuid(),
  (d + interval '10 days')::date,
  'Vehicle - Gas & Maintenance',
  'card_purchase',
  round((-1 * (350 + random() * 200))::numeric, 2),
  'USD',
  v_team_id,
  'vehicle-' || to_char(d, 'YYYY-MM'),
  'posted',
  true,
  'vehicle-expense',
    'aa000001-0000-0000-0000-000000000003',
  'Route van fuel, oil changes, tires'
FROM generate_series('2021-01-10'::date, '2025-12-10'::date, '1 month') AS d;

-- Quarterly location rent payments
INSERT INTO transactions (id, date, name, method, amount, currency, team_id, internal_id, status, manual, category_slug, bank_account_id, description)
SELECT
  gen_random_uuid(),
  d::date,
  'Location Rent Payments (Quarterly)',
  'ach',
  round((-1 * (800 + (EXTRACT(YEAR FROM d) - 2021) * 150 + random() * 200))::numeric, 2),
  'USD',
  v_team_id,
  'rent-' || to_char(d, 'YYYY-Q'),
  'posted',
  true,
  'location-rent',
    'aa000001-0000-0000-0000-000000000001',
  'Quarterly rent for vending locations'
FROM generate_series('2021-03-01'::date, '2025-12-01'::date, '3 months') AS d;

-- Quarterly insurance
INSERT INTO transactions (id, date, name, method, amount, currency, team_id, internal_id, status, manual, category_slug, bank_account_id, description)
SELECT
  gen_random_uuid(),
  (d + interval '15 days')::date,
  'Business Insurance Premium',
  'ach',
  round((-1 * (450 + (EXTRACT(YEAR FROM d) - 2021) * 30 + random() * 50))::numeric, 2),
  'USD',
  v_team_id,
  'ins-' || to_char(d, 'YYYY-Q'),
  'posted',
  true,
  'insurance',
    'aa000001-0000-0000-0000-000000000001',
  'Quarterly business and liability insurance'
FROM generate_series('2021-01-15'::date, '2025-12-15'::date, '3 months') AS d;

-- Random repair expenses (2-4 per year)
INSERT INTO transactions (id, date, name, method, amount, currency, team_id, internal_id, status, manual, category_slug, bank_account_id, description)
SELECT
  gen_random_uuid(),
  d::date,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Machine Repair - Coin Mech'
    WHEN 1 THEN 'Machine Repair - Compressor'
    WHEN 2 THEN 'Machine Repair - Card Reader'
    ELSE 'Machine Repair - General'
  END,
  'card_purchase',
  round((-1 * (75 + random() * 350))::numeric, 2),
  'USD',
  v_team_id,
  'repair-' || to_char(d, 'YYYY-MM-DD'),
  'posted',
  true,
  'repairs-maintenance',
    'aa000001-0000-0000-0000-000000000003',
  'Emergency machine repair'
FROM generate_series('2021-03-01'::date, '2025-11-01'::date, '4 months') AS d;

-- ─── INVOICES (monthly location service invoices) ───────────────────────────
INSERT INTO invoices (id, invoice_number, customer_id, amount, currency, team_id, status, token, issue_date, due_date, paid_at, customer_name, line_items)
SELECT
  gen_random_uuid(),
  'INV-' || to_char(d, 'YYYY') || '-' || lpad(row_number() OVER ()::text, 4, '0'),
  cust.id,
  round((800 + random() * 2000)::numeric, 2),
  'USD',
  v_team_id,
  (CASE
    WHEN d < now() - interval '60 days' THEN 'paid'
    WHEN d < now() - interval '30 days' THEN 'paid'
    WHEN d < now() THEN 'unpaid'
    ELSE 'draft'
  END)::invoice_status,
  encode(gen_random_bytes(16), 'hex'),
  d::timestamptz,
  (d + interval '30 days')::timestamptz,
  CASE WHEN d < now() - interval '30 days' THEN (d + interval '15 days')::timestamptz ELSE NULL END,
  cust.name,
  jsonb_build_array(
    jsonb_build_object('name', 'Vending Service Fee', 'quantity', 1, 'price', round((500 + random() * 1000)::numeric, 2)),
    jsonb_build_object('name', 'Revenue Share Commission', 'quantity', 1, 'price', round((200 + random() * 500)::numeric, 2))
  )
FROM generate_series('2021-02-01'::date, '2025-12-01'::date, '2 months') AS d
CROSS JOIN (
  SELECT id, name FROM customers
  WHERE team_id = v_team_id AND id IN (
    'c1000001-0000-0000-0000-000000000001',
    'c1000001-0000-0000-0000-000000000003',
    'c1000001-0000-0000-0000-000000000006',
    'c1000001-0000-0000-0000-000000000007',
    'c1000001-0000-0000-0000-000000000009'
  )
) cust;

-- ─── SERVICE LOGS ───────────────────────────────────────────────────────────
INSERT INTO service_logs (id, business_id, machine_id, user_id, service_date, notes, revenue_collected, inventory_value_added)
SELECT
  gen_random_uuid(),
  v_team_id,
  m.id,
  v_user_id,
  d,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Full restock, cleaned interior. All slots filled.'
    WHEN 1 THEN 'Partial restock. Replaced sold-out items. Coin box emptied.'
    WHEN 2 THEN 'Regular service. High demand on energy drinks this week.'
    WHEN 3 THEN 'Restocked and cleaned. Card reader firmware updated.'
    ELSE 'Standard service visit. Everything operational.'
  END,
  round((50 + random() * 300)::numeric, 2),
  round((30 + random() * 150)::numeric, 2)
FROM generate_series('2024-01-01'::timestamptz, '2025-12-01'::timestamptz, '14 days') AS d
CROSS JOIN (
  SELECT id FROM machines WHERE business_id = v_team_id LIMIT 6
) m;

-- ─── FINANCING (2 machines financed) ────────────────────────────────────────
INSERT INTO financing (id, business_id, machine_id, loan_amount, apr, term_months, start_date, monthly_payment, lender_name) VALUES
  ('f1000001-0000-0000-0000-000000000001', v_team_id, 'd1000001-0000-0000-0000-000000000006', 4800.00, 8.50, 36, '2022-07-01', 151.23, 'First National Vending Finance'),
  ('f1000001-0000-0000-0000-000000000002', v_team_id, 'd1000001-0000-0000-0000-000000000012', 5200.00, 7.99, 48, '2024-01-15', 126.87, 'Wells Fargo Equipment Finance');

END $$;
