// ============================================================
// TYPE DEFINITIONS - Sistem Informasi Restoran (SIR)
// Mengikuti struktur ERD: Pelanggan, Meja, Karyawan, Menu,
// Bahan_Baku, Resep, Pesanan, Detail_Pesanan, Pembayaran,
// Tiket_Dapur, Laporan
// ============================================================

// ---------- Enum-enum status ----------
export type RoleKaryawan = "kasir" | "koki" | "pelayan" | "admin";

export type StatusMeja = "kosong" | "terisi";

export type JenisLayanan = "dine_in" | "take_away";

export type StatusPesanan =
  | "menunggu_bayar"
  | "diproses"
  | "disajikan"
  | "selesai"
  | "dibatalkan";

export type StatusTiket = "menunggu" | "diproses" | "selesai";

export type StatusMenu = "aktif" | "nonaktif";

export type StatusStok = "aman" | "menipis" | "habis";

export type MetodePembayaran = "tunai" | "qris" | "edc";

export type MetodePembayaranSelfOrder = "gopay" | "dana" | "bri_va" | "bca_va" | "bni_va" | "qris";

export type StatusPembayaran = "berhasil" | "gagal" | "menunggu";

export type JenisLaporan = "harian" | "mingguan" | "bulanan" | "tahunan";

// ---------- Entitas utama ----------

export interface Pelanggan {
  idPelanggan: number;
  namaPelanggan: string;
  noTelepon?: string;
  email?: string;
  username?: string; // opsional, untuk self-order
}

export interface Meja {
  idMeja: number;
  nomorMeja: string;
  kapasitas: number;
  statusMeja: StatusMeja;
  qrCode?: string;
  kodeAkses?: string;
}

export interface Karyawan {
  idKaryawan: number;
  namaKaryawan: string;
  role: RoleKaryawan;
  username: string;
  noTelepon?: string;
  // password_hash sengaja TIDAK dimasukkan ke type frontend
  // karena tidak boleh pernah dikirim ke client
}

export interface Menu {
  idMenu: number;
  namaMenu: string;
  kategori?: string;
  harga: number;
  deskripsi?: string;
  instruksiMasak?: string; // field "Resep" di UI form (Img 14/15)
  gambarUrl?: string;
  statusMenu: StatusMenu;
  bahan?: ResepItem[]; // relasi many-to-many lewat Resep, dipakai saat form edit
}

export interface BahanBaku {
  idBahan: number;
  namaBahan: string;
  satuan: string;
  gambarUrl?:string;
  stokTersedia: number;
  batasMinimum: number;
  statusStok: StatusStok;
}

export interface Resep {
  idResep: number;
  idMenu: number;
  idBahan: number;
  jumlahDibutuhkan: number;
}

// Bentuk gabungan Resep + data Bahan, dipakai di UI (chip "Beras - 100gr")
export interface ResepItem {
  idBahan: number;
  namaBahan: string;
  jumlahDibutuhkan: number;
  satuan: string;
}

export interface Pesanan {
  idPesanan: number;
  idPelanggan?: number;
  idMeja?: number;
  idKaryawan: number;
  jenisLayanan: JenisLayanan;
  nomorAntrian?: string;
  statusPesanan: StatusPesanan;
  statusTiket?: StatusTiket | null;
  waktuPesan: string; // ISO date string
  totalTagihan: number;
  detailPesanan?: DetailPesanan[]; // di-include saat fetch detail
  nomorMeja?: string; // denormalized, buat tampilan cepat (Img 4: "Meja 1")
}

export interface DetailPesanan {
  idDetail: number;
  idPesanan: number;
  idMenu: number;
  namaMenu: string; // denormalized untuk tampilan langsung
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  catatanItem?: string;
}

export interface Pembayaran {
  idPembayaran: number;
  idPesanan: number;
  metodePembayaran: MetodePembayaran;
  jumlahBayar: number;
  statusPembayaran: StatusPembayaran;
  waktuBayar: string;
  buktiPembayaran?: string;
}

export interface TiketDapur {
  idTiket: number;
  idPesanan: number;
  urutanAntrian: number;
  statusTiket: StatusTiket;
  waktuMasukDapur: string;
  waktuSelesai?: string;
}

export interface Laporan {
  idLaporan: number;
  idKaryawan: number;
  jenisLaporan: JenisLaporan;
  periodeMulai: string;
  periodeSelesai: string;
  totalPendapatan: number;
  totalTransaksi: number;
  waktuDibuat: string;
  fileLaporan?: string;
}

// ---------- Tipe khusus untuk UI (bukan dari ERD langsung) ----------

// Item di keranjang/cart sebelum disubmit jadi Pesanan (Img 1,2)
export interface CartItem {
  idMenu: number;
  namaMenu: string;
  harga: number;
  jumlah: number;
  gambarUrl?: string;
  catatanItem?: string;
}

export interface CartItemSelfOrder extends CartItem {
  catatanItem?: string;
}

// Ringkasan dashboard Laporan (Img 5)
export interface LaporanSummary {
  menuTersedia: number;
  totalPesanan: number;
  totalSale: number;
  totalProfit: number;
  customerOnline: number;
  customerOnShop: number;
  menuTerlaris: string; // tambahkan ini
  revenueByMonth: { bulan: string; total: number }[];
  transaksiHariIni: {
    orderHariIni: number;
    selesai: number;
    diproses: number;
    batal: number;
  };
  pesananTerbaru: Pesanan[];
}

// Session user setelah login (dipakai di middleware & context)
export interface SessionUser {
  idKaryawan: number;
  namaKaryawan: string;
  role: RoleKaryawan;
}

