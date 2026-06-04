import Link from 'next/link';
import { Fuel } from 'lucide-react';
import { SignOutButton } from '@/components/auth/sign-out-button';

type NavItem = { href: string; label: string };

export function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-foreground/10">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href={nav[0]?.href ?? '/'} className="flex items-center gap-2 font-semibold">
              <Fuel className="h-5 w-5" />
              Fleet Fuel
            </Link>
            <nav className="hidden sm:flex gap-4 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground/70 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/60">{title}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl w-full flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
