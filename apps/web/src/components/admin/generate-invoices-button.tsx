'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function GenerateInvoicesButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/invoices/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? 'Failed');
      else setMessage(`Generated ${data.generated ?? 0}, emailed ${data.emailed ?? 0}`);
    } catch {
      setMessage('Request failed');
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={run} disabled={loading} variant="outline">
        {loading ? 'Running…' : 'Generate invoices now'}
      </Button>
      {message && <span className="text-sm text-foreground/70">{message}</span>}
    </div>
  );
}
