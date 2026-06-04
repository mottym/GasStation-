import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { CustomersManager } from '@/components/admin/customers-manager';

export default async function CustomersPage() {
  const { profile } = await requireProfile(['company_admin']);
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', profile.company_id!)
    .order('name');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fleet customers</h1>
      <CustomersManager companyId={profile.company_id!} customers={customers ?? []} />
      <div className="space-y-2">
        {(customers ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="block border rounded-lg p-4 hover:bg-foreground/5"
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-sm text-foreground/60 ml-2">{c.billing_email}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
