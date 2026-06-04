'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function InvoiceDownloadLink({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.storage.from('invoices').createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [path]);

  if (!url) return <span className="text-sm text-foreground/50">Loading…</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" type="button">
        Download PDF
      </Button>
    </a>
  );
}
