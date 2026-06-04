import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { formatCents } from '@/lib/utils';
import { InvoiceDownloadLink } from '@/components/portal/invoice-download';

export default async function PortalInvoicesPage() {
  const { profile } = await requireProfile(['customer']);
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_id', profile.customer_id!)
    .order('period_end', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoices</h1>
      <ul className="space-y-3">
        {(invoices ?? []).map((inv) => (
          <li key={inv.id} className="border rounded-lg p-4 flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-medium">
                {inv.period_start} — {inv.period_end}
              </p>
              <p className="text-sm text-foreground/60">
                {formatCents(inv.total_cents)} · {inv.status}
                {inv.sent_at && ` · sent ${new Date(inv.sent_at).toLocaleDateString()}`}
              </p>
            </div>
            {inv.pdf_path && <InvoiceDownloadLink path={inv.pdf_path} />}
          </li>
        ))}
        {(invoices ?? []).length === 0 && (
          <p className="text-foreground/50">No invoices yet.</p>
        )}
      </ul>
    </div>
  );
}
