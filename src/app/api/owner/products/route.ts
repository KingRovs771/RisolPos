import { NextResponse, connection } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  await connection()
  try {
    const products = await sql`
      SELECT 
        id, 
        name, 
        price, 
        cost_price, 
        stock, 
        is_active, 
        category, 
        description, 
        image_url, 
        badge, 
        created_at
      FROM products
      ORDER BY id ASC;
    `

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('[API Owner Products GET Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data produk menu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      price,
      cost_price = 0,
      category = 'Best Seller',
      description = '',
      badge = '',
      image_url = '',
      initial_stock_per_outlet = 0,
      user_id = 'user-owner',
    } = body

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { success: false, message: 'Nama menu dan harga jual wajib diisi' },
        { status: 400 }
      )
    }

    const cleanName = String(name).trim()
    const numPrice = Math.max(0, parseInt(String(price), 10) || 0)
    const numCostPrice = Math.max(0, parseInt(String(cost_price), 10) || 0)
    const numInitialStock = Math.max(0, parseInt(String(initial_stock_per_outlet), 10) || 0)

    if (cleanName.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Nama menu minimal 2 karakter' },
        { status: 400 }
      )
    }

    // Check duplicate name
    const existing = await sql`
      SELECT id FROM products WHERE LOWER(name) = LOWER(${cleanName}) LIMIT 1;
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Menu "${cleanName}" sudah terdaftar` },
        { status: 400 }
      )
    }

    // Insert new product
    const inserted = await sql`
      INSERT INTO products (
        name, 
        price, 
        cost_price, 
        stock, 
        is_active, 
        category, 
        description, 
        image_url, 
        badge, 
        created_at
      )
      VALUES (
        ${cleanName}, 
        ${numPrice}, 
        ${numCostPrice}, 
        ${numInitialStock}, 
        true, 
        ${category || 'Best Seller'}, 
        ${description || ''}, 
        ${image_url || null}, 
        ${badge || null}, 
        NOW()
      )
      RETURNING *;
    `

    const newProduct = inserted[0]
    const newProductId = newProduct.id

    // Allocate initial stock to all active outlets
    const activeOutlets = await sql`SELECT id FROM outlets WHERE is_active = true;`

    for (const out of activeOutlets) {
      await sql`
        INSERT INTO outlet_stocks (outlet_id, product_id, stock, updated_at)
        VALUES (${out.id}, ${newProductId}, ${numInitialStock}, NOW())
        ON CONFLICT (outlet_id, product_id) DO UPDATE SET stock = EXCLUDED.stock;
      `

      if (numInitialStock > 0) {
        const moveId = `mov-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
        await sql`
          INSERT INTO stock_movements (
            id, product_id, outlet_id, user_id, movement_type, qty_change, stock_before, stock_after, notes, created_at
          ) VALUES (
            ${moveId}, ${newProductId}, ${out.id}, ${user_id}, 'IN_RESTOCK', ${numInitialStock}, 0, ${numInitialStock}, 'Stok Awal Menu Baru', NOW()
          );
        `
      }
    }

    if (activeOutlets.length > 0) {
      await sql`
        UPDATE products
        SET stock = (
          SELECT COALESCE(SUM(stock), 0)::int FROM outlet_stocks WHERE product_id = ${newProductId}
        )
        WHERE id = ${newProductId};
      `
    }

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: `Menu baru "${cleanName}" berhasil ditambahkan ke semua gerobak!`,
    })
  } catch (error) {
    console.error('[API Owner Products POST Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan produk menu baru' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, price, cost_price, is_active, category, description, badge, image_url } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID produk wajib disertakan' },
        { status: 400 }
      )
    }

    const productId = parseInt(String(id), 10)

    const existing = await sql`SELECT * FROM products WHERE id = ${productId} LIMIT 1;`
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    const current = existing[0]

    const newName = name !== undefined ? String(name).trim() : current.name
    const newPrice = price !== undefined ? Math.max(0, parseInt(String(price), 10)) : current.price
    const newCostPrice = cost_price !== undefined ? Math.max(0, parseInt(String(cost_price), 10)) : current.cost_price
    const newIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active
    const newCategory = category !== undefined ? String(category) : current.category
    const newDescription = description !== undefined ? String(description) : current.description
    const newBadge = badge !== undefined ? String(badge) : current.badge
    const newImage = image_url !== undefined ? (image_url ? String(image_url) : null) : current.image_url

    const updated = await sql`
      UPDATE products SET
        name = ${newName},
        price = ${newPrice},
        cost_price = ${newCostPrice},
        is_active = ${newIsActive},
        category = ${newCategory},
        description = ${newDescription},
        badge = ${newBadge},
        image_url = ${newImage}
      WHERE id = ${productId}
      RETURNING *;
    `

    return NextResponse.json({
      success: true,
      data: updated[0],
      message: `Menu "${newName}" berhasil diperbarui`,
    })
  } catch (error) {
    console.error('[API Owner Products PATCH Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui menu' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = parseInt(searchParams.get('id') || '', 10)
    if (!productId) {
      return NextResponse.json({ success: false, message: 'ID produk wajib disertakan' }, { status: 400 })
    }
    const existing = await sql`SELECT name FROM products WHERE id = ${productId}`
    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 })
    }
    await sql`DELETE FROM stock_movements WHERE product_id = ${productId}`
    await sql`DELETE FROM outlet_stocks WHERE product_id = ${productId}`
    await sql`DELETE FROM products WHERE id = ${productId}`
    return NextResponse.json({ success: true, message: `Menu "${existing[0].name}" berhasil dihapus` })
  } catch (error) {
    console.error('[API Owner Products DELETE Error]:', error)
    return NextResponse.json({ success: false, message: 'Gagal menghapus menu' }, { status: 500 })
  }
}
