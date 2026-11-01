import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outletId = searchParams.get('outletId')

    if (outletId) {
      const stocks = await sql`
        SELECT 
          p.id as product_id,
          p.name,
          COALESCE(os.stock, 0)::int as stock
        FROM products p
        LEFT JOIN outlet_stocks os ON p.id = os.product_id AND os.outlet_id = ${outletId}
        WHERE p.is_active = true
        ORDER BY p.id ASC;
      `
      return NextResponse.json({ success: true, data: stocks, outletId })
    }

    // Return complete matrix across all outlets
    const matrix = await sql`
      SELECT 
        o.id as outlet_id,
        o.name as outlet_name,
        p.id as product_id,
        p.name as product_name,
        COALESCE(os.stock, 0)::int as stock
      FROM outlets o
      CROSS JOIN products p
      LEFT JOIN outlet_stocks os ON o.id = os.outlet_id AND p.id = os.product_id
      WHERE p.is_active = true AND o.is_active = true
      ORDER BY o.id ASC, p.id ASC;
    `

    return NextResponse.json({ success: true, data: matrix })
  } catch (error) {
    console.error('[API Owner Stock GET] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data stok outlet' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      productId,
      outletId = 'outlet-1',
      userId,
      movementType,
      type,
      qtyChange,
      notes,
    } = body

    const actualType = movementType || type

    if (!productId || typeof qtyChange !== 'number' || !actualType) {
      return NextResponse.json(
        { success: false, message: 'Parameter tidak lengkap' },
        { status: 400 }
      )
    }

    // Check current stock in outlet_stocks
    const outletStockRow = await sql`
      SELECT stock FROM outlet_stocks WHERE outlet_id = ${outletId} AND product_id = ${productId}
    `

    let currentStock = 0
    if (outletStockRow.length > 0) {
      currentStock = outletStockRow[0]?.stock ?? 0
    } else {
      // Fallback to products table
      const pRow = await sql`SELECT stock FROM products WHERE id = ${productId}`
      currentStock = pRow[0]?.stock ?? 0
    }

    const newStock = Math.max(0, currentStock + qtyChange)

    // Upsert into outlet_stocks
    await sql`
      INSERT INTO outlet_stocks (outlet_id, product_id, stock, updated_at)
      VALUES (${outletId}, ${productId}, ${newStock}, NOW())
      ON CONFLICT (outlet_id, product_id)
      DO UPDATE SET stock = ${newStock}, updated_at = NOW();
    `

    // Also update global product stock
    await sql`
      UPDATE products
      SET stock = (
        SELECT COALESCE(SUM(stock), 0)::int FROM outlet_stocks WHERE product_id = ${productId}
      )
      WHERE id = ${productId}
    `

    // Log movement with outlet_id
    const moveId = `sm-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    await sql`
      INSERT INTO stock_movements (
        id, product_id, outlet_id, user_id, movement_type, qty_change, stock_before, stock_after, notes
      ) VALUES (
        ${moveId}, ${productId}, ${outletId}, ${userId || null}, ${actualType}, ${qtyChange},
        ${currentStock}, ${newStock}, ${notes || null}
      )
    `

    return NextResponse.json({
      success: true,
      data: {
        productId,
        outletId,
        stock_before: currentStock,
        stock_after: newStock,
      },
    })
  } catch (error) {
    console.error('[API Owner Stock POST] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengubah stok outlet' },
      { status: 500 }
    )
  }
}
