import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'company_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${serviceKey}`,
  };

  const genRes = await fetch(`${base}/functions/v1/generate-invoices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  const genData = await genRes.json().catch(() => ({}));

  const emailRes = await fetch(`${base}/functions/v1/send-invoice-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  const emailData = await emailRes.json().catch(() => ({}));

  if (!genRes.ok) {
    return NextResponse.json(
      { error: genData.error ?? 'generate-invoices failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    generated: genData.generated ?? 0,
    emailed: emailData.sent ?? 0,
    generate: genData,
    email: emailData,
  });
}
