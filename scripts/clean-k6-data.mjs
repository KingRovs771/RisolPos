import fs from 'node:fs'
import { neon } from '@neondatabase/serverless'

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

async function cleanK6Data() {
  console.log('🧹 Membersihkan data pengujian k6 dari database...')

  // 1. Delete transaction_items and transactions with RSL-K6-%
  await sql`
    DELETE FROM transaction_items
    WHERE transaction_id IN (
      SELECT id FROM transactions WHERE invoice_number LIKE 'RSL-K6-%'
    )
  `
  await sql`DELETE FROM transactions WHERE invoice_number LIKE 'RSL-K6-%'`

  // 2. Delete stock_movements & outlet_stocks for K6 test outlets or products
  await sql`
    DELETE FROM stock_movements
    WHERE notes LIKE '%k6%' OR notes LIKE '%K6%'
       OR outlet_id IN (SELECT id FROM outlets WHERE name LIKE 'Gerobak K6 Test%')
       OR product_id IN (SELECT id FROM products WHERE name LIKE 'Risol Mayo K6%')
  `
  await sql`
    DELETE FROM outlet_stocks
    WHERE outlet_id IN (SELECT id FROM outlets WHERE name LIKE 'Gerobak K6 Test%')
       OR product_id IN (SELECT id FROM products WHERE name LIKE 'Risol Mayo K6%')
  `

  // 3. Delete K6 test users, products, and outlets
  await sql`DELETE FROM users WHERE username LIKE 'kasir_k6_%'`
  await sql`DELETE FROM products WHERE name LIKE 'Risol Mayo K6%'`
  await sql`DELETE FROM outlets WHERE name LIKE 'Gerobak K6 Test%'`

  // 4. Reset product sequence if products table is empty
  const remainingProducts = await sql`SELECT COUNT(*)::int as cnt FROM products`
  if (remainingProducts[0]?.cnt === 0) {
    await sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`
  }

  console.log('✅ Data pengujian k6 berhasil dibersihkan!')
}

cleanK6Data().catch(err => {
  console.error('❌ Gagal membersihkan data k6:', err)
  process.exit(1)
})

