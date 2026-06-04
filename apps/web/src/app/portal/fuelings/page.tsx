import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { PortalFuelingsFilter } from '@/components/portal/fuelings-filter';
import { formatCents, formatGallons } from '@/lib/utils';
import { relationOne } from '@/lib/supabase/relations';

export default async function PortalFuelingsPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile(['customer']);
  const supabase = await createClient();

  let query = supabase
    .from('fuelings')
    .select(`*, vehicles(license_plate)`)
    .eq('customer_id', profile.customer_id!)
    .order('created_at', { ascending: false })
    .limit(200);

  if (params.vehicle) query = query.eq('vehicle_id', params.vehicle);
  if (params.from) query = query.gte('created_at', params.from);
  if (params.to) query = query.lte('created_at', `${params.to}T23:59:59`);

  const [{ data: fuelings }, { data: vehicles }] = await Promise.all([
    query,
    supabase
      .from('vehicles')
      .select('id, license_plate')
      .eq('customer_id', profile.customer_id!),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fueling history</h1>
      <PortalFuelingsFilter vehicles={vehicles ?? []} />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b text-foreground/60">
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 pr-4">Plate</th>
            <th className="pb-2 pr-4">Gallons</th>
            <th className="pb-2 pr-4">Driver</th>
            <th className="pb-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {(fuelings ?? []).map((f) => (
            <tr key={f.id} className="border-b border-foreground/5">
              <td className="py-2 pr-4">{new Date(f.created_at).toLocaleString()}</td>
              <td className="py-2 pr-4 font-mono">
                {relationOne(f.vehicles as { license_plate: string } | { license_plate: string }[] | null)?.license_plate}
              </td>
              <td className="py-2 pr-4">{formatGallons(f.gallons)}</td>
              <td className="py-2 pr-4">{f.driver_name ?? '—'}</td>
              <td className="py-2">{formatCents(f.total_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
