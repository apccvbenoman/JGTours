import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailData {
  invoiceNo: string;
  clientName: string;
  customerEmail: string;
  tourPackage: string;
  pax: number;
  tourDate: string;
  totalAmount: number;
  contactNumber: string;
}

// 1. SERVICE INVOICE TEMPLATE (Replaced "Quotation" with "Service Invoice")
export function renderServiceInvoiceHtml(data: EmailData) {
  const formattedDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const tourFormattedDate = new Date(`${data.tourDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b;">
    <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      
      <!-- Header Banner matching quotation theme -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 35%, #f59e0b 70%, #ea580c 100%); padding: 24px 30px; color: white;">
        <table width="100%">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 26px; font-weight: bold; color: white;">Jazgot Tour Services</h1>
              <p style="margin: 4px 0 0; font-size: 13px; font-style: italic;">Let's have a break, unwind, enjoy life & recharge!</p>
              <p style="margin: 4px 0 0; font-size: 12px;">+639189345403 | jazgottour@gmail.com</p>
            </td>
            <td align="right" style="vertical-align: top;">
              <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">SERVICE INVOICE</h2>
              <p style="margin: 4px 0 0; font-size: 14px; font-weight: bold;">#${data.invoiceNo}</p>
              <p style="margin: 2px 0 0; font-size: 12px;">Date: ${formattedDate}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Customer & Tour Details -->
      <div style="padding: 24px 30px; border-bottom: 2px solid #f97316;">
        <table width="100%">
          <tr>
            <td style="vertical-align: top;" width="50%">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">CUSTOMER</p>
              <p style="margin: 4px 0; font-size: 15px; font-weight: bold; color: #0f172a;">${data.clientName}</p>
              <p style="margin: 2px 0; font-size: 13px; color: #475569;">${data.contactNumber}</p>
            </td>
            <td style="vertical-align: top;" width="50%">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">TOUR PACKAGE</p>
              <p style="margin: 4px 0; font-size: 15px; font-weight: bold; color: #0f172a;">${data.tourPackage}</p>
              <p style="margin: 2px 0; font-size: 13px; color: #475569;">${data.pax} Pax | Date: ${tourFormattedDate}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Itemized Table -->
      <div style="padding: 20px 30px;">
        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b;">
              <th>Description</th>
              <th align="center">Quantity</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px;">
              <td style="padding: 14px 10px;">
                <strong>${data.tourPackage}</strong>
                <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Tour scheduled on ${tourFormattedDate} (Inclusive of processing fee)</p>
              </td>
              <td align="center" style="padding: 14px 10px;">${data.pax} pax</td>
              <td align="right" style="padding: 14px 10px; font-weight: bold;">₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colspan="2" align="right" style="padding-top: 16px; font-size: 14px; font-weight: bold;">Total Paid:</td>
              <td align="right" style="padding-top: 16px; font-size: 18px; font-weight: bold; color: #059669;">₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Terms & Notes -->
      <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 6px; font-weight: bold; color: #334155;">Terms & Conditions:</p>
        <p style="margin: 0 0 4px;">• Bookings are non-refundable, but can be rebooked subject to slot availability.</p>
        <p style="margin: 0 0 4px;">• Jazgot Tour Services is not responsible for itinerary changes that may arise due to technical maintenance, transportation problems, flight schedule changes, weather, or natural disasters.</p>
        <p style="margin: 10px 0 0; font-style: italic;">Thank you for booking with Jazgot Tour Services!</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// 2. TRAVEL VOUCHER TEMPLATE (Based on Tita's voucher format)
export function renderTravelVoucherHtml(data: EmailData) {
  const tourFormattedDate = new Date(`${data.tourDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b;">
    <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      
      <!-- Voucher Header -->
      <div style="background-color: #1e293b; color: white; padding: 24px 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">JAZGOT TOUR SERVICES</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">+639189345403 | jazgottour@gmail.com</p>
        <div style="display: inline-block; margin-top: 14px; background: #f59e0b; color: #1e293b; font-weight: bold; padding: 6px 16px; border-radius: 4px; font-size: 13px; text-transform: uppercase;">
          Tour Voucher / Booking Confirmation
        </div>
      </div>

      <!-- Voucher Metadata -->
      <div style="padding: 20px 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <table width="100%">
          <tr>
            <td>
              <p style="margin: 0; font-size: 12px; color: #64748b;">VOUCHER / INVOICE REF:</p>
              <p style="margin: 2px 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${data.invoiceNo}</p>
            </td>
            <td>
              <p style="margin: 0; font-size: 12px; color: #64748b;">LEAD GUEST:</p>
              <p style="margin: 2px 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${data.clientName}</p>
            </td>
            <td align="right">
              <p style="margin: 0; font-size: 12px; color: #64748b;">TOTAL PAX / DATE:</p>
              <p style="margin: 2px 0 0; font-size: 14px; font-weight: bold; color: #0f172a;">${data.pax} Pax | ${tourFormattedDate}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Tour & Typical Schedule -->
      <div style="padding: 24px 30px;">
        <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; text-transform: uppercase;">${data.tourPackage}</h3>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
          <h4 style="margin: 0 0 8px; font-size: 13px; color: #1e40af; text-transform: uppercase;">Estimated Itinerary & Timeline:</h4>
          <p style="margin: 4px 0; font-size: 12px; color: #1e3a8a;"><strong>06:45H – 07:00H:</strong> Travel time from accommodation to Town assembly area.</p>
          <p style="margin: 4px 0; font-size: 12px; color: #1e3a8a;"><strong>07:00H – 08:00H:</strong> Registration / Assembly Time / Tour Orientation.</p>
          <p style="margin: 4px 0; font-size: 12px; color: #1e3a8a;"><strong>08:00H – 17:00H:</strong> Island Hopping Tour & Lunch.</p>
          <p style="margin: 4px 0; font-size: 12px; color: #1e3a8a;"><strong>17:00H onwards:</strong> End of tour / Free & easy.</p>
        </div>

        <!-- Instructions from Tita's voucher -->
        <h4 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #334155;">Tour Guidelines & Instructions:</h4>
        <ol style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #475569;">
          <li><strong>Things to bring:</strong> Beach shoes / aqua shoes, dry bag, camera, sunscreen, water tumbler, and personal snacks.</li>
          <li>Kindly proceed to the designated assembly and briefing point on Calle Hama in town.</li>
          <li>Present this <strong>Tour Voucher Confirmation</strong> upon registration.</li>
          <li>Your assigned tour guide will conduct the briefing and guide you to the boat boarding area.</li>
          <li>Life vests and snorkeling gear will be provided on the boat.</li>
          <li>Optional kayak rentals at lagoons are payable directly on-site to local boatmen (approx. ₱400/kayak for 2 pax).</li>
          <li>Complimentary buffet picnic lunch will be served on one of the destination islands.</li>
          <li>Enjoy, stay safe, and have an unforgettable trip!</li>
        </ol>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 30px; background-color: #f1f5f9; text-align: center; font-size: 11px; color: #64748b;">
        <p style="margin: 0;">Have questions? Contact us via call or WhatsApp at +639189345403 or email jazgottour@gmail.com.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Function to send both emails
export async function sendBookingDocuments(data: EmailData) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not configured. Skipping email dispatch.");
    return;
  }

  // 1. Send Service Invoice
  await transporter.sendMail({
    from: `"Jazgot Tour Services" <${process.env.SMTP_USER}>`,
    to: data.customerEmail,
    subject: `Service Invoice #${data.invoiceNo} - Jazgot Tour Services`,
    html: renderServiceInvoiceHtml(data),
  });

  // 2. Send Travel Voucher
  await transporter.sendMail({
    from: `"Jazgot Tour Services" <${process.env.SMTP_USER}>`,
    to: data.customerEmail,
    subject: `Tour Voucher & Booking Confirmation #${data.invoiceNo} - Jazgot Tour Services`,
    html: renderTravelVoucherHtml(data),
  });
}