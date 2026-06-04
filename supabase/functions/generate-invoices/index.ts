import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function periodBounds() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
    since: start.toISOString(),
    until: end.toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { period_start, period_end, since, until } = periodBounds();

  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('id, name, billing_email, company_id, companies(name)')
    .eq('active', true);

  if (custErr) {
    return new Response(JSON.stringify({ error: custErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let generated = 0;

  for (const customer of customers ?? []) {
    const { data: invoicedIds } = await supabase
      .from('invoice_items')
      .select('fueling_id');

    const invoicedSet = new Set((invoicedIds ?? []).map((r) => r.fueling_id));

    const { data: fuelings } = await supabase
      .from('fuelings')
      .select(
        `id, gallons, price_per_gallon, total_cents, fuel_type, created_at, driver_name,
         pump_photo_path, signature_path, vehicles(license_plate)`
      )
      .eq('customer_id', customer.id)
      .gte('created_at', since)
      .lt('created_at', until)
      .order('created_at');

    const uninvoiced = (fuelings ?? []).filter((f) => !invoicedSet.has(f.id));
    if (uninvoiced.length === 0) continue;

    const total_cents = uninvoiced.reduce((s, f) => s + f.total_cents, 0);
    const companyName =
      (customer.companies as { name: string } | null)?.name ?? 'Fuel Company';

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([612, 792]);
    let y = 750;

    const draw = (text: string, size = 10, useBold = false) => {
      if (y < 60) {
        page = pdf.addPage([612, 792]);
        y = 750;
      }
      page.drawText(text, {
        x: 50,
        y,
        size,
        font: useBold ? bold : font,
        color: rgb(0, 0, 0),
      });
      y -= size + 6;
    };

    draw(`Invoice — ${customer.name}`, 16, true);
    draw(companyName, 12);
    draw(`Period: ${period_start} to ${period_end}`, 10);
    draw(`Billing: ${customer.billing_email}`, 10);
    y -= 10;

    for (const f of uninvoiced) {
      const plate = (f.vehicles as { license_plate: string })?.license_plate ?? '?';
      const line = `${new Date(f.created_at).toLocaleDateString()} · ${plate} · ${Number(f.gallons).toFixed(2)} gal · $${(f.total_cents / 100).toFixed(2)}`;
      draw(line);
      if (f.driver_name) draw(`  Driver: ${f.driver_name}`, 9);
      if (f.pump_photo_path) draw(`  Pump photo: ${f.pump_photo_path}`, 8);
      if (f.signature_path) draw(`  Signature: ${f.signature_path}`, 8);
    }

    y -= 10;
    draw(`Total: $${(total_cents / 100).toFixed(2)}`, 14, true);

    const pdfBytes = await pdf.save();
    const invoiceId = crypto.randomUUID();
    const pdfPath = `${customer.company_id}/${customer.id}/${invoiceId}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from('invoices')
      .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });

    if (uploadErr) {
      console.error('upload', uploadErr);
      continue;
    }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        customer_id: customer.id,
        company_id: customer.company_id,
        period_start,
        period_end,
        total_cents,
        pdf_path: pdfPath,
        status: 'draft',
      })
      .select('id')
      .single();

    if (invErr || !invoice) {
      console.error('invoice', invErr);
      continue;
    }

    await supabase.from('invoice_items').insert(
      uninvoiced.map((f) => ({ invoice_id: invoice.id, fueling_id: f.id }))
    );

    generated++;
  }

  return new Response(JSON.stringify({ generated, period_start, period_end }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
