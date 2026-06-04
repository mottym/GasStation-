import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { StationsManager } from '@/components/admin/stations-manager';

export default async function StationsPage() {
  const { profile } = await requireProfile(['company_admin']);
  const supabase = await createClient();
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .eq('company_id', profile.company_id!)
    .order('name');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stations</h1>
      <StationsManager companyId={profile.company_id!} stations={stations ?? []} />
    </div>
  );
}
