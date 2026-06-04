import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { formatCents, formatGallons } from '@/lib/utils';
import { relationOne } from '@/lib/supabase/relations';

export default async function FuelingsPage() {
  const { profile } = await requireProfile(['company_admin']);
  const supabase = await createClient();
  const { data: fuelings } = await supabase
    .from('fuelings')
    .select(
      `*, vehicles(license_plate), customers(name), stations(name)`
    )
    .eq('company_id', profile.company_id!)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All fuelings</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b text-foreground/60">
              <th className="pb-2 pr-4">When</th>
              <th className="pb-2 pr-4">Station</th>
              <th className="pb-2 pr-4">Customer</th>
              <th className="pb-2 pr-4">Plate</th>
              <th className="pb-2 pr-4">Gallons</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(fuelings ?? []).map((f) => (
              <tr key={f.id} className="border-b border-foreground/5">
                <td className="py-2 pr-4">{new Date(f.created_at).toLocaleString()}</td>
                <td className="py-2 pr-4">{relationOne(f.stations as { name: string } | { name: string }[] | null)?.name}</td>
                <td className="py-2 pr-4">{relationOne(f.customers as { name: string } | { name: string }[] | null)?.name}</td>
                <td className="py-2 pr-4 font-mono">{relationOne(f.vehicles as { license_plate: string } | { license_plate: string }[] | null)?.license_plate}</td>
                <td className="py-2 pr-4">{formatGallons(f.gallons)}</td>
                <td className="py-2">{formatCents(f.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
