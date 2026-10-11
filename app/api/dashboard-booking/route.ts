import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  { auth: { persistSession: false } }
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ref = url.searchParams.get('ref');

    let bookingQuery = supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (ref) {
      bookingQuery = supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('booking_ref', ref)
        .limit(1);
    }

    const { data: bookings, error: bookingErr } = await bookingQuery;

    if (bookingErr || !bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No booking found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Fetch corresponding invoice details (JGTINV2026-XXX)
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('client_name', booking.lead_guest_name)
      .order('created_at', { ascending: false })
      .limit(1);

    const invoice = invoices && invoices.length > 0 ? invoices[0] : null;

    return NextResponse.json({
      booking,
      invoiceNo: invoice?.invoice_no || `JGTINV2026-${booking.id.toString().slice(0, 4)}`,
    });
  } catch (err) {
    console.error('Dashboard booking API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}