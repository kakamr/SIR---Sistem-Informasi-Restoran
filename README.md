# SIR — Sistem Informasi Restoran

Sistem informasi restoran berbasis web yang mengelola alur operasional restoran secara menyeluruh: pemesanan (walk-in kasir maupun self-order via QR meja), dapur, penyajian, stok bahan baku, hingga laporan penjualan. Dibangun sebagai tugas mata kuliah Rekayasa Perangkat Lunak oleh **Tim Jaipong (IF-6)**, UNIKOM.

Sistem memodelkan restoran cepat saji modern dengan dua jalur pemesanan yang berjalan berdampingan dalam satu basis data, empat peran pengguna dengan dashboard masing-masing, dan pengurangan stok bahan baku otomatis berbasis resep.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Peran Pengguna](#peran-pengguna)
- [Alur Sistem](#alur-sistem)
- [Teknologi](#teknologi)
- [Arsitektur & Keputusan Desain](#arsitektur--keputusan-desain)
- [Struktur Folder](#struktur-folder)
- [Skema Basis Data](#skema-basis-data)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Akun Demo](#akun-demo)
- [Identitas Visual](#identitas-visual)
- [Tim Pengembang](#tim-pengembang)

---

## Fitur Utama

**Pemesanan kasir (walk-in)**
- Pemilihan menu dengan pencarian dan filter kategori
- Dukungan dine-in (dengan pemilihan meja) dan take-away
- Pembayaran tunai, QRIS, dan EDC
- Edit pesanan selama makanan belum mulai dimasak — termasuk ganti meja, jenis layanan, dan metode bayar, lengkap dengan perhitungan selisih kurang bayar/kembalian
- Pembatalan pesanan dengan pengembalian stok otomatis
- Nomor antrian otomatis untuk take-away (format `A-01`, direset harian)
- Cetak struk dan cetak ulang struk lewat dialog cetak browser (kompatibel printer thermal 80mm)

**Self-order via QR meja**
- Pelanggan memindai QR di meja, memesan, dan membayar dari ponsel sendiri
- Pengisian data diri opsional (nama, no. telepon, email)
- Keranjang tersimpan per meja di perangkat pelanggan
- Tiket dapur baru terbentuk setelah pembayaran berhasil

**Dapur (koki)**
- Antrian tiket dapur berurutan (FIFO)
- Perubahan status masak: menunggu → diproses → selesai
- Notifikasi suara saat pesanan baru masuk
- Manajemen menu beserta resepnya
- Manajemen stok bahan baku

**Penyajian (pelayan)**
- Daftar pesanan yang siap disajikan secara real-time
- Notifikasi saat makanan selesai dimasak
- Penandaan pesanan selesai disajikan
- Manajemen status meja

**Stok & menu otomatis**
- Setiap menu terhubung ke bahan baku melalui tabel resep
- Stok bahan berkurang otomatis sesuai resep saat pesanan dibuat
- Validasi stok sebelum pesanan diterima — pesanan ditolak bila bahan tidak cukup
- Menu dinonaktifkan otomatis saat salah satu bahannya habis, dan aktif kembali saat stok diisi ulang

**Laporan (admin)**
- Ringkasan pendapatan, jumlah transaksi, dan menu terlaris
- Grafik pendapatan bulanan serta perbandingan pelanggan online vs on-shop
- Ekspor laporan ke Excel dan PDF sesuai periode

---

## Peran Pengguna

| Peran | Akses utama |
|-------|-------------|
| **Kasir** | Pemesanan walk-in, pembayaran, edit & pembatalan pesanan, cetak struk |
| **Koki** | Antrian dapur, manajemen menu & resep, manajemen stok bahan baku |
| **Pelayan** | Penyajian pesanan siap, manajemen status meja |
| **Admin** | Laporan penjualan, kelola staf, kelola meja, cetak QR meja |

Setiap peran memiliki dashboard terpisah, dan akses antar-halaman dijaga di tingkat middleware.

---

## Alur Sistem

**Alur kasir (walk-in)**

```
Kasir pilih menu → tentukan meja/layanan → bayar → pesanan diproses
   → tiket masuk dapur → koki masak → pelayan sajikan → selesai
```

**Alur self-order (QR meja)**

```
Pelanggan scan QR → pilih menu → isi data diri (opsional) → pilih pembayaran
   → bayar → tiket masuk dapur → koki masak → pelayan sajikan → selesai
```

Status pesanan bergerak `menunggu_bayar → diproses → selesai` (atau `dibatalkan`). Tahap penyajian direpresentasikan lewat status tiket dapur (`selesai`), bukan lewat status pesanan — inilah alasan entitas Tiket Dapur dipisah dari Pesanan.

---

## Teknologi

- **Framework:** Next.js 15 (App Router)
- **Bahasa:** TypeScript
- **Basis data:** MySQL (driver `mysql2`, connection pool)
- **Styling:** Tailwind CSS
- **Autentikasi:** bcrypt untuk hashing kata sandi, sesi berbasis cookie
- **Laporan:** ExcelJS (Excel), @react-pdf/renderer (PDF)
- **Struk:** Canvas (self-order), HTML cetak (kasir)
- **Font:** Geist & Geist Mono (`next/font`)

Komunikasi data memakai **Server Actions** alih-alih REST API route, dan pembaruan real-time memakai **short polling** yang berhenti otomatis saat tab tidak aktif.

---

## Arsitektur & Keputusan Desain

Beberapa keputusan teknis penting yang membentuk sistem ini:

- **Server Actions, bukan API routes** — logika basis data dipanggil langsung dari komponen sebagai fungsi server, mengurangi boilerplate endpoint.
- **Short polling dengan jeda saat idle** — daftar pesanan, antrian dapur, dan penyajian menyegar berkala; polling berhenti saat tab disembunyikan untuk menghemat koneksi.
- **Stok berbasis resep** — pengurangan, validasi, penonaktifan, dan pengaktifan kembali menu semuanya bersumber dari relasi resep, disatukan dalam satu utilitas agar konsisten di semua alur.
- **Transaksi basis data** — pembuatan pesanan, pembayaran, tiket dapur, dan penyesuaian stok dijalankan dalam satu transaksi; kegagalan di tengah otomatis di-rollback.
- **Nomor antrian hanya untuk take-away** — dine-in sudah teridentifikasi lewat nomor meja, sehingga kolomnya sengaja bernilai NULL untuk dine-in.
- **Pembatasan data operasional** — daftar pesanan kasir menampilkan 7 hari terakhir ditambah semua pesanan yang masih berjalan, menjaga performa saat volume data besar. Riwayat penuh tersedia di halaman Laporan.

---

## Struktur Folder

```
src/
├── app/
│   ├── (admin)/          # admin-laporan, kelola-meja, kelola-staff, qr-meja
│   ├── (kasir)/          # pemesanan, pesanan, laporan
│   ├── (koki)/           # antrian, menu, stok
│   ├── (pelayan)/        # meja, penyajian
│   ├── order/[kodeAkses]/# alur self-order per meja
│   ├── login/
│   └── qr-print/
├── components/
│   ├── admin/  kasir/  koki/  pelayan/  selforder/  shared/
├── lib/
│   ├── actions/          # server actions per domain (pesanan, menu, bahan, ...)
│   ├── hooks/            # usePolling, useNewItemNotification
│   ├── utils/            # format mata uang, generator struk & QR, cek stok
│   ├── types/            # definisi tipe mengikuti ERD
│   ├── cart-context.tsx  # keranjang self-order
│   └── db.ts             # connection pool MySQL
└── middleware.ts         # penjagaan akses per peran
```

Setiap folder halaman mengikuti pola `page.tsx` (server component) + `XxxClient.tsx` (client component).

---

## Skema Basis Data

Sebelas entitas utama:

`Pelanggan`, `Meja`, `Karyawan`, `Menu`, `Bahan_Baku`, `Resep`, `Pesanan`, `Detail_Pesanan`, `Pembayaran`, `Tiket_Dapur`, `Laporan`.

Relasi inti:
- `Menu` ↔ `Bahan_Baku` many-to-many lewat `Resep`
- `Pesanan` → `Detail_Pesanan` (item pesanan), `Pembayaran`, dan `Tiket_Dapur`
- `Pesanan` opsional terhubung ke `Pelanggan` (self-order) dan `Meja` (dine-in)

Skema lengkap beserta data contoh ada di berkas SQL pada repositori.

---

## Instalasi & Menjalankan

**Prasyarat:** Node.js 18+, MySQL/MariaDB (mis. via XAMPP).

1. **Klon dan pasang dependensi**
   ```bash
   git clone <url-repo>
   cd sir
   npm install
   ```

2. **Siapkan basis data**

   Buat basis data `rpl_sir`, lalu impor berkas SQL lewat phpMyAdmin atau terminal:
   ```bash
   mysql -u root rpl_sir < rpl_sir.sql
   ```

3. **Konfigurasi lingkungan**

   Buat berkas `.env.local` di root proyek:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=rpl_sir
   ```

4. **Jalankan server pengembangan**
   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000).

> Untuk mengakses self-order dari ponsel dalam jaringan yang sama, jalankan dengan `npm run dev -- -H 0.0.0.0` lalu buka alamat IP komputer host dari ponsel.

---

## Akun Demo

| Peran | Username |
|-------|----------|
| Kasir | `rifky.kasir` |
| Koki | `kaka.koki` |
| Pelayan | `urbania.pelayan` |
| Admin | `admin.resto` |

> Kata sandi tiap akun disepakati internal tim dan tidak dicantumkan di sini demi keamanan. Kata sandi disimpan dalam bentuk hash bcrypt, bukan teks biasa.

---

## Identitas Visual

| Warna | Kode | Penggunaan |
|-------|------|-----------|
| Hijau primer | `#2d5a4a` | Tombol utama, header, badge aktif |
| Hijau hover | `#254a3d` | Status hover tombol |
| Hijau muda | `#7ba88f` | Aksen grafik |
| Krem | `#fdf8f0` | Latar kartu dan panel |
| Netral | `#e2e2e2` | Latar sekunder |

Tipografi memakai **Geist** (sans-serif) dan **Geist Mono**.

---

## Tim Pengembang

**Tim Jaipong — Kelas IF-6**
Program Studi Teknik Informatika, Universitas Komputer Indonesia (UNIKOM)

Dikembangkan sebagai proyek mata kuliah Rekayasa Perangkat Lunak.

---

<p align="center">
  <sub>SIR — Sistem Informasi Restoran · Tim Jaipong IF-6 · UNIKOM</sub>
</p>