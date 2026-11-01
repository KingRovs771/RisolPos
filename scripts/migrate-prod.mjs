import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envContent = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) return match[1];
  } catch {
    // ignore
  }
  throw new Error('DATABASE_URL belum diatur di environment atau .env.local');
}

const sql = neon(getDatabaseUrl());

async function migrateProduction() {
  console.log('🚀 Running Production Idempotent Database Migration on Neon Postgres...');

  // 1. Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'CASHIER')),
      pin_code VARCHAR(100) NOT NULL,
      outlet_id VARCHAR(50) REFERENCES outlets(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Ensure outlet_id exists in users table if table already existed
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'outlet_id'
      ) THEN
        ALTER TABLE users ADD COLUMN outlet_id VARCHAR(50) REFERENCES outlets(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `;

  // 2. Outlets table
  await sql`
    CREATE TABLE IF NOT EXISTS outlets (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      address VARCHAR(200),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 3. Products table
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      price INT NOT NULL CHECK (price >= 0),
      cost_price INT NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
      stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
      is_active BOOLEAN NOT NULL DEFAULT true,
      category VARCHAR(50),
      description TEXT,
      image_url TEXT,
      badge VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 4. Outlet Stocks table
  await sql`
    CREATE TABLE IF NOT EXISTS outlet_stocks (
      id SERIAL PRIMARY KEY,
      outlet_id VARCHAR(50) REFERENCES outlets(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE CASCADE,
      stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(outlet_id, product_id)
    );
  `;

  // 5. Transactions table
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      user_id VARCHAR(50),
      cashier_name VARCHAR(100),
      outlet_id VARCHAR(50) REFERENCES outlets(id),
      total_amount INT NOT NULL CHECK (total_amount >= 0),
      payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS_MUAMALAT')),
      cash_received INT,
      change_amount INT,
      qris_issuer VARCHAR(50),
      is_reconciled BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Ensure outlet_id exists if transactions table already existed
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='outlet_id') THEN
        ALTER TABLE transactions ADD COLUMN outlet_id VARCHAR(50) REFERENCES outlets(id);
      END IF;
    END $$;
  `;

  // 6. Transaction Items table
  await sql`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id VARCHAR(50) PRIMARY KEY,
      transaction_id VARCHAR(50) REFERENCES transactions(id) ON DELETE CASCADE,
      product_id INT,
      product_name VARCHAR(100) NOT NULL,
      qty INT NOT NULL CHECK (qty > 0),
      price_at_sale INT NOT NULL CHECK (price_at_sale >= 0),
      subtotal INT NOT NULL CHECK (subtotal >= 0)
    );
  `;

  // 7. Stock Movements table
  await sql`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(50) PRIMARY KEY,
      product_id INT REFERENCES products(id),
      outlet_id VARCHAR(50) REFERENCES outlets(id),
      user_id VARCHAR(50),
      movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN_RESTOCK', 'OUT_SALE', 'OUT_WASTE', 'ADJUSTMENT')),
      qty_change INT NOT NULL,
      stock_before INT NOT NULL,
      stock_after INT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Ensure outlet_id exists in stock_movements
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='outlet_id') THEN
        ALTER TABLE stock_movements ADD COLUMN outlet_id VARCHAR(50) REFERENCES outlets(id);
      END IF;
    END $$;
  `;

  // 8. Purchase Expenses table
  await sql`
    CREATE TABLE IF NOT EXISTS purchase_expenses (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50),
      item_name VARCHAR(150) NOT NULL,
      qty_description VARCHAR(100),
      total_cost INT NOT NULL CHECK (total_cost >= 0),
      purchase_date VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Seed owner account only (no demo outlets, cashiers, or products)
  const pinHash = await bcrypt.hash('112233', 12);
  await sql`INSERT INTO users (id, username, name, role, pin_code) VALUES ('user-owner', 'owner', 'Bos Risol (Owner)', 'OWNER', ${pinHash}) ON CONFLICT (username) DO NOTHING;`;

  // Synchronize serial sequences
  await sql`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1)) FROM products;`;
  await sql`SELECT setval(pg_get_serial_sequence('outlet_stocks', 'id'), COALESCE(MAX(id), 1)) FROM outlet_stocks;`;

  console.log('✅ Production migration and seeding verified successfully!');
}

migrateProduction()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Production migration failed:', err);
    process.exit(1);
  });
