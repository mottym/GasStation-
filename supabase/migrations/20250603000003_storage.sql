-- Storage buckets and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('pump-photos', 'pump-photos', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('signatures', 'signatures', false, 10485760, ARRAY['image/png', 'image/jpeg']),
  ('invoices', 'invoices', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Pump photos (uses public.current_company_id() from schema migration)
CREATE POLICY pump_photos_insert ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pump-photos'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  );

CREATE POLICY pump_photos_select ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pump-photos'
    AND (
      public.is_super_admin()
      OR (storage.foldername(name))[1] = public.current_company_id()::text
      OR EXISTS (
        SELECT 1 FROM fuelings f
        JOIN customers c ON c.id = f.customer_id
        WHERE f.pump_photo_path = name AND c.id = current_customer_id()
      )
    )
  );

-- Signatures
CREATE POLICY signatures_insert ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  );

CREATE POLICY signatures_select ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (
      public.is_super_admin()
      OR (storage.foldername(name))[1] = public.current_company_id()::text
      OR EXISTS (
        SELECT 1 FROM fuelings f
        WHERE f.signature_path = name AND f.customer_id = current_customer_id()
      )
    )
  );

-- Invoices PDF
CREATE POLICY invoices_insert_service ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY invoices_select ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (
      public.is_super_admin()
      OR (storage.foldername(name))[1] = public.current_company_id()::text
      OR EXISTS (
        SELECT 1 FROM invoices inv
        WHERE inv.pdf_path = name AND inv.customer_id = current_customer_id()
      )
    )
  );
