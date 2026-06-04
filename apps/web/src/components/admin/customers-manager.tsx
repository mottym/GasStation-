'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

type Customer = { id: string; name: string; billing_email: string };

export function CustomersManager({
  companyId,
  customers,
}: {
  companyId: string;
  customers: Customer[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: customer } = await supabase
      .from('customers')
      .insert({ company_id: companyId, name, billing_email: email })
      .select('id')
      .single();
    if (customer && inviteEmail) {
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'customer',
          customer_id: customer.id,
        }),
      });
    }
    setName('');
    setEmail('');
    setInviteEmail('');
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={add} className="flex flex-wrap gap-2">
          <Input placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="email" placeholder="Billing email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="email"
            placeholder="Invite portal user (optional)"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button type="submit">Add customer</Button>
        </form>
        <p className="text-xs text-foreground/50 mt-2">{customers.length} customers</p>
      </CardContent>
    </Card>
  );
}
