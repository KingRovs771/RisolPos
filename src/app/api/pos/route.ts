import { NextResponse, connection } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
  await connection()
  const { searchParams } = new URL(request.url)
  const outletId = searchParams.get('outletId') || 'outlet-1'

  try {

    const products = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.price, 
        p.cost_price, 
        COALESCE(os.stock, p.stock)::int as stock, 
        p.is_active,
        p.category,
        p.description,
        p.image_url,
        p.badge
      FROM products p
      LEFT JOIN outlet_stocks os ON p.id = os.product_id AND os.outlet_id = ${outletId}
      WHERE p.is_active = true
      ORDER BY p.id ASC
    `
    return NextResponse.json({ success: true, data: products, outletId })
  } catch (error) {
    console.error('[API POS GET] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat produk dari database' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      invoiceNumber,
      userId,
      cashierName,
      paymentMethod,
      cashReceived,
      changeAmount,
      qrisIssuer,
      items,
      outletId = 'outlet-1',
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Keranjang belanja tidak boleh kosong' },
        { status: 400 }
      )
    }

    const txId = `tx-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const totalAmount = items.reduce(
      (acc: number, item: { qty: number; price: number }) => acc + item.qty * item.price,
      0
    )

    // Insert transaction record with outlet_id
    await sql`
      INSERT INTO transactions (
        id, invoice_number, user_id, cashier_name, outlet_id, total_amount, payment_method,
        cash_received, change_amount, qris_issuer, is_reconciled
      ) VALUES (
        ${txId}, ${invoiceNumber}, ${userId || null}, ${cashierName || 'Kasir'}, ${outletId},
        ${totalAmount}, ${paymentMethod}, ${cashReceived || null},
        ${changeAmount || null}, ${qrisIssuer || null}, false
      )
    `

    // Process items and stock deduction
    for (const item of items) {
      const itemId = `ti-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

      // Insert transaction item
      await sql`
        INSERT INTO transaction_items (
          id, transaction_id, product_id, product_name, qty, price_at_sale, subtotal
        ) VALUES (
          ${itemId}, ${txId}, ${item.productId}, ${item.name}, ${item.qty}, ${item.price}, ${item.subtotal || item.qty * item.price}
        )
      `

      // Fetch current outlet stock (fallback to products.stock if outlet_stocks row doesn't exist yet)
      const outletStockRow = await sql`
        SELECT stock FROM outlet_stocks WHERE outlet_id = ${outletId} AND product_id = ${item.productId}
      `
      let currentOutletStock = 0
      if (outletStockRow.length > 0) {
        currentOutletStock = Number(outletStockRow[0]?.stock ?? 0)
      } else {
        const pRow = await sql`SELECT stock FROM products WHERE id = ${item.productId}`
        currentOutletStock = Number(pRow[0]?.stock ?? 0)
      }
      const nextOutletStock = Math.max(0, currentOutletStock - item.qty)

      // Update outlet stock
      await sql`
        INSERT INTO outlet_stocks (outlet_id, product_id, stock, updated_at)
        VALUES (${outletId}, ${item.productId}, ${nextOutletStock}, NOW())
        ON CONFLICT (outlet_id, product_id)
        DO UPDATE SET stock = ${nextOutletStock}, updated_at = NOW();
      `

      // Sync master products stock with sum of active outlet_stocks
      await sql`
        UPDATE products
        SET stock = (
          SELECT COALESCE(SUM(os.stock), 0)::int
          FROM outlet_stocks os
          JOIN outlets o ON o.id = os.outlet_id
          WHERE os.product_id = ${item.productId} AND o.is_active = true
        )
        WHERE id = ${item.productId}
      `

      // Record stock movement
      const moveId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      await sql`
        INSERT INTO stock_movements (
          id, product_id, outlet_id, user_id, movement_type, qty_change, stock_before, stock_after, notes
        ) VALUES (
          ${moveId}, ${item.productId}, ${outletId}, ${userId || null}, 'OUT_SALE', ${-item.qty},
          ${currentOutletStock}, ${nextOutletStock}, ${`Penjualan Nota ${invoiceNumber}`}
        )
      `
    }

    return NextResponse.json({
      success: true,
      data: {
        id: txId,
        invoiceNumber,
        totalAmount,
        outletId,
      },
    })
  } catch (error) {
    console.error('[API POS POST] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memproses transaksi kasir' },
      { status: 500 }
    )
  }
}
