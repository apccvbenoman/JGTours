import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

const PROCESSING_FEE_PERCENT = 0.02;

function getMinimumBookingDate() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const minimumDate = new Date(`${today}T00:00:00Z`);
  minimumDate.setUTCDate(minimumDate.getUTCDate() + 2);
  return minimumDate.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const packageId = new URL(request.url).searchParams.get('packageId');
  if (!packageId) {
    return NextResponse.json({ error: 'Package id is required' }, { status: 400 });
  }

  const { data: tourPackage, error: packageError } = await supabaseAdmin
    .from('packages')
    .select('title')
    .eq('id', packageId)
    .single();

  if (packageError || !tourPackage) {
    return NextResponse.json({ error: 'Tour package was not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, title: tourPackage.title });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedTourDate = typeof body.tourDate === 'string'
      ? new Date(`${body.tourDate}T00:00:00Z`)
      : null;
    const validTourDate = parsedTourDate &&
      Number.isFinite(parsedTourDate.getTime()) &&
      parsedTourDate.toISOString().slice(0, 10) === body.tourDate;

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const fullName = `${firstName} ${lastName}`.trim() || (typeof body.leadGuestName === 'string' ? body.leadGuestName.trim() : '');

    if (
      !body.packageId ||
      !firstName ||
      !lastName ||
      !Number.isSafeInteger(body.pax) ||
      body.pax < 1 ||
      typeof body.tourDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.tourDate) ||
      !validTourDate ||
      body.tourDate < getMinimumBookingDate() ||
      typeof body.contactNumber !== 'string' ||
      !/^(?:\+63|63|0)?9\d{9}$/.test(body.contactNumber)
    ) {
      return NextResponse.json({ error: 'Booking details are invalid or the tour date is too soon' }, { status: 400 });
    }

    const { data: tourPackage, error: packageError } = await supabaseAdmin
      .from('packages')
      .select('title, price')
      .eq('id', body.packageId)
      .single();

    if (packageError || !tourPackage) {
      return NextResponse.json({ error: 'Tour package was not found' }, { status: 404 });
    }

    const unitPrice = Number(tourPackage.price);
    const packageSubtotal = unitPrice * body.pax;
    const processingFee = Math.round(packageSubtotal * PROCESSING_FEE_PERCENT * 100) / 100;
    const totalAmount = Math.round((packageSubtotal + processingFee) * 100) / 100;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || Math.abs(Number(body.totalAmount) - totalAmount) > 0.05) {
      return NextResponse.json({ error: 'Booking amount does not match the selected package' }, { status: 400 });
    }

    let origin: string;
    try {
      origin = new URL(body.origin).origin;
    } catch {
      return NextResponse.json({ error: 'Invalid checkout origin' }, { status: 400 });
    }

    const paymongoSecret = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecret) {
      return NextResponse.json({ error: 'Paymongo secret key is missing' }, { status: 500 });
    }
    const encodedKey = Buffer.from(`${paymongoSecret}:`).toString('base64');

    // Clean phone number so PayMongo does not duplicate +63
    const rawDigits = body.contactNumber.replace(/\D/g, "");
    const cleanPhone = rawDigits.startsWith("63")
      ? rawDigits.slice(2)
      : rawDigits.startsWith("0")
      ? rawDigits.slice(1)
      : rawDigits;

    // Unique reference generated before the call
    const bookingRef = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Create Paymongo Checkout Session
    const paymongoPayload = {
      data: {
        attributes: {
          billing: {
            name: fullName,
            phone: cleanPhone,
          },
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          cancel_url: `${origin}/checkout`,
          success_url: `${origin}/api/verify-payment?ref=${bookingRef}`,
          description: `Jazgot Tour Services Booking (${tourPackage.title})`,
          line_items: [
            {
              currency: 'PHP',
              amount: Math.round(unitPrice * 100),
              name: tourPackage.title,
              quantity: body.pax
            },
            {
              currency: 'PHP',
              amount: Math.round(processingFee * 100),
              name: 'Processing Fee (2%)',
              quantity: 1
            }
          ],
          payment_method_types: ['card', 'gcash', 'paymaya']
        }
      }
    };

    const paymongoRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${encodedKey}`
      },
      body: JSON.stringify(paymongoPayload)
    });

    const paymongoData = await paymongoRes.json();

    if (!paymongoRes.ok) {
      console.error("Paymongo Error:", paymongoData);
      return NextResponse.json({ error: 'Failed to create payment gateway session' }, { status: 500 });
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url as string;
    const checkoutId = paymongoData.data.id as string;

    // Save pending booking with both checkoutId and reference number
    const { error: dbError } = await supabaseAdmin
      .from('bookings')
      .insert([
        {
          user_id: null,
          email: body.email || null,
          tour_package: tourPackage.title,
          lead_guest_name: fullName,
          pax: body.pax,
          tour_date: body.tourDate,
          contact_number: body.contactNumber,
          total_amount: totalAmount,
          paymongo_checkout_id: checkoutId,
          booking_ref: bookingRef,
          payment_status: 'pending',
          status: 'Pending'
        }
      ]);

    if (dbError) {
      // If booking_ref column doesn't exist yet in Supabase, retry without booking_ref
      await supabaseAdmin
        .from('bookings')
        .insert([
          {
            user_id: null,
            email: body.email || null,
            tour_package: tourPackage.title,
            lead_guest_name: fullName,
            pax: body.pax,
            tour_date: body.tourDate,
            contact_number: body.contactNumber,
            total_amount: totalAmount,
            paymongo_checkout_id: checkoutId,
            payment_status: 'pending',
            status: 'Pending'
          }
        ]);
    }

    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}