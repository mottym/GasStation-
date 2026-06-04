import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCents, formatGallons } from '@/lib/utils';
import { relationOne } from '@/lib/supabase/relations';
import { GenerateInvoicesButton } from '@/components/admin/generate-invoices-button';
import { subDays, subMonths } from 'date-fns';

export default async function AdminDashboardPage() {
  const { profile } = await requireProfile(['company_admin']);
  const supabase = await createClient();
  const companyId = profile.company_id!;

  const weekSince = subDays(new Date(), 7).toISOString();
  const monthSince = subMonths(new Date(), 1).toISOString();

  const { data: weekStats } = await supabase.rpc('company_fueling_stats', {
    p_company_id: companyId,
    p_since: weekSince,
  });
  const { data: monthStats } = await supabase.rpc('company_fueling_stats', {
    p_company_id: companyId,
    p_since: monthSince,
  });

  const week = weekStats?.[0] ?? { total_gallons: 0, total_cents: 0, fueling_count: 0 };
  const month = monthStats?.[0] ?? { total_gallons: 0, total_cents: 0, fueling_count: 0 };

  const { data: recent } = await supabase
    .from('fuelings')
    .select(
      `id, gallons, total_cents, created_at, driver_name,
       vehicles(license_plate), customers(name)`
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-foreground/60">Company fueling overview</p>
        </div>
        <GenerateInvoicesButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="This week — gallons" value={formatGallons(Number(week.total_gallons))} />
        <StatCard title="This week — revenue" value={formatCents(Number(week.total_cents))} />
        <StatCard title="This month — gallons" value={formatGallons(Number(month.total_gallons))} />
        <StatCard title="This month — revenue" value={formatCents(Number(month.total_cents))} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent fuelings</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/60 border-b">
                <th className="pb-2">Date</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Plate</th>
                <th className="pb-2">Gallons</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map((f) => {
                const v = relationOne(f.vehicles as { license_plate: string } | { license_plate: string }[] | null);
                const c = relationOne(f.customers as { name: string } | { name: string }[] | null);
                return (
                  <tr key={f.id} className="border-b border-foreground/5">
                    <td className="py-2">{new Date(f.created_at).toLocaleString()}</td>
                    <td className="py-2">{c?.name ?? '—'}</td>
                    <td className="py-2">{v?.license_plate ?? '—'}</td>
                    <td className="py-2">{formatGallons(f.gallons)}</td>
                    <td className="py-2">{formatCents(f.total_cents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground/60">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
