import { requireProfile } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile(['super_admin']);
  return (
    <AppShell
      title={profile.full_name ?? 'Super Admin'}
      nav={[
        { href: '/super', label: 'Companies' },
        { href: '/super/metrics', label: 'Metrics' },
      ]}
    >
      {children}
    </AppShell>
  );
}
