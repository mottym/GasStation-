-- Weekly invoice generation (Sunday 23:00 UTC)
-- Requires pg_cron and pg_net extensions on hosted Supabase; documented for local via manual trigger.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store settings for edge function URLs (set in hosted project)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO app_settings (key, value) VALUES
  ('edge_generate_invoices_url', 'http://host.docker.internal:54321/functions/v1/generate-invoices'),
  ('edge_send_invoice_email_url', 'http://host.docker.internal:54321/functions/v1/send-invoice-email')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.trigger_weekly_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gen_url TEXT;
  send_url TEXT;
  service_key TEXT;
BEGIN
  SELECT value INTO gen_url FROM app_settings WHERE key = 'edge_generate_invoices_url';
  SELECT value INTO send_url FROM app_settings WHERE key = 'edge_send_invoice_email_url';
  service_key := current_setting('app.settings.service_role_key', true);

  IF gen_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := gen_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb
    );
  END IF;

  IF send_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := send_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb
    );
  END IF;
END;
$$;

-- Cron: 0 23 * * 0 = Sunday 23:00 UTC
SELECT cron.schedule(
  'weekly-fleet-invoices',
  '0 23 * * 0',
  $$SELECT public.trigger_weekly_invoices();$$
);
