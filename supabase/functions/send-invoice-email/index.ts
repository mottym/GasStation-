import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: drafts, error } = await supabase
    .from('invoices')
    .select(
      `id, total_cents, period_start, period_end, pdf_path,
       customers(name, billing_email)`
    )
    .eq('status', 'draft')
    .not('pdf_path', 'is', null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  const fromEmail = Deno.env.get('RESEND_FROM') ?? 'billing@fleetfuel.local';

  for (const inv of drafts ?? []) {
    const customer = inv.customers as { name: string; billing_email: string };
    if (!customer?.billing_email) continue;

    const { data: fileData, error: dlErr } = await supabase.storage
      .from('invoices')
      .download(inv.pdf_path);

    if (dlErr || !fileData) {
      await supabase
        .from('invoices')
        .update({ status: 'failed', error_message: dlErr?.message ?? 'download failed' })
        .eq('id', inv.id);
      continue;
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    const attachmentB64 = encodeBase64(bytes);

    const { data: items } = await supabase
      .from('invoice_items')
      .select('fueling_id, fuelings(pump_photo_path, signature_path, created_at)')
      .eq('invoice_id', inv.id);

    const receiptLinks: string[] = [];
    for (const item of items ?? []) {
      const f = item.fuelings as {
        pump_photo_path: string | null;
        signature_path: string | null;
        created_at: string;
      };
      if (f?.pump_photo_path) {
        const { data: signed } = await supabase.storage
          .from('pump-photos')
          .createSignedUrl(f.pump_photo_path, 604800);
        if (signed?.signedUrl) receiptLinks.push(signed.signedUrl);
      }
    }

    const total = (inv.total_cents / 100).toFixed(2);
    const html = `
      <h2>Fleet fuel invoice — ${customer.name}</h2>
      <p>Period: ${inv.period_start} to ${inv.period_end}</p>
      <p><strong>Total: $${total}</strong></p>
      <p>PDF invoice attached. Receipt links (7 days):</p>
      <ul>${receiptLinks.map((u) => `<li><a href="${u}">Receipt</a></li>`).join('')}</ul>
    `;

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [customer.billing_email],
          subject: `Invoice ${inv.period_start} – ${inv.period_end} — ${customer.name}`,
          html,
          attachments: [
            {
              filename: `invoice-${inv.period_end}.pdf`,
              content: attachmentB64,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        await supabase
          .from('invoices')
          .update({ status: 'failed', error_message: errText })
          .eq('id', inv.id);
        continue;
      }
    } else {
      console.log('RESEND_API_KEY not set — marking sent (dev mode)', customer.billing_email);
    }

    await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
      .eq('id', inv.id);
    sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
