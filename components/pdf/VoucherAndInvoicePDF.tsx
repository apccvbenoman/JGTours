// @ts-nocheck
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatPHP } from '@/lib/currency';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f97316', paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
  section: { marginBottom: 12 },
  label: { fontWeight: 'bold', color: '#333' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#ccc', marginTop: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '25%', backgroundColor: '#f3f4f6', padding: 6, fontWeight: 'bold' },
  tableCol: { width: '25%', padding: 6 }
});

// Travel Voucher PDF Template
export const TravelVoucherPDF = ({ booking }: { booking: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Jazgot Tour Services</Text>
        <Text>+639189345403 / jazgottour@gmail.com</Text>
        <Text style={{ fontSize: 13, fontWeight: 'bold', marginTop: 8 }}>
          Booking Confirmation / Tour Voucher ({booking.voucher_number})
        </Text>
      </View>

      <View style={styles.section}>
        <Text><Text style={styles.label}>Lead Guest Name: </Text>{booking.lead_guest_name}</Text>
        <Text><Text style={styles.label}>Pax: </Text>{booking.pax}</Text>
        <Text><Text style={styles.label}>Tour Package: </Text>{booking.tour_package}</Text>
        <Text><Text style={styles.label}>Tour Date: </Text>{booking.tour_date}</Text>
        <Text><Text style={styles.label}>Contact Number: </Text>{booking.contact_number}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Instructions:</Text>
        <Text>1. Bring beach shoes, camera, sunscreen, water/water bottle, snacks.</Text>
        <Text>2. Approach the counter, show this Tour Voucher Confirmation, and check in.</Text>
        <Text>3. Enjoy and have a safe trip!</Text>
      </View>
    </Page>
  </Document>
);

// Invoice PDF Template (Philippine Pesos)
export const InvoicePDF = ({ invoice }: { invoice: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Jazgot Tour Services</Text>
          <Text>Parañaque City, Philippines</Text>
          <Text>jazgottour@gmail.com</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold' }}>INVOICE #{invoice.invoice_no}</Text>
          <Text>Date: {invoice.date_paid || new Date().toISOString().split('T')[0]}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <Text><Text style={styles.label}>Customer: </Text>{invoice.client_name}</Text>
        <Text><Text style={styles.label}>Tour Package: </Text>{invoice.tour_package}</Text>
        <Text><Text style={styles.label}>Tour Date: </Text>{invoice.tour_date}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Description</Text>
          <Text style={styles.tableColHeader}>Pax</Text>
          <Text style={styles.tableColHeader}>Total Amount</Text>
          <Text style={styles.tableColHeader}>Status</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>{invoice.tour_package}</Text>
          <Text style={styles.tableCol}>{invoice.pax}</Text>
          <Text style={styles.tableCol}>{formatPHP(invoice.total_amount)}</Text>
          <Text style={styles.tableCol}>{invoice.status}</Text>
        </View>
      </View>
    </Page>
  </Document>
);