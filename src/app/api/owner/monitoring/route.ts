import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get('startDate') ||
      searchParams.get('start') ||
      new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || searchParams.get('end') || startDate
    const outletIdParam = searchParams.get('outletId') || 'ALL'

    const startTimestamp = `${startDate}T00:00:00+07:00`
    const endTimestamp = `${endDate}T23:59:59+07:00`

    // 1. Fetch transactions within WIB date range (including outlet_id & outlet_name)
    const txRows = await sql`
      SELECT 
        t.id,
        t.invoice_number,
        t.user_id,
        t.cashier_name,
        t.outlet_id,
        o.name as outlet_name,
        t.total_amount::int as total_amount,
        t.payment_method,
        t.cash_received::int as cash_received,
        t.change_amount::int as change_amount,
        t.qris_issuer,
        t.is_reconciled,
        t.created_at
      FROM transactions t
      LEFT JOIN outlets o ON o.id = t.outlet_id
      WHERE t.created_at >= ${startTimestamp}::timestamptz 
        AND t.created_at <= ${endTimestamp}::timestamptz
      ORDER BY t.created_at DESC
    `

    // 2. Fetch transaction items for those transactions
    const txIds = txRows.map(t => t.id)
    const itemsByTxId: Record<string, Record<string, unknown>[]> = {}

    if (txIds.length > 0) {
      const items = await sql`
        SELECT 
          id,
          transaction_id,
          product_id::int as product_id,
          product_name,
          qty::int as qty,
          price_at_sale::int as price_at_sale,
          subtotal::int as subtotal
        FROM transaction_items
        WHERE transaction_id = ANY(${txIds})
      `
      for (const item of items) {
        const tid = item.transaction_id as string
        if (!itemsByTxId[tid]) itemsByTxId[tid] = []
        itemsByTxId[tid].push(item)
      }
    }

    const transactions: (Record<string, unknown> & { items: Record<string, unknown>[] })[] =
      txRows.map(t => ({
        ...t,
        items: itemsByTxId[t.id as string] || [],
      }))

    // 3. Fetch purchase expenses
    const expenses = await sql`
      SELECT id, user_id, item_name, qty_description, total_cost::int as total_cost, purchase_date, created_at
      FROM purchase_expenses
      WHERE purchase_date >= ${startDate} AND purchase_date <= ${endDate}
      ORDER BY created_at DESC
    `

    // 4. Fetch outlet_stocks for active outlets
    const outletStocks = await sql`
      SELECT 
        os.outlet_id,
        o.name as outlet_name,
        os.product_id::int as product_id,
        os.stock::int as stock,
        os.updated_at
      FROM outlet_stocks os
      JOIN outlets o ON o.id = os.outlet_id
      WHERE o.is_active = true
      ORDER BY os.outlet_id ASC, os.product_id ASC
    `

    // 5. Fetch current products with live aggregated stock across active outlets
    const rawProducts = await sql`
      SELECT 
        id::int as id,
        name,
        price::int as price,
        cost_price::int as cost_price,
        stock::int as stock,
        is_active,
        category,
        description,
        image_url,
        badge
      FROM products
      ORDER BY id ASC
    `

    const hasActiveOutletStocks = outletStocks.length > 0
    const products = rawProducts.map(p => {
      if (!hasActiveOutletStocks) return p
      const productOutletRows = outletStocks.filter(os => Number(os.product_id) === Number(p.id))
      if (productOutletRows.length === 0) return p
      const totalOutletStock = productOutletRows.reduce(
        (sum, os) => sum + (Number(os.stock) || 0),
        0
      )
      return {
        ...p,
        stock: totalOutletStock,
      }
    })

    // 6. Fetch stock movements within WIB date range
    const stockMovements = await sql`
      SELECT 
        sm.id,
        sm.product_id::int as product_id,
        COALESCE(p.name, 'Menu Terhapus') as product_name,
        sm.outlet_id,
        COALESCE(o.name, sm.outlet_id) as outlet_name,
        sm.user_id,
        sm.movement_type,
        sm.qty_change::int as qty_change,
        sm.stock_before::int as stock_before,
        sm.stock_after::int as stock_after,
        sm.notes,
        sm.created_at
      FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      LEFT JOIN outlets o ON o.id = sm.outlet_id
      WHERE sm.created_at >= ${startTimestamp}::timestamptz
        AND sm.created_at <= ${endTimestamp}::timestamptz
      ORDER BY sm.created_at DESC
    `

    // 7. Compute stockAudit per product (filtered by outletIdParam if specified)
    const stockAudit = products.map(p => {
      const pid = Number(p.id)

      // Current stock for this product (per outlet or total across all active outlets)
      let currentStock = Number(p.stock) || 0
      if (outletIdParam && outletIdParam !== 'ALL') {
        const osRow = outletStocks.find(
          os => os.outlet_id === outletIdParam && Number(os.product_id) === pid
        )
        currentStock = osRow ? Number(osRow.stock) || 0 : 0
      }

      // Filter movements for this product & outlet
      const prodMovements = stockMovements.filter(sm => {
        if (Number(sm.product_id) !== pid) return false
        if (outletIdParam && outletIdParam !== 'ALL' && sm.outlet_id !== outletIdParam) {
          return false
        }
        return true
      })

      let inRestock = 0
      let outSale = 0
      let outWaste = 0
      let adjustment = 0

      for (const sm of prodMovements) {
        const qty = Number(sm.qty_change) || 0
        if (sm.movement_type === 'IN_RESTOCK') {
          inRestock += Math.abs(qty)
        } else if (sm.movement_type === 'OUT_SALE') {
          outSale += Math.abs(qty)
        } else if (sm.movement_type === 'OUT_WASTE') {
          outWaste += Math.abs(qty)
        } else if (sm.movement_type === 'ADJUSTMENT') {
          adjustment += qty
        }
      }

      // Cross-check sold qty from transactions in case any legacy tx didn't write OUT_SALE movement
      let txSoldQty = 0
      for (const tx of transactions) {
        if (outletIdParam && outletIdParam !== 'ALL' && tx.outlet_id !== outletIdParam) {
          continue
        }
        const txItems = (tx.items as Record<string, unknown>[]) || []
        for (const item of txItems) {
          if (Number(item.product_id) === pid) {
            txSoldQty += Number(item.qty) || 0
          }
        }
      }
      if (txSoldQty > outSale) {
        outSale = txSoldQty
      }

      // Expected stock before physical opname adjustment = currentStock - adjustment
      const expectedStock = Math.max(0, currentStock - adjustment)
      const hasDiscrepancy = currentStock !== expectedStock

      return {
        productId: pid,
        name: String(p.name),
        currentStock,
        inRestock,
        outSale,
        outWaste,
        adjustment,
        expectedStock,
        hasDiscrepancy,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        expenses,
        products,
        outletStocks,
        stockMovements,
        stockAudit,
        serverTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API Owner Monitoring] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data monitoring' },
      { status: 500 }
    )
  }
}
