import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCents, formatGallons } from '@/lib/utils';
import { subDays } from 'date-fns';

export default async function PortalOverviewPage() {
  const { profile } = await requireProfile(['customer']);
  const supabase = await createClient();
  const customerId = profile.customer_id!;
  const since = subDays(new Date(), 30).toISOString();

  const { data: fuelings } = await supabase
    .from('fuelings')
    .select('gallons, total_cents')
    .eq('customer_id', customerId)
    .gte('created_at', since);

  const gallons = fuelings?.reduce((s, f) => s + Number(f.gallons), 0) ?? 0;
  const cents = fuelings?.reduce((s, f) => s + f.total_cents, 0) ?? 0;

  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('active', true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fleet overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-foreground/60">Active vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{vehicleCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-foreground/60">Last 30 days — gallons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatGallons(gallons)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-foreground/60">Last 30 days — spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCents(cents)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
