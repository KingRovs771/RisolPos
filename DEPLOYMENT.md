# 🚀 Panduan Deploy Production — RisolPOS

Aplikasi **RisolPOS** (Next.js 16 App Router + Neon Postgres Serverless) telah dioptimasi secara penuh dan siap untuk di-deploy ke lingkungan produksi (Vercel, Railway, Render, Docker/Cloud Run, atau VPS).

---

## ⚡ 1. Rekomendasi Deploy: Vercel (1-Click Deploy)

Vercel adalah platform hosting resmi untuk Next.js dengan dukungan serverless connection pooling ke Neon Postgres di region `ap-southeast-1` (Singapura):

### Langkah-langkah Deploy:
1. Hubungkan repositori Git ke **Vercel Dashboard**.
2. Set **Root Directory**: `risolpos`.
3. Di bagian **Environment Variables**, tambahkan:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>/neondb?sslmode=require&channel_binding=require
   ```
4. Set **Build Command**: `pnpm build`
5. Klik **Deploy**!

---

## 🗄️ 2. Migrasi Database Produksi (Idempotent)

Database Neon Postgres sudah termigrasi secara live. Jika ingin memverifikasi atau menjalankan ulang skema tabel di server baru:

```bash
# Jalankan migrasi idempotent produksi
pnpm run migrate
```

Skema yang otomatis dikonfigurasi:
- `users`: Akun Owner (`owner`) & Kasir (`kasir`) terenkripsi bcrypt salt rounds 12.
- `outlets`: 3 cabang gerobak (`Kampus Pusat`, `Stasiun Sudirman`, `Pasar Pagi Modern`).
- `products`: 4 varian menu risol bawaan.
- `outlet_stocks`: Alokasi stok fisik masing-masing gerobak.
- `transactions` & `transaction_items`: Riwayat transaksi dan nota kasir.
- `stock_movements`: Audit jejak restock, rusak (waste), opname fisik, dan transfer antar gerobak.
- `purchase_expenses`: Catatan belanja bahan baku dan operasional.

---

## 🐳 3. Deploy Menggunakan Docker / Container

Tersedia multi-stage `Dockerfile` ringan berbasis Alpine Linux untuk cloud hosting container (Google Cloud Run, AWS ECS, Railway, VPS):

```bash
# 1. Build image docker
docker build -t risolpos:latest .

# 2. Jalankan container dengan environment Neon Postgres
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://<user>:<password>@<host>/neondb?sslmode=require&channel_binding=require" \
  --name risolpos-app \
  risolpos:latest
```

---

## 🔐 4. Kredensial Akun Bawaan (Default Production Accounts)

| Akun | Username | Peran | PIN Default | Deskripsi |
|---|---|---|---|---|
| **Kasir Shift** | `kasir` | `CASHIER` | `112233` | Layar kasir POS, penjualan, print struk, pilih gerobak |
| **Bos Risol** | `owner` | `OWNER` | `112233` | Dashboard metrik, audit fisik, restock, kulakan, kelola user |

> **Catatan Keamanan & Akses**:
> - Karyawan dengan peran `CASHIER` **tidak memiliki akses** ke Dashboard Owner.
> - Pemilik usaha (`OWNER`) dapat menambah akun kasir baru kapan saja melalui tab **"Kelola Karyawan"** di Dashboard Owner dengan PIN 6 digit yang di-hash bcrypt.
> - Database produksi dalam kondisi **bersih (clean slate)** tanpa data dummy transaksi.

---

## 🖨️ 5. Penggunaan Printer Thermal 58mm di Produksi

1. **Protokol Web Bluetooth (GATT)**:
   - Wajib berjalan di protokol **HTTPS** (otomatis aktif di Vercel/Cloud).
   - Buka menu kasir di Google Chrome (Android/Windows/Mac), klik **"Hubungkan Printer"**, lalu pilih printer Bluetooth thermal 58mm (misal: RPP02N, Panda, Iware, MPT-II).
2. **Fallback RawBT Android Intent**:
   - Jika printer Bluetooth tidak terdeteksi via browser, sistem otomatis menawarkan cetak struk via aplikasi **RawBT Print Service** di ponsel Android.

---

## 🧪 6. Pengujian & Verifikasi Kualitas Otomatis

Sebelum rilis atau update versi, jalankan checklist verifikasi:

```bash
# 1. Cek tipe data strict (0 error)
pnpm exec tsc --noEmit

# 2. Cek linter (0 warning, 0 error)
pnpm run lint

# 3. Kompilasi production bundle
pnpm run build

# 4. Uji seluruh API live end-to-end
pnpm run test:e2e
```
