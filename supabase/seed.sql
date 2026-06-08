-- Demo seed data. Run ONLY after all migrations in supabase/migrations/ (in order).
-- Hosted Supabase: SQL Editor → run each migration file, then this file, then scripts/seed-users.mjs.
-- Users are created via auth; run scripts/seed-users.mjs after this seed to create login accounts.

-- Demo company
INSERT INTO companies (id, name, billing_email)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Demo Fuel Co',
  'billing@demo-fuel.local'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO stations (id, company_id, name, address, default_price_per_gallon)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Main Street Station',
  '100 Main St, Springfield',
  3.8999
) ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, company_id, name, billing_email, billing_address, weekly_invoice_day)
VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Acme Logistics',
    'billing@acme-fleet.local',
    '200 Fleet Ave',
    0
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Beta Transport',
    'ap@beta-transport.local',
    '50 Highway Rd',
    0
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, customer_id, company_id, license_plate, make, model, year, fuel_type)
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'ACME-101', 'Ford', 'F-150', 2022, 'regular'),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'ACME-202', 'Chevy', 'Silverado', 2021, 'diesel'),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'BETA-55', 'Ram', '3500', 2023, 'diesel'),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'BETA-66', 'Ford', 'Transit', 2020, 'regular')
ON CONFLICT (id) DO NOTHING;

INSERT INTO drivers (id, customer_id, name, phone)
VALUES
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'John Driver', '555-0101'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'Jane Pilot', '555-0202')
ON CONFLICT (id) DO NOTHING;

-- Sample fueling (uninvoiced) for smoke tests
INSERT INTO fuelings (
  id, company_id, station_id, attendant_id, vehicle_id, customer_id,
  driver_name, gallons, price_per_gallon, fuel_type, odometer, notes, created_at
)
SELECT
  'f0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  p.id,
  'd0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'John Driver',
  12.5,
  3.8999,
  'regular',
  45000,
  'Seed fueling',
  now() - interval '2 days'
FROM profiles p
WHERE p.role = 'attendant'
LIMIT 1
ON CONFLICT (id) DO NOTHING;
