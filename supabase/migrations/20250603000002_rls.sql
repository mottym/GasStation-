-- Row Level Security policies

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Companies
CREATE POLICY companies_super_all ON companies FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY companies_admin_select ON companies FOR SELECT
  USING (id = current_company_id());

-- Stations
CREATE POLICY stations_super_all ON stations FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY stations_company_all ON stations FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY stations_attendant_select ON stations FOR SELECT
  USING (
    current_user_role() = 'attendant'
    AND company_id = current_company_id()
  );

-- Customers
CREATE POLICY customers_super_all ON customers FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY customers_company_all ON customers FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY customers_self_select ON customers FOR SELECT
  USING (id = current_customer_id());

-- Profiles
CREATE POLICY profiles_super_all ON profiles FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY profiles_self_select ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_company_admin_select ON profiles FOR SELECT
  USING (
    current_user_role() = 'company_admin'
    AND company_id = current_company_id()
  );

CREATE POLICY profiles_company_admin_insert ON profiles FOR INSERT
  WITH CHECK (
    current_user_role() = 'company_admin'
    AND company_id = current_company_id()
    AND role IN ('attendant', 'customer')
  );

CREATE POLICY profiles_company_admin_update ON profiles FOR UPDATE
  USING (
    current_user_role() = 'company_admin'
    AND company_id = current_company_id()
  );

-- Vehicles
CREATE POLICY vehicles_super_all ON vehicles FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY vehicles_company_all ON vehicles FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY vehicles_customer_all ON vehicles FOR ALL
  USING (customer_id = current_customer_id())
  WITH CHECK (customer_id = current_customer_id());

CREATE POLICY vehicles_attendant_select ON vehicles FOR SELECT
  USING (
    current_user_role() = 'attendant'
    AND company_id = current_company_id()
  );

-- Drivers
CREATE POLICY drivers_super_all ON drivers FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY drivers_company ON drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = drivers.customer_id AND c.company_id = current_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = drivers.customer_id AND c.company_id = current_company_id()
    )
  );

CREATE POLICY drivers_customer ON drivers FOR ALL
  USING (customer_id = current_customer_id())
  WITH CHECK (customer_id = current_customer_id());

-- Fuelings
CREATE POLICY fuelings_super_all ON fuelings FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY fuelings_company_select ON fuelings FOR SELECT
  USING (company_id = current_company_id());

CREATE POLICY fuelings_company_insert ON fuelings FOR INSERT
  WITH CHECK (company_id = current_company_id());

CREATE POLICY fuelings_attendant_insert ON fuelings FOR INSERT
  WITH CHECK (
    current_user_role() = 'attendant'
    AND attendant_id = auth.uid()
    AND company_id = current_company_id()
    AND station_id = (SELECT station_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY fuelings_attendant_select ON fuelings FOR SELECT
  USING (
    current_user_role() = 'attendant'
    AND company_id = current_company_id()
  );

CREATE POLICY fuelings_customer_select ON fuelings FOR SELECT
  USING (customer_id = current_customer_id());

-- Invoices
CREATE POLICY invoices_super_all ON invoices FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY invoices_company ON invoices FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY invoices_customer_select ON invoices FOR SELECT
  USING (customer_id = current_customer_id());

-- Invoice items
CREATE POLICY invoice_items_super ON invoice_items FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY invoice_items_company ON invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id AND i.company_id = current_company_id()
    )
  );

CREATE POLICY invoice_items_customer_select ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id AND i.customer_id = current_customer_id()
    )
  );
