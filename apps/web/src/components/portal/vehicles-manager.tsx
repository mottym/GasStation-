'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

type Vehicle = {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  fuel_type: string;
  active: boolean;
};

export function PortalVehiclesManager({
  customerId,
  companyId,
  vehicles,
}: {
  customerId: string;
  companyId: string;
  vehicles: Vehicle[];
}) {
  const router = useRouter();
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from('vehicles').insert({
      customer_id: customerId,
      company_id: companyId,
      license_plate: plate,
      make: make || null,
      model: model || null,
    });
    setPlate('');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <Input placeholder="License plate" value={plate} onChange={(e) => setPlate(e.target.value)} required />
            <Input placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
            <Input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
            <Button type="submit">Add vehicle</Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {vehicles.map((v) => (
          <li key={v.id} className="border rounded-lg p-4 flex justify-between">
            <span className="font-mono font-medium">{v.license_plate}</span>
            <span className="text-sm text-foreground/60">
              {[v.make, v.model].filter(Boolean).join(' ') || '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
