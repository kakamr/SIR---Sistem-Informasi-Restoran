import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: "bold", color: "#2d5a4a", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginTop: 14, marginBottom: 6 },
  summaryRow: { flexDirection: "row", marginBottom: 3 },
  summaryLabel: { width: 160 },
  headerRow: { backgroundColor: "#2d5a4a", flexDirection: "row", paddingVertical: 6 },
  headerCell: { color: "#ffffff", fontWeight: "bold", flex: 1, paddingHorizontal: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eeeeee", paddingVertical: 5 },
  cell: { flex: 1, paddingHorizontal: 4 },
});

interface TransaksiRow {
  id: number;
  tanggal: string;
  meja: string;
  sumber: string;
  status: string;
  total: number;
}

interface MenuTerlarisRow {
  namaMenu: string;
  jumlah: number;
  total: number;
}

interface LaporanPdfProps {
  label: string;
  totalTransaksi: number;
  totalPendapatan: number;
  menuTerlaris: MenuTerlarisRow[];
  transaksi: TransaksiRow[];
}

export default function LaporanPdfDocument({
  label,
  totalTransaksi,
  totalPendapatan,
  menuTerlaris,
  transaksi,
}: LaporanPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laporan Penjualan - SIR</Text>
        <Text style={styles.subtitle}>Periode: {label}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Transaksi</Text>
          <Text>: {totalTransaksi}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Pendapatan</Text>
          <Text>: Rp{totalPendapatan.toLocaleString("id-ID")}</Text>
        </View>

        <Text style={styles.sectionTitle}>Menu Terlaris</Text>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Nama Menu</Text>
            <Text style={styles.headerCell}>Terjual</Text>
            <Text style={styles.headerCell}>Pendapatan</Text>
          </View>
          {menuTerlaris.map((m, idx) => (
            <View style={styles.row} key={idx}>
              <Text style={styles.cell}>{m.namaMenu}</Text>
              <Text style={styles.cell}>{m.jumlah}</Text>
              <Text style={styles.cell}>Rp{m.total.toLocaleString("id-ID")}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Rincian Transaksi</Text>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>ID</Text>
            <Text style={styles.headerCell}>Tanggal</Text>
            <Text style={styles.headerCell}>Meja</Text>
            <Text style={styles.headerCell}>Sumber</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={styles.headerCell}>Total</Text>
          </View>
          {transaksi.map((t) => (
            <View style={styles.row} key={t.id}>
              <Text style={styles.cell}>{t.id}</Text>
              <Text style={styles.cell}>{t.tanggal}</Text>
              <Text style={styles.cell}>{t.meja}</Text>
              <Text style={styles.cell}>{t.sumber}</Text>
              <Text style={styles.cell}>{t.status}</Text>
              <Text style={styles.cell}>Rp{t.total.toLocaleString("id-ID")}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}