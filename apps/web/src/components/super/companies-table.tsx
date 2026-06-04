'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Company = {
  id: string;
  name: string;
  billing_email: string | null;
  created_at: string;
};

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function inviteAdmin(companyId: string) {
    const email = inviteEmail[companyId];
    if (!email) return;
    setLoading(companyId);
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'company_admin', company_id: companyId }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else alert((await res.json()).error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All companies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-foreground/60">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Billing</th>
                <th className="pb-2 pr-4">Created</th>
                <th className="pb-2">Invite admin</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-foreground/5">
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4">{c.billing_email ?? '—'}</td>
                  <td className="py-3 pr-4">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="py-3 flex gap-2">
                    <Input
                      type="email"
                      placeholder="admin@company.com"
                      className="max-w-xs"
                      value={inviteEmail[c.id] ?? ''}
                      onChange={(e) =>
                        setInviteEmail((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === c.id}
                      onClick={() => inviteAdmin(c.id)}
                    >
                      Invite
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && (
            <p className="text-foreground/50 py-4">No companies yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
