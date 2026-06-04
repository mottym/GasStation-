# Fleet Fueling Platform

Multi-tenant platform for gas station companies to manage fleet customer accounts, capture fuelings (pump photo + driver signature), and send weekly PDF invoices by email.

## Stack

- **Web:** Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Mobile:** Flutter (attendant + customer roles in one app)
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)

## Repo layout

```
apps/web          # Super admin, company admin, customer portal
apps/mobile       # Attendant + customer mobile app
supabase/         # Migrations, Edge Functions, seed
packages/shared-types
```

## Prerequisites

- Node.js 20+
- Flutter 3.x
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local Supabase)

## Quick start

### 1. Supabase (local)

```bash
cd supabase
supabase start
supabase db reset   # applies migrations + seed
```

Copy keys from `supabase status` into:

- `apps/web/.env.local` (see `apps/web/.env.example`)
- `apps/mobile/.env` (see `apps/mobile/.env.example`)

### 2. Web

```bash
npm install
npm run dev:web
```

Open http://localhost:3000

### 3. Mobile

```bash
cd apps/mobile
flutter pub get
flutter run
```

### 4. Edge Functions (invoices)

```bash
supabase functions serve
```

Set secrets: `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (for cron/edge).

### Seed users (after `supabase db reset`)

| Role | Email | Password |
|------|-------|----------|
| Super admin | super@platform.local | SuperAdmin123! |
| Company admin | admin@demo-station.local | Admin123! |
| Attendant | attendant@demo-station.local | Attendant123! |
| Customer | customer@acme-fleet.local | Customer123! |

## Weekly invoices

- **Automatic:** pg_cron Sundays 23:00 UTC → `generate-invoices` → `send-invoice-email`
- **Manual:** Company admin dashboard → "Generate invoices now"

## v2 (not in v1)

- License plate OCR
- Stripe payments
- Offline attendant queue
