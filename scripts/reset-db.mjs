import fs from 'node:fs'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    const envContent = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m)
    if (match) return match[1]
  } catch {
    // ignore
  }
  throw new Error('DATABASE_URL belum diatur di environment atau .env.local')
}

const sql = neon(getDatabaseUrl())

async function resetDatabase() {
  console.log('🔄 Memulai Reset Database RisolPOS (Clean Production State)...')

  // 1. Hapus seluruh data transaksi, pergerakan stok, stok outlet, kulakan, menu, kasir, dan outlet
  await sql`DELETE FROM transaction_items`
  await sql`DELETE FROM transactions`
  await sql`DELETE FROM stock_movements`
  await sql`DELETE FROM outlet_stocks`
  await sql`DELETE FROM purchase_expenses`
  await sql`DELETE FROM products`
  await sql`DELETE FROM users WHERE role != 'OWNER'`
  await sql`UPDATE users SET outlet_id = NULL WHERE role = 'OWNER'`
  await sql`DELETE FROM outlets`

  // 2. Reset sequence ID kembali ke 1
  await sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`
  await sql`ALTER SEQUENCE outlet_stocks_id_seq RESTART WITH 1`

  // 3. Pastikan akun Owner tersedia
  const ownerRows = await sql`SELECT id, username, name, role, pin_code FROM users WHERE role = 'OWNER' LIMIT 1`
  let activePinInfo = 'Sesuai PIN Owner Anda'

  if (ownerRows.length === 0) {
    const defaultPin = '112233'
    const pinHash = await bcrypt.hash(defaultPin, 12)
    await sql`
      INSERT INTO users (id, username, name, role, pin_code)
      VALUES ('user-owner', 'owner', 'Bos Risol (Owner)', 'OWNER', ${pinHash})
    `
    activePinInfo = defaultPin
  } else {
    const owner = ownerRows[0]
    if (await bcrypt.compare('112233', owner.pin_code)) {
      activePinInfo = '112233'
    } else if (await bcrypt.compare('999999', owner.pin_code)) {
      activePinInfo = '999999'
    }
  }

  // 4. Verifikasi jumlah baris semua tabel
  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users_count,
      (SELECT COUNT(*)::int FROM outlets) AS outlets_count,
      (SELECT COUNT(*)::int FROM products) AS products_count,
      (SELECT COUNT(*)::int FROM outlet_stocks) AS outlet_stocks_count,
      (SELECT COUNT(*)::int FROM transactions) AS transactions_count,
      (SELECT COUNT(*)::int FROM stock_movements) AS stock_movements_count,
      (SELECT COUNT(*)::int FROM purchase_expenses) AS expenses_count
  `

  console.log('✅ Database berhasil di-reset bersih!')
  console.log('📊 Status Tabel Saat Ini:', counts[0])
  console.log(`🔑 Akun Owner Aktif: username="owner" | PIN=${activePinInfo}`)
}

resetDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Gagal mereset database:', err)
    process.exit(1)
  })

