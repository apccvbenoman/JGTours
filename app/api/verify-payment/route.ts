// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkoutSessionId = url.searchParams.get('checkout_session_id') || url.searchParams.get('session_id');

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. If PayMongo session ID is provided, look up that exact booking
    let booking: any = null;

    if (checkoutSessionId) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('paymongo_checkout_id', checkoutSessionId)
        .single();
      booking = data;
    }

    // Fallback if no specific ID is found: grab the latest pending one
    if (!booking) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        booking = data[0];
      }
    }

    if (!booking) {
      console.log("No pending bookings found to verify.");
      return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
    }

    const invoiceNumber = `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const voucherNumber = `VCH-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const today = new Date().toISOString().split('T')[0];

    // 2. Update booking status, payment status, and assign a voucher number
    await supabaseAdmin
      .from('bookings')
      .update({ 
        payment_status: 'paid', 
        status: 'Confirmed',
        voucher_number: booking.voucher_number || voucherNumber 
      })
      .eq('id', booking.id);

    // 3. Insert into invoices table
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
      console.error("Verify Payment Invoice Insert Error:", insertError);
    } else {
      console.log("Successfully inserted invoice into database:", invoiceNumber);
    }

    // 4. Automatically trigger your email route to send the Travel Voucher PDF & Invoice!
    try {
      await fetch(`${url.origin}/api/send-booking-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          recipientEmail: booking.contact_email || 'jazgottour@gmail.com' // Fallback or pull from guest details if available
        })
      });
      console.log("Successfully triggered travel voucher email dispatch.");
    } catch (emailErr) {
      console.error("Failed to trigger email dispatch:", emailErr);
    }

  } catch (err) {
    console.error("Verify Payment Exception:", err);
  }

  return NextResponse.redirect(new URL('/dashboard?success=true', request.url));
}