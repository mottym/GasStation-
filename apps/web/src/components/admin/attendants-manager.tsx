'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

type Station = { id: string; name: string };
type Attendant = {
  id: string;
  full_name: string | null;
  phone: string | null;
  station_id: string | null;
  station_name: string | null;
};

export function AttendantsManager({
  companyId,
  stations,
  attendants,
}: {
  companyId: string;
  stations: Station[];
  attendants: Attendant[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [stationId, setStationId] = useState(stations[0]?.id ?? '');
  const [loading, setLoading] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role: 'attendant',
        company_id: companyId,
        station_id: stationId,
        full_name: name,
      }),
    });
    setEmail('');
    setName('');
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={invite} className="flex flex-wrap gap-2 items-end">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <select
              className="h-10 rounded-md border border-foreground/20 px-3 text-sm"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={loading || !stationId}>
              Invite attendant
            </Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {attendants.map((a) => (
          <li key={a.id} className="border rounded-lg p-4">
            <p className="font-medium">{a.full_name ?? a.id}</p>
            <p className="text-sm text-foreground/60">
              {a.station_name ?? 'No station'} · {a.phone ?? '—'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
