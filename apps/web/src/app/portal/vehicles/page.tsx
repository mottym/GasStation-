import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { PortalVehiclesManager } from '@/components/portal/vehicles-manager';

export default async function PortalVehiclesPage() {
  const { profile } = await requireProfile(['customer']);
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('company_id')
    .eq('id', profile.customer_id!)
    .single();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', profile.customer_id!)
    .order('license_plate');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My fleet</h1>
      <PortalVehiclesManager
        customerId={profile.customer_id!}
        companyId={customer?.company_id ?? ''}
        vehicles={vehicles ?? []}
      />
    </div>
  );
}
