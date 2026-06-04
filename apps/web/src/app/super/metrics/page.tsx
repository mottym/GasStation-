import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SuperMetricsPage() {
  const supabase = await createClient();
  const [
    { count: companies },
    { count: customers },
    { count: fuelings },
    { count: invoices },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('fuelings').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Companies', value: companies ?? 0 },
    { label: 'Fleet customers', value: customers ?? 0 },
    { label: 'Total fuelings', value: fuelings ?? 0 },
    { label: 'Invoices issued', value: invoices ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform metrics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground/60">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
