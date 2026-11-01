import { NextResponse, connection } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
  await connection()
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  try {

    let expenses
    if (date) {
      expenses = await sql`
        SELECT id, user_id, item_name, qty_description, total_cost, purchase_date, created_at
        FROM purchase_expenses
        WHERE purchase_date = ${date}
        ORDER BY created_at DESC
      `
    } else {
      expenses = await sql`
        SELECT id, user_id, item_name, qty_description, total_cost, purchase_date, created_at
        FROM purchase_expenses
        ORDER BY created_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error('[API Owner Expenses GET] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data kulakan' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, itemName, qtyDescription, totalCost, purchaseDate } = body

    if (!itemName || typeof totalCost !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Nama bahan dan total biaya wajib diisi' },
        { status: 400 }
      )
    }

    const expId = id || `exp-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const pDate = purchaseDate || new Date().toISOString().split('T')[0]

    await sql`
      INSERT INTO purchase_expenses (
        id, user_id, item_name, qty_description, total_cost, purchase_date
      ) VALUES (
        ${expId}, ${userId || null}, ${itemName}, ${qtyDescription || null},
        ${totalCost}, ${pDate}
      )
    `

    return NextResponse.json({
      success: true,
      data: {
        id: expId,
        itemName,
        totalCost,
        purchaseDate: pDate,
      },
    })
  } catch (error) {
    console.error('[API Owner Expenses POST] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan catatan kulakan' },
      { status: 500 }
    )
  }
}
