'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function PortalFuelingsFilter({
  vehicles,
}: {
  vehicles: { id: string; license_plate: string }[];
}) {
  const router = useRouter();
  const search = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/portal/fuelings?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <select
        className="h-10 rounded-md border border-foreground/20 px-3 text-sm"
        defaultValue={search.get('vehicle') ?? ''}
        onChange={(e) => update('vehicle', e.target.value)}
      >
        <option value="">All vehicles</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.license_plate}
          </option>
        ))}
      </select>
      <Input
        type="date"
        defaultValue={search.get('from') ?? ''}
        onChange={(e) => update('from', e.target.value)}
      />
      <Input
        type="date"
        defaultValue={search.get('to') ?? ''}
        onChange={(e) => update('to', e.target.value)}
      />
      <Button variant="ghost" onClick={() => router.push('/portal/fuelings')}>
        Clear
      </Button>
    </div>
  );
}
