#!/usr/bin/env node
/**
 * Creates auth users + profiles for local dev.
 * Run after: supabase start && supabase db reset
 * Usage: node scripts/seed-users.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COMPANY_ID = 'a0000000-0000-4000-8000-000000000001';
const STATION_ID = 'b0000000-0000-4000-8000-000000000001';
const CUSTOMER_ACME = 'c0000000-0000-4000-8000-000000000001';

const users = [
  {
    email: 'super@platform.local',
    password: 'SuperAdmin123!',
    profile: { role: 'super_admin', full_name: 'Super Admin' },
  },
  {
    email: 'admin@demo-station.local',
    password: 'Admin123!',
    profile: {
      role: 'company_admin',
      company_id: COMPANY_ID,
      full_name: 'Demo Admin',
    },
  },
  {
    email: 'attendant@demo-station.local',
    password: 'Attendant123!',
    profile: {
      role: 'attendant',
      company_id: COMPANY_ID,
      station_id: STATION_ID,
      full_name: 'Demo Attendant',
    },
  },
  {
    email: 'customer@acme-fleet.local',
    password: 'Customer123!',
    profile: {
      role: 'customer',
      customer_id: CUSTOMER_ACME,
      full_name: 'Acme Fleet Manager',
    },
  },
];

async function upsertUser({ email, password, profile }) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`${email}: ${error.message}`);
    user = data.user;
    console.log('Created user:', email);
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (updateError) throw new Error(`${email} password reset: ${updateError.message}`);
    console.log('Updated user password:', email);
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    ...profile,
  });
  if (profileError) throw new Error(`profile ${email}: ${profileError.message}`);
}

async function linkSeedFueling(attendantId) {
  const { error } = await admin
    .from('fuelings')
    .update({ attendant_id: attendantId })
    .eq('id', 'f0000000-0000-4000-8000-000000000001');
  if (error && error.code !== 'PGRST116') console.warn('fueling link:', error.message);
}

async function main() {
  for (const u of users) {
    await upsertUser(u);
  }
  const attendant = (await admin.auth.admin.listUsers()).data.users.find(
    (u) => u.email === 'attendant@demo-station.local'
  );
  if (attendant) await linkSeedFueling(attendant.id);
  console.log('Seed users complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
