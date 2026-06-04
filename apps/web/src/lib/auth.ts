import { redirect } from 'next/navigation';
import type { UserRole } from '@gas-station/shared-types/database.types';
import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  role: UserRole;
  company_id: string | null;
  customer_id: string | null;
  station_id: string | null;
  full_name: string | null;
};

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/super',
  company_admin: '/admin',
  attendant: '/login',
  customer: '/portal',
};

export function roleHome(role: UserRole) {
  return ROLE_HOME[role];
}

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, company_id, customer_id, station_id, full_name')
    .eq('id', user.id)
    .single();

  return { user, profile: profile as Profile | null };
}

export async function requireProfile(allowed: UserRole[]) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect('/login');
  if (!allowed.includes(profile.role)) redirect(roleHome(profile.role));
  return { user, profile };
}
