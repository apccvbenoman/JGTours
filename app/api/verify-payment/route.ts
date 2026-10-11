import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingDocuments } from '@/lib/email';

export async function GET(request: Request) {
  let redirectRef = '';

  try {
    const url = new URL(request.url);
    const ref = url.searchParams.get('ref');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch the exact booking tied to this checkout session (or fallback to latest pending)
    let booking: any = null;

    if (ref) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('booking_ref', ref)
        .maybeSingle();

      if (data) booking = data;
    }

    // Fallback if not found by ref
    if (!booking) {
      const { data: pendingBookings } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (pendingBookings && pendingBookings.length > 0) {
        booking = pendingBookings[0];
      }
    }

    if (!booking) {
      console.log('No matching booking found to verify.');
      return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
    }

    redirectRef = booking.booking_ref ? `&ref=${booking.booking_ref}` : '';

    // 2. Prevent duplicate invoice creation if already processed
    if (booking.payment_status === 'paid') {
      return NextResponse.redirect(new URL(`/dashboard?success=true${redirectRef}`, request.url));
    }

    // 3. Generate sequential invoice number: JGTINV2026-001, JGTINV2026-002, etc.
    const { count } = await supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const nextSeqNumber = (count || 0) + 1;
    const sequenceString = String(nextSeqNumber).padStart(3, '0');
    const invoiceNumber = `JGTINV2026-${sequenceString}`;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());

    // 4. Update booking payment status
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'Confirmed'
      })
      .eq('id', booking.id);

    // 5. Insert into invoices table
    const { error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert([
        {
          invoice_no: invoiceNumber,
          client_name: booking.lead_guest_name,
          total_amount: booking.total_amount,
          date_paid: today,
          status: 'Confirmed Booking',
          tour_package: booking.tour_package,
          contact_number: booking.contact_number,
          pax: booking.pax,
          tour_date: booking.tour_date
        }
      ]);

    if (insertError) {
      console.error('Verify Payment Invoice Insert Error:', insertError);
    } else {
      console.log('Successfully recorded invoice:', invoiceNumber);
    }

    // 6. Send Service Invoice & Travel Voucher emails
    const recipientEmail = booking.email || booking.contact_email;
    if (recipientEmail) {
      try {
        await sendBookingDocuments({
          invoiceNo: invoiceNumber,
          clientName: booking.lead_guest_name,
          customerEmail: recipientEmail,
          tourPackage: booking.tour_package,
          pax: booking.pax,
          tourDate: booking.tour_date,
          totalAmount: booking.total_amount,
          contactNumber: booking.contact_number
        });
        console.log('Voucher & Service Invoice sent successfully to:', recipientEmail);
      } catch (mailError) {
        console.error('Email dispatch error:', mailError);
      }
    } else {
      console.warn('No customer email on record for this booking; emails skipped.');
    }

  } catch (err) {
    console.error('Verify Payment Exception:', err);
  }

  return NextResponse.redirect(new URL(`/dashboard?success=true${redirectRef}`, request.url));
}