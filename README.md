# 🧆 RisolPOS — Sistem Kasir (POS) & Manajemen Multi-Gerobak Risol UMKM

**RisolPOS** adalah aplikasi **Point of Sale (POS) Mobile-First PWA** dan **Dashboard Manajemen Multi-Outlet Real-Time** yang dirancang khusus untuk operasional usaha gerobak risol UMKM. Aplikasi ini mendukung pencatatan transaksi kasir super cepat (Tunai & QRIS Muamalat), cetak struk thermal Bluetooth 58mm, penyimpanan struk PDF otomatis saat printer mati, pengawasan stok fisik *real-time* per gerobak, hingga grafik analitik penjualan harian.

---

## ✨ Fitur Utama

### 1. 🛒 Halaman Kasir POS (`/pos`)
- **Login Khusus Per Gerobak/Outlet**: Setiap akun kasir terikat langsung ke gerobak tempatnya bertugas menggunakan **PIN 6-Digit** terenkripsi (`bcrypt`), sehingga transaksi dan pemotongan stok otomatis tercatat pada gerobak tersebut.
- **Katalog Produk Responsif**: Pencarian instan, filter kategori (*Best Seller*, *Pedas*, *Manis*, *Spesial*, *Minuman*), indikator stok *real-time* per gerobak, dan foto menu asli.
- **Pembayaran Tunai & QRIS Muamalat**:
  - **Tunai (`CASH`)**: Kalkulator uang diterima dengan tombol nominal cepat (`Uang Pas`, `Rp 10.000`, `Rp 20.000`, `Rp 50.000`, `Rp 100.000`) dan perhitungan kembalian otomatis.
  - **QRIS (`QRIS_MUAMALAT`)**: Tampilan kode QRIS statis/dinamis beserta pencatatan aplikasi pembayaran pelanggan (*GoPay, OVO, DANA, ShopeePay, BCA Mobile, Muamalat DIN, BRI, Mandiri, dll.*).
- **Cetak Struk Thermal 58mm & Unduh PDF Otomatis**:
  - **Printer Aktif (Bluetooth)**: Mencetak struk ESC/POS 58mm langsung ke printer thermal portable via **Web Bluetooth API**.
  - **Printer Off / Tidak Terhubung**: Secara otomatis mengunduh file struk **`Struk-INV-....pdf`** berukuran kertas thermal 58mm yang siap dikirim ke WhatsApp pelanggan atau disimpan sebagai arsip.
  - **Cetak Browser**: Mendukung cetak ke printer kasir kabel USB/Wi-Fi melalui dialog cetak browser.
  - **Tombol "Struk Terakhir"**: Memungkinkan kasir membuka, mencetak ulang, atau mengunduh ulang PDF struk transaksi terakhir kapan saja.

### 2. 👑 Dashboard Pemilik Usaha / Owner (`/owner`)
- **Grafik & Ringkasan Keuangan Real-Time**:
  - Kartu metrik: **Total Omzet Kotor**, **Total Pcs Terjual**, **Pendapatan Tunai**, **Pendapatan QRIS**, **Total Belanja Bahan (Kulakan)**, dan **Estimasi Kas Bersih (Laba Kotor)**.
  - **Grafik Analitik Penjualan (`SalesAnalyticsChart`)**: Visualisasi tren penjualan per jam, proporsi pembayaran Tunai vs QRIS, produk terlaris (*Top Menu*), dan perbandingan omzet antar gerobak.
  - **Riwayat Transaksi & Rekonsiliasi Mutasi**: Daftar nota lengkap dengan filter tanggal WIB (*Hari Ini, Kemarin, 7 Hari, 30 Hari, Custom*), penanda rekonsiliasi mutasi bank, tombol unduh **PDF**, dan **Cetak Salinan Struk**.
