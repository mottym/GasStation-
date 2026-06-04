# Smoke test checklist

## Setup

```bash
# Start Supabase (requires Docker + Supabase CLI)
supabase start
supabase db reset
npm run seed:users
```

## 1. Attendant logs fueling (mobile)

1. Run `cd apps/mobile && flutter run --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<anon>`
2. Login: `attendant@demo-station.local` / `Attendant123!`
3. New fueling → plate `ACME-101` → lookup → enter gallons → pump photo → signature → submit

## 2. Company admin dashboard (web)

1. `npm run dev:web` with `.env.local` configured
2. Login: `admin@demo-station.local` / `Admin123!`
3. Dashboard shows recent fueling; Fuelings page lists it

## 3. Customer portal (web)

1. Login: `customer@acme-fleet.local` / `Customer123!`
2. Fuelings page shows the transaction; Vehicles lists ACME plates

## 4. Invoice generation

1. As company admin, click **Generate invoices now**
2. Or call edge functions:
   ```bash
   curl -X POST http://127.0.0.1:54321/functions/v1/generate-invoices \
     -H "Authorization: Bearer <service_role>"
   curl -X POST http://127.0.0.1:54321/functions/v1/send-invoice-email \
     -H "Authorization: Bearer <service_role>"
   ```
3. Customer portal → Invoices → PDF download works
4. With `RESEND_API_KEY`, email arrives at `billing@acme-fleet.local` (Inbucket locally)
