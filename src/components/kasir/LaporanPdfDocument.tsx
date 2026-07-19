import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: "bold", color: "#2d5a4a", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  table: { display: "flex", width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eeeeee", paddingVertical: 6 },
  headerRow: { backgroundColor: "#2d5a4a", flexDirection: "row", paddingVertical: 8 },
  headerCell: { color: "#ffffff", fontWeight: "bold", flex: 1, paddingHorizontal: 4 },
  cell: { flex: 1, paddingHorizontal: 4 },
});

interface LaporanPdfProps {
  periodeMulai: string;
  periodeSelesai: string;
  totalPendapatan: number;
  totalTransaksi: number;
  transaksi: { id: number; tanggal: string; meja: string; total: number; status: string }[];
}

export default function LaporanPdfDocument({
  periodeMulai,
  periodeSelesai,
  totalPendapatan,
  totalTransaksi,
  transaksi,
}: LaporanPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laporan Penjualan - SIR</Text>
        <Text style={styles.subtitle}>
          Periode: {periodeMulai} s/d {periodeSelesai}
        </Text>

        <Text>Total Transaksi: {totalTransaksi}</Text>
        <Text>Total Pendapatan: Rp{totalPendapatan.toLocaleString("id-ID")}</Text>

        <Text style={styles.sectionTitle}>Rincian Transaksi</Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>ID</Text>
            <Text style={styles.headerCell}>Tanggal</Text>
            <Text style={styles.headerCell}>Meja</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={styles.headerCell}>Total</Text>
          </View>
          {transaksi.map((t) => (
            <View style={styles.row} key={t.id}>
              <Text style={styles.cell}>{t.id}</Text>
              <Text style={styles.cell}>{t.tanggal}</Text>
              <Text style={styles.cell}>{t.meja}</Text>
              <Text style={styles.cell}>{t.status}</Text>
              <Text style={styles.cell}>Rp{t.total.toLocaleString("id-ID")}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}