- **Katalog Menu Risol (`/owner?tab=products`)**:
  - Tambah, ubah harga jual/HPP, nonaktifkan, atau hapus menu risol.
  - **Upload Foto Menu Kustom**: Kompresi gambar otomatis di sisi klien (JPEG) sehingga ringan dan cepat dimuat tanpa membebani server.
- **Manajemen Stok & Audit Fisik Real-Time (`/owner?tab=stock`)**:
  - **4 Mode Pergerakan Stok Per Gerobak**:
    1. `+ Restock`: Tambah stok baru dari dapur pusat ke gerobak tertentu.
    2. `− Catat Rusak`: Kurangi stok karena rusak/basi/kulit robek beserta alasan wajib.
    3. `= Opname Fisik`: Sesuaikan stok sistem dengan hasil hitung fisik di gerobak.
    4. `🔄 Transfer Gerobak`: Pindahkan stok antar cabang gerobak secara instan.
  - **Tabel Audit Stok Fisik Risol (Real-Time Polling 4 Detik)**: Menampilkan `Stok Fisik`, `Masuk (+Restock)`, `Terjual (-POS)`, `Rusak (-Waste)`, `Koreksi Opname`, dan `Seharusnya` beserta indikator selisih otomatis.
  - **Log Pergerakan Stok Realtime (*Audit Trail*)**: Rekam jejak lengkap setiap perubahan stok (`Sebelum → Sesudah`), waktu WIB, nama gerobak, dan catatan.
- **Catat Kulakan / Belanja Bahan Baku (`/owner?tab=expenses`)**:
  - Pencatatan pengeluaran harian (tepung, minyak, sosis, keju, gas, kemasan) yang otomatis memotong perhitungan Kas Bersih.
- **Manajemen Outlet / Gerobak (`/owner?tab=outlets`)**:
  - Tambah gerobak baru, aktifkan/nonaktifkan operasional gerobak, atau hapus gerobak yang belum memiliki riwayat transaksi.
- **Manajemen Kasir & Reset PIN (`/owner?tab=users`)**:
  - Buat akun kasir baru yang ditugaskan ke gerobak spesifik.
  - **Reset PIN / Password** untuk akun Owner maupun Kasir kapan saja.

---

## 🛠️ Teknologi (*Tech Stack*)

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | Next.js 16.4 (App Router, Turbopack, React 19.3, TypeScript 5) |
| **Styling** | Tailwind CSS v4 + Lucide React Icons |
| **Database** | PostgreSQL (Neon Serverless `@neondatabase/serverless`) |
| **Keamanan & Autentikasi** | PIN 6-Digit dengan Hashing `bcryptjs` (12 salt rounds) + Brute-Force Cooldown |
| **Printer & Dokumen** | Web Bluetooth API (ESC/POS 58mm) + Generator PDF 1.4 Native (58mm Thermal) |
| **Pengujian Beban** | Grafana k6 Load Testing + E2E Integration Script |

---

## 📂 Struktur Direktori

```text
risolpos/
├── public/
│   ├── icon.svg                 # Logo & Favicon Kustom RisolPOS
│   ├── manifest.json            # Konfigurasi PWA Mobile
│   ├── qris-muamalat.svg        # Template Visual QRIS
│   └── sw.js                    # Service Worker PWA
├── scripts/
│   ├── migrate-prod.mjs         # Migrasi skema database produksi (idempotent)
│   ├── reset-db.mjs             # Reset bersih seluruh data database ke kondisi awal
│   ├── test-e2e.mjs             # Pengujian integrasi End-to-End API
│   ├── k6-load-test.js          # Script pengujian beban (Load Test) Grafana k6
│   └── clean-k6-data.mjs        # Pembersih otomatis data uji k6
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/            # POST login verifikasi PIN bcrypt
    │   │   ├── health/          # GET cek koneksi database Neon PostgreSQL
    │   │   ├── outlets/         # GET, POST, PATCH, DELETE cabang gerobak
    │   │   ├── pos/             # GET katalog per gerobak & POST transaksi kasir
    │   │   ├── users/           # GET daftar akun aktif untuk layar login
    │   │   └── owner/
    │   │       ├── expenses/    # GET & POST catatan belanja bahan baku
    │   │       ├── monitoring/  # GET metrik real-time, transaksi, & audit stok
    │   │       ├── products/    # GET, POST, PATCH, DELETE katalog menu risol
    │   │       ├── reconcile/   # PATCH tandai rekonsiliasi mutasi transaksi
    │   │       ├── stock/       # GET matriks stok & POST restock/waste/opname
    │   │       └── users/       # GET, POST, PATCH (Reset PIN), DELETE akun user
    │   ├── login/               # Halaman Login PIN 6-Digit
    │   ├── owner/               # Halaman Dashboard Owner
    │   ├── pos/                 # Halaman Kasir POS
    │   ├── icon.svg             # App Router Icon
    │   └── layout.tsx           # Root Layout & Metadata PWA
    ├── components/
    │   ├── owner/               # Komponen Dashboard Owner (Chart, Tabel Stok, Form)
    │   ├── pos/                 # Komponen Kasir (ProductGrid, CartBar, Modal Bayar)
    │   └── shared/              # TopBar, NavDrawer, ReceiptModal (Struk & PDF), Toast
    ├── hooks/
    │   ├── useCart.ts           # State manajemen keranjang belanja kasir
    │   ├── useMounted.ts        # Helper sesi & hidrasi klien
    │   └── usePrinter.ts        # Integrasi Web Bluetooth Thermal Printer 58mm
    ├── lib/
    │   ├── db.ts                # Koneksi SQL Neon PostgreSQL
    │   └── printer.ts           # Encoder ESC/POS, Generator PDF 58mm, & Format WIB
    └── types/
        └── index.ts             # Definisi tipe data TypeScript
```

---

## 🗄️ Skema Database PostgreSQL

1. **`users`**: Menyimpan akun `OWNER` dan `CASHIER` beserta hash PIN (`pin_code`) dan ikatan gerobak (`outlet_id`).
2. **`outlets`**: Menyimpan data cabang gerobak (`id`, `name`, `address`, `is_active`).
3. **`products`**: Menyimpan master katalog menu risol (`id`, `name`, `price`, `cost_price`, `stock`, `category`, `image_url`, `badge`).
4. **`outlet_stocks`**: Menyimpan jumlah stok spesifik per gerobak dan per produk (`UNIQUE(outlet_id, product_id)`).
5. **`transactions`**: Menyimpan header nota penjualan (`invoice_number`, `outlet_id`, `cashier_name`, `total_amount`, `payment_method`, `cash_received`, `change_amount`, `qris_issuer`, `is_reconciled`).
6. **`transaction_items`**: Menyimpan rincian item risol pada setiap nota transaksi.
7. **`stock_movements`**: Menyimpan buku besar (*ledger*) seluruh pergerakan stok (`IN_RESTOCK`, `OUT_SALE`, `OUT_WASTE`, `ADJUSTMENT`) lengkap dengan `stock_before` dan `stock_after`.
8. **`purchase_expenses`**: Menyimpan catatan belanja bahan baku/kulakan harian.

---

## 🚀 Panduan Instalasi & Menjalankan Secara Lokal

### 1. Prasyarat
- **Node.js** `v20+`
- **pnpm** `v9+` / `v11+`
- Database **PostgreSQL** (Neon Serverless / PostgreSQL standar)

### 2. Konfigurasi Environment (`.env.local`)
Buat file `.env.local` di dalam direktori `risolpos/`:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
```

### 3. Instalasi & Migrasi Database
```bash
cd risolpos
pnpm install

# Jalankan migrasi tabel produksi
pnpm run migrate

# (Opsional) Reset database ke kondisi awal bersih (hanya menyisakan akun Owner)
pnpm run db:reset
```

### 4. Menjalankan Server Development
```bash
pnpm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📋 Urutan Penggunaan Awal (Mulai Jualan dari Database Kosong)

Setelah database di-reset bersih, ikuti 4 langkah mudah berikut untuk mulai berjualan:

1. **Login sebagai Owner**:
   - Buka `/login`, pilih akun **Bos Risol (Owner)** (`username: owner`), lalu masukkan **6 digit PIN Owner** Anda (PIN bawaan awal: `112233` — dapat diubah kapan saja di menu **Kasir & PIN Outlet -> Reset PIN**).
2. **Tambahkan Gerobak / Outlet Pertama**:
   - Masuk ke tab **Outlet** di Dashboard Owner, lalu tambahkan nama gerobak (contoh: `Gerobak 1 - Kampus`).
3. **Tambahkan Menu Risol & Stok Awal**:
   - Masuk ke tab **Katalog Menu Risol**, klik **+ Tambah Menu Baru**, unggah foto risol Anda, isi harga jual, modal HPP, dan stok awal per gerobak.
4. **Buat Akun & PIN Kasir Gerobak**:
   - Masuk ke tab **Kasir & PIN Outlet**, buat akun kasir baru, pilih gerobak tempat kasir bertugas, dan tetapkan 6 digit PIN kasir.
   - Kini kasir dapat login di perangkatnya masing-masing dan langsung melayani transaksi!

---

## 🖨️ Panduan Setting Printer Thermal 58mm & PDF

1. **Printer Bluetooth Thermal 58mm (Rekomendasi Utama)**:
   - Nyalakan printer thermal 58mm dan Bluetooth di HP Android / Tablet / Laptop.
   - Buka aplikasi menggunakan **Google Chrome** atau **Microsoft Edge**.
   - Klik tombol **`Printer Off`** di pojok kanan atas layar -> pilih nama printer Bluetooth Anda -> status akan berubah menjadi **Hijau (Terhubung)**.
2. **Saat Printer Mati / Tidak Dibawa (`Printer Off`)**:
   - Kasir tetap dapat melakukan transaksi seperti biasa.
   - Saat transaksi selesai, aplikasi **otomatis mengunduh struk dalam format PDF ukuran 58mm (`Struk-INV-....pdf`)** dan menampilkan pratinjau struk di layar.
3. **Printer Kabel USB / Wi-Fi**:
   - Pada jendela pratinjau struk, klik tombol **"Cetak Browser"** untuk mencetak melalui dialog printer sistem operasi.

---

## 🧪 Perintah Pengujian & Utilitas (`package.json`)

| Perintah | Deskripsi |
| :--- | :--- |
| `pnpm run dev` | Menjalankan server development Next.js |
| `pnpm run build` | Membangun aplikasi untuk produksi (*production build*) |
| `pnpm run start` | Menjalankan server produksi hasil build |
| `pnpm run lint` | Memeriksa kualitas kode dengan ESLint |
| `pnpm run migrate` | Menjalankan migrasi tabel database secara aman (*idempotent*) |
| `pnpm run db:reset` | Mereset bersih seluruh isi database (menyisakan hanya akun Owner) |
| `pnpm run test:e2e` | Menjalankan pengujian integrasi End-to-End API |
| `pnpm run test:k6` | Menjalankan pengujian beban (*Load Testing*) dengan Grafana k6 |
| `pnpm run test:k6:clean` | Membersihkan data sementara hasil pengujian beban k6 |

---

## 🌐 Panduan Deployment ke Production (Vercel)

1. Push repositori ini ke GitHub / GitLab.
2. Buat proyek baru di **Vercel** dan arahkan *Root Directory* ke `risolpos`.
3. Tambahkan Environment Variable `DATABASE_URL` berisi URL koneksi Neon PostgreSQL Anda.
4. Klik **Deploy** — aplikasi siap diakses melalui HTTPS (mendukung penuh fitur **Web Bluetooth API** dan instalasi **PWA** di layar utama HP kasir).
