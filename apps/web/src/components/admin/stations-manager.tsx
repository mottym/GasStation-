'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

type Station = {
  id: string;
  name: string;
  address: string | null;
  default_price_per_gallon: number;
  active: boolean;
};

export function StationsManager({
  companyId,
  stations,
}: {
  companyId: string;
  stations: Station[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('3.8999');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from('stations').insert({
      company_id: companyId,
      name,
      address: address || null,
      default_price_per_gallon: parseFloat(price),
    });
    setName('');
    setAddress('');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <Input placeholder="Station name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input
              placeholder="Default $/gal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28"
            />
            <Button type="submit">Add station</Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {stations.map((s) => (
          <li key={s.id} className="border rounded-lg p-4 flex justify-between">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-foreground/60">{s.address ?? 'No address'}</p>
              <p className="text-sm">${Number(s.default_price_per_gallon).toFixed(4)}/gal default</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
