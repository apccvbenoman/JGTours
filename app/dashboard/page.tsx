"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SiteShell } from "@/components/site-shell"
import { jsPDF } from "jspdf"
import { toast } from "sonner"

interface BookingDetails {
  id: string
  tour_package: string
  lead_guest_name: string
  pax: number
  tour_date: string
  contact_number: string
  total_amount: number
  payment_status: string
  email?: string
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const ref = searchParams?.get('ref') || ''
  const isSuccess = searchParams?.get('success') === 'true'

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [invoiceNo, setInvoiceNo] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear any lingering toast banners on mount
    toast.dismiss()

    if (isSuccess) {
      toast.success("Payment successful! Your tour booking is confirmed.")
    }

    async function loadBooking() {
      try {
        const res = await fetch(`/api/dashboard-booking?ref=${encodeURIComponent(ref)}`)
        const data = await res.json()

        if (res.ok && data.booking) {
          setBooking(data.booking)
          setInvoiceNo(data.invoiceNo || "JGTINV2026-001")
        } else {
          toast.error("Could not load your latest booking details.")
        }
      } catch (err) {
        console.error(err)
        toast.error("Network error loading booking.")
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [ref, isSuccess])

  // 1. Download Service Invoice PDF
  const downloadServiceInvoice = () => {
    if (!booking) return
    const toastId = toast.loading("Generating Service Invoice...")

    try {
      const doc = new jsPDF()

      // Header Banner
      doc.setFillColor(16, 185, 129) // Emerald
      doc.rect(0, 0, 210, 32, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(20)
      doc.text("JAZGOT TOUR SERVICES", 18, 16)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text("Let's have a break, unwind, enjoy life & recharge!", 18, 22)
      doc.text("+639189345403 | jazgottour@gmail.com", 18, 27)

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("SERVICE INVOICE", 140, 16)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`#${invoiceNo}`, 140, 22)
      doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 140, 27)

      // Customer and Package Info
      doc.setTextColor(30, 41, 59)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("CUSTOMER DETAILS", 18, 44)
      doc.text("BOOKING DETAILS", 110, 44)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(`Name: ${booking.lead_guest_name}`, 18, 51)
      doc.text(`Contact: ${booking.contact_number}`, 18, 57)
      if (booking.email) doc.text(`Email: ${booking.email}`, 18, 63)

      doc.text(`Package: ${booking.tour_package}`, 110, 51)
      doc.text(`Guests: ${booking.pax} Pax`, 110, 57)
      doc.text(`Tour Date: ${booking.tour_date}`, 110, 63)

      // Table Header
      doc.setDrawColor(226, 232, 240)
      doc.line(18, 72, 192, 72)
      doc.setFillColor(248, 250, 252)
      doc.rect(18, 74, 174, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.text("DESCRIPTION", 22, 79)
      doc.text("QTY", 120, 79)
      doc.text("TOTAL", 160, 79)

      // Table Row
      doc.setFont("helvetica", "normal")
      doc.text(`${booking.tour_package}`, 22, 90)
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text(`Includes 2% processing fee`, 22, 95)

      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59)
      doc.text(`${booking.pax} pax`, 120, 90)
      doc.text(`PHP ${booking.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, 160, 90)

      doc.line(18, 102, 192, 102)

      // Total Paid
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text("Total Paid:", 120, 112)
      doc.setTextColor(5, 150, 105)
      doc.text(`PHP ${booking.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, 160, 112)

      // Terms
      doc.setTextColor(100, 116, 139)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text("Terms & Conditions:", 18, 130)
      doc.text("• Bookings are non-refundable, but can be rebooked subject to slot availability.", 18, 136)
      doc.text("• Jazgot Tour Services is not liable for changes due to weather or transport advisories.", 18, 142)

      doc.save(`Service_Invoice_${invoiceNo}.pdf`)
      toast.success("Service Invoice downloaded!")
    } catch (e) {
      console.error("Invoice generation error:", e)
      toast.error("Failed to generate invoice PDF.")
    } finally {
      toast.dismiss(toastId)
    }
  }

  // 2. Download Tour Voucher PDF
  const downloadTourVoucher = () => {
    if (!booking) return
    const toastId = toast.loading("Generating Tour Voucher...")

    try {
      const doc = new jsPDF()

      // Dark header matching Tita's voucher layout
      doc.setFillColor(30, 41, 59)
      doc.rect(0, 0, 210, 34, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text("JAZGOT TOUR SERVICES", 18, 16)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text("+639189345403 | jazgottour@gmail.com", 18, 22)
      doc.setFont("helvetica", "bold")
      doc.text("BOOKING CONFIRMATION / TOUR VOUCHER", 18, 29)

      // Reference Box
      doc.setTextColor(30, 41, 59)
      doc.setFillColor(241, 245, 249)
      doc.rect(18, 42, 174, 22, "F")
      doc.setFontSize(9)
      doc.text(`VOUCHER REF: #${invoiceNo}`, 24, 51)
      doc.text(`LEAD GUEST: ${booking.lead_guest_name.toUpperCase()}`, 24, 58)
      doc.text(`TOTAL PAX: ${booking.pax} Pax`, 120, 51)
      doc.text(`TOUR DATE: ${booking.tour_date}`, 120, 58)

      // Tour Title
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(booking.tour_package.toUpperCase(), 18, 76)

      // Itinerary Section
      doc.setFillColor(239, 246, 255)
      doc.rect(18, 82, 174, 26, "F")
      doc.setFontSize(8)
      doc.setTextColor(30, 58, 138)
      doc.text("ESTIMATED ITINERARY & TIMELINE:", 22, 88)
      doc.setFont("helvetica", "normal")
      doc.text("06:45H – 07:00H  Travel time from accommodation to Town assembly area", 22, 94)
      doc.text("07:00H – 08:00H  Registration / Assembly Time / Tour Briefing @ Calle Hama", 22, 99)
      doc.text("08:00H – 17:00H  Island Hopping Tour & Buffet Lunch", 22, 104)

      // Guidelines
      doc.setTextColor(30, 41, 59)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("TOUR GUIDELINES & INSTRUCTIONS:", 18, 120)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      const guidelines = [
        "1. Things to bring: Beach shoes, camera, sunscreen, water bottle, and light snacks.",
        "2. From your accommodation, kindly go to Calle Hama assembly point in El Nido town.",
        "3. Approach the counter and present this Tour Voucher Booking Confirmation.",
        "4. The tour guide will brief you regarding the tour and direct you to the boat boarding area.",
        "5. Life vests and snorkeling gear are provided on board.",
        "6. Kayak rentals at lagoons can be rented directly from boatmen (approx. P400/kayak for 2 pax).",
        "7. Lunch will be prepared on one of the designated island stops.",
        "8. Enjoy your tour and have a wonderful time in El Nido!"
      ]

      let yPos = 128
      guidelines.forEach((g) => {
        doc.text(g, 18, yPos)
        yPos += 7
      })

      doc.save(`Tour_Voucher_${invoiceNo}.pdf`)
      toast.success("Tour Voucher downloaded!")
    } catch (e) {
      console.error("Voucher generation error:", e)
      toast.error("Failed to generate voucher PDF.")
    } finally {
      toast.dismiss(toastId)
    }
  }

  return (
    <SiteShell>
      <div className="min-h-[70vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">Booking Confirmation</h1>
            <p className="text-slate-500 mt-1">View your confirmed booking, official service invoice, and tour voucher.</p>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
              Loading confirmed booking details...
            </div>
          ) : !booking ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
              No confirmed bookings found.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Header Status Bar */}
              <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full mb-2">
                    CONFIRMED & PAID
                  </span>
                  <h2 className="text-xl font-bold">{booking.tour_package}</h2>
                  <p className="text-sm text-slate-300 mt-1">Invoice Ref: #{invoiceNo}</p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-bold text-[#ce9136]">
                    ₱{booking.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Guest & Trip Summary */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Lead Guest</p>
                  <p className="font-semibold text-slate-900">{booking.lead_guest_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tour Date & Pax</p>
                  <p className="font-semibold text-slate-900">{booking.tour_date} • {booking.pax} Guest(s)</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                  <p className="font-semibold text-slate-900">{booking.contact_number}</p>
                </div>
              </div>

              {/* Download Action Buttons */}
              <div className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-4 border-b border-slate-200">
                <button
                  onClick={downloadTourVoucher}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-bold text-sm transition-colors text-center shadow-sm"
                >
                  Download Tour Voucher (PDF)
                </button>
                <button
                  onClick={downloadServiceInvoice}
                  className="flex-1 bg-[#ce9136] hover:bg-[#b87d2b] text-white py-3 px-4 rounded-lg font-bold text-sm transition-colors text-center shadow-sm"
                >
                  Download Service Invoice (PDF)
                </button>
              </div>

              {/* In-App Tour Guidelines Preview */}
              <div className="p-6 space-y-4 text-sm text-slate-600">
                <h3 className="font-bold text-slate-900 text-base">Tour Day Reminders & Guidelines</h3>
                <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed text-slate-600">
                  <li><strong>Assembly Point:</strong> Proceed to the registration counter along Calle Hama, El Nido Town between 07:00H - 08:00H.</li>
                  <li><strong>What to Bring:</strong> Aqua shoes, dry bag, camera, sunscreen, and refillable water bottle.</li>
                  <li><strong>Verification:</strong> Present your downloaded Tour Voucher on your phone upon registration.</li>
                  <li><strong>Inclusions:</strong> Island hopping boat transfer, snorkeling gear, and complimentary buffet lunch.</li>
                </ul>
              </div>

            </div>
          )}

        </div>
      </div>
    </SiteShell>
  )
}