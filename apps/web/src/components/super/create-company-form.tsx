'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name, billing_email: billingEmail || null })
      .select('id')
      .single();
    if (companyError) {
      setError(companyError.message);
      setLoading(false);
      return;
    }
    if (adminEmail) {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          role: 'company_admin',
          company_id: company.id,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? 'Invite failed');
        setLoading(false);
        return;
      }
    }
    setName('');
    setBillingEmail('');
    setAdminEmail('');
    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add company</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            type="email"
            placeholder="Billing email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Invite admin email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <div className="sm:col-span-3 flex gap-2 items-center">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create company'}
            </Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
