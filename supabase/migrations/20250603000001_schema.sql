-- Fleet Fueling Platform — core schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'company_admin',
  'attendant',
  'customer'
);

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'failed');

CREATE TYPE fuel_type AS ENUM ('regular', 'midgrade', 'premium', 'diesel', 'other');

-- Normalize license plates: uppercase, strip spaces/dashes
CREATE OR REPLACE FUNCTION normalize_license_plate(plate TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(regexp_replace(trim(plate), '[^A-Za-z0-9]', '', 'g'));
$$;

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  billing_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  default_price_per_gallon NUMERIC(10, 4) NOT NULL DEFAULT 3.4999,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_address TEXT,
  weekly_invoice_day INT NOT NULL DEFAULT 0 CHECK (weekly_invoice_day BETWEEN 0 AND 6),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_refs CHECK (
    (role = 'super_admin' AND company_id IS NULL AND customer_id IS NULL)
    OR (role = 'company_admin' AND company_id IS NOT NULL AND customer_id IS NULL)
    OR (role = 'attendant' AND company_id IS NOT NULL AND station_id IS NOT NULL AND customer_id IS NULL)
    OR (role = 'customer' AND customer_id IS NOT NULL)
  )
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  license_plate_normalized TEXT GENERATED ALWAYS AS (normalize_license_plate(license_plate)) STORED,
  make TEXT,
  model TEXT,
  year INT,
  fuel_type fuel_type NOT NULL DEFAULT 'regular',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, license_plate_normalized)
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fuelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  attendant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  driver_name TEXT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  gallons NUMERIC(10, 3) NOT NULL CHECK (gallons > 0),
  price_per_gallon NUMERIC(10, 4) NOT NULL CHECK (price_per_gallon >= 0),
  total_cents INT NOT NULL GENERATED ALWAYS AS (
    round(gallons * price_per_gallon * 100)::INT
  ) STORED,
  fuel_type fuel_type NOT NULL DEFAULT 'regular',
  odometer INT,
  pump_photo_path TEXT,
  signature_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fuelings_company_created ON fuelings(company_id, created_at DESC);
CREATE INDEX fuelings_customer_created ON fuelings(customer_id, created_at DESC);
CREATE INDEX fuelings_vehicle_created ON fuelings(vehicle_id, created_at DESC);
CREATE INDEX vehicles_plate_lookup ON vehicles(company_id, license_plate_normalized) WHERE active = true;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cents INT NOT NULL DEFAULT 0,
  pdf_path TEXT,
  status invoice_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, period_start, period_end)
);

CREATE TABLE invoice_items (
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fueling_id UUID NOT NULL REFERENCES fuelings(id) ON DELETE RESTRICT,
  PRIMARY KEY (invoice_id, fueling_id),
  UNIQUE (fueling_id)
);

-- RLS helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Auto-create profile trigger (service role inserts profiles via seed/invite)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_updated BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER stations_updated BEFORE UPDATE ON stations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER vehicles_updated BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RPC: lookup vehicle by plate for attendant
CREATE OR REPLACE FUNCTION public.lookup_vehicle_by_plate(p_plate TEXT, p_company_id UUID)
RETURNS TABLE (
  vehicle_id UUID,
  license_plate TEXT,
  make TEXT,
  model TEXT,
  customer_id UUID,
  customer_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.license_plate,
    v.make,
    v.model,
    c.id,
    c.name
  FROM vehicles v
  JOIN customers c ON c.id = v.customer_id
  WHERE v.company_id = p_company_id
    AND v.license_plate_normalized = normalize_license_plate(p_plate)
    AND v.active = true
    AND c.active = true;
$$;

-- RPC: dashboard stats for company admin
CREATE OR REPLACE FUNCTION public.company_fueling_stats(
  p_company_id UUID,
  p_since TIMESTAMPTZ DEFAULT (now() - interval '7 days')
)
RETURNS TABLE (total_gallons NUMERIC, total_cents BIGINT, fueling_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(sum(gallons), 0),
    coalesce(sum(total_cents), 0)::BIGINT,
    count(*)::BIGINT
  FROM fuelings
  WHERE company_id = p_company_id AND created_at >= p_since;
$$;

GRANT EXECUTE ON FUNCTION lookup_vehicle_by_plate TO authenticated;
GRANT EXECUTE ON FUNCTION company_fueling_stats TO authenticated;
