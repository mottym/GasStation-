import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserRole } from '@gas-station/shared-types/database.types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  const body = await request.json();
  const { email, role, company_id, customer_id, station_id, full_name } = body as {
    email: string;
    role: UserRole;
    company_id?: string;
    customer_id?: string;
    station_id?: string;
    full_name?: string;
  };

  if (!email || !role) {
    return NextResponse.json({ error: 'email and role required' }, { status: 400 });
  }

  if (caller?.role === 'company_admin') {
    if (!['attendant', 'customer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden role' }, { status: 403 });
    }
    if (company_id && company_id !== caller.company_id) {
      return NextResponse.json({ error: 'Wrong company' }, { status: 403 });
    }
  } else if (caller?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = await createServiceClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`;

  const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(
    email,
    { redirectTo }
  );

  if (inviteError) {
    const { data: existing } = await service.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === email);
    if (!found) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }
    const profilePayload: Record<string, unknown> = {
      id: found.id,
      role,
      full_name: full_name ?? null,
    };
    if (company_id) profilePayload.company_id = company_id;
    if (customer_id) profilePayload.customer_id = customer_id;
    if (station_id) profilePayload.station_id = station_id;
    await service.from('profiles').upsert(profilePayload);
    return NextResponse.json({ ok: true, userId: found.id, existing: true });
  }

  const profilePayload: Record<string, unknown> = {
    id: invited.user.id,
    role,
    full_name: full_name ?? null,
  };
  if (company_id) profilePayload.company_id = company_id;
  if (customer_id) profilePayload.customer_id = customer_id;
  if (station_id) profilePayload.station_id = station_id;

  const { error: profileError } = await service.from('profiles').upsert(profilePayload);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: invited.user.id });
}
