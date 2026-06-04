import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { VehiclesManager } from '@/components/admin/vehicles-manager';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile(['company_admin']);
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id!)
    .single();

  if (!customer) return <p>Customer not found</p>;

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', id)
    .order('license_plate');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <p className="text-sm text-foreground/60">{customer.billing_email}</p>
      </div>
      <VehiclesManager
        customerId={id}
        companyId={profile.company_id!}
        vehicles={vehicles ?? []}
      />
    </div>
  );
}
