// @ts-nocheck
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import { TravelVoucherPDF, InvoicePDF } from '@/components/pdf/VoucherAndInvoicePDF';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { bookingId, recipientEmail } = await req.json();

    // 1. Fetch booking details
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    const booking: any = bookingData;

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. Fetch associated invoice details
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .eq('tour_package', booking.tour_package)
      .eq('client_name', booking.lead_guest_name)
      .single();

    const invoice: any = invoiceData;

    // 3. Render both PDFs safely using React.createElement
    const voucherBuffer = await renderToBuffer(
      React.createElement(TravelVoucherPDF, { booking })
    );
    
    const invoiceBuffer = invoice
      ? await renderToBuffer(React.createElement(InvoicePDF, { invoice }))
      : null;

    // 4. Prepare attachments array
    const attachments: any[] = [
      {
        filename: `Travel-Voucher-${booking.voucher_number}.pdf`,
        content: voucherBuffer,
      },
    ];

    if (invoiceBuffer && invoice) {
      attachments.push({
        filename: `Invoice-${invoice.invoice_no}.pdf`,
        content: invoiceBuffer,
      });
    }

    // 5. Send formal email containing both PDF attachments
    await resend.emails.send({
      from: 'Jazgot Tour Services <bookings@yourdomain.com>',
      to: recipientEmail,
      subject: `Your Booking Confirmation & Invoice - ${booking.tour_package}`,
      html: `
        <p>Dear ${booking.lead_guest_name},</p>
        <p>Thank you for booking with <strong>Jazgot Tour Services</strong>!</p>
        <p>Please find attached your official <strong>Travel Voucher (${booking.voucher_number})</strong> and <strong>Invoice (${invoice?.invoice_no || 'Pending'})</strong> for your upcoming tour.</p>
        <br/>
        <p>Best regards,<br/>Jazgot Tour Services Team</p>
      `,
      attachments,
    });

    return NextResponse.json({ success: true, message: 'Voucher and invoice emails sent successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}