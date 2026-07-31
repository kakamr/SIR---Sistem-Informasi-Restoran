
export type RoleKaryawan = "kasir" | "koki" | "pelayan" | "admin" | "pemilik";

export type StatusMeja = "kosong" | "terisi";

export type JenisLayanan = "dine_in" | "take_away";

export type StatusPesanan =
  | "menunggu_bayar"
  | "diproses"
  | "selesai"
  | "dibatalkan";

export type StatusTiket = "menunggu" | "diproses" | "selesai";

export type StatusMenu = "aktif" | "nonaktif";

export type StatusStok = "aman" | "menipis" | "habis";

export type MetodePembayaran = "tunai" | "qris" | "edc";

export type MetodePembayaranSelfOrder = "gopay" | "dana" | "bri_va" | "bca_va" | "bni_va" | "qris";

export type StatusPembayaran = "berhasil" | "gagal" | "menunggu";

export type JenisLaporan = "harian" | "mingguan" | "bulanan" | "tahunan";


export interface Pelanggan {
  idPelanggan: number;
  namaPelanggan: string;
  noTelepon?: string;
  email?: string;
  username?: string; 
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
}

export interface Menu {
  idMenu: number;
  namaMenu: string;
  kategori?: string;
  harga: number;
  deskripsi?: string;
  instruksiMasak?: string; 
  gambarUrl?: string;
  statusMenu: StatusMenu;
  bahan?: ResepItem[]; 
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
  waktuPesan: string; 
  totalTagihan: number;
  detailPesanan?: DetailPesanan[]; 
  nomorMeja?: string; 
}

export interface DetailPesanan {
  idDetail: number;
  idPesanan: number;
  idMenu: number;
  namaMenu: string; 
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

export interface LaporanSummary {
  menuTersedia: number;
  totalPesanan: number;
  totalSale: number;
  totalProfit: number;
  customerOnline: number;
  customerOnShop: number;
  menuTerlaris: string; 
  revenueByMonth: { bulan: string; total: number }[];
  transaksiHariIni: {
    orderHariIni: number;
    selesai: number;
    diproses: number;
    batal: number;
  };
  pesananTerbaru: Pesanan[];
}

export interface SessionUser {
  idKaryawan: number;
  namaKaryawan: string;
  role: RoleKaryawan;
}

export interface PesananEdit {
  idPesanan: number;
  idMeja: number | null;
  jenisLayanan: JenisLayanan;
  metodePembayaran: string; 
  totalLama: number; 
  items: CartItem[];
}

export interface StrukKasirItem {
  namaMenu: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  catatanItem?: string;
}

export interface StrukKasirData {
  idPesanan: number;
  jenisLayanan: JenisLayanan;
  nomorMeja?: string;
  nomorAntrian?: string;
  namaKasir?: string;
  waktuPesan: string;
  metodePembayaran: string;
  items: StrukKasirItem[];
  subtotal: number;
  pajak: number;
  total: number;
}