import { requireProfile } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile(['customer']);
  return (
    <AppShell
      title={profile.full_name ?? 'Fleet Customer'}
      nav={[
        { href: '/portal', label: 'Overview' },
        { href: '/portal/vehicles', label: 'Vehicles' },
        { href: '/portal/fuelings', label: 'Fuelings' },
        { href: '/portal/invoices', label: 'Invoices' },
      ]}
    >
      {children}
    </AppShell>
  );
}
