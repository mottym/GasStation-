import { requireProfile } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile(['company_admin']);
  return (
    <AppShell
      title={profile.full_name ?? 'Company Admin'}
      nav={[
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/stations', label: 'Stations' },
        { href: '/admin/customers', label: 'Customers' },
        { href: '/admin/attendants', label: 'Attendants' },
        { href: '/admin/fuelings', label: 'Fuelings' },
      ]}
    >
      {children}
    </AppShell>
  );
}
