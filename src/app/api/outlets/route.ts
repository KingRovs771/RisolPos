import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const outlets = await sql`
      SELECT 
        o.id,
        o.name,
        o.address,
        o.is_active,
        COALESCE(SUM(os.stock), 0)::int as total_stock
      FROM outlets o
      LEFT JOIN outlet_stocks os ON o.id = os.outlet_id
      GROUP BY o.id, o.name, o.address, o.is_active, o.created_at
      ORDER BY o.created_at ASC, o.id ASC;
    `

    return NextResponse.json({ success: true, data: outlets })
  } catch (error) {
    console.error('[API Outlets Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data outlet' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const address = String(body.address || '').trim()

    if (name.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Nama outlet minimal 2 karakter' },
        { status: 400 }
      )
    }

    const dup = await sql`SELECT id FROM outlets WHERE LOWER(name) = LOWER(${name}) LIMIT 1`
    if (dup.length > 0) {
      return NextResponse.json(
        { success: false, message: `Outlet "${name}" sudah ada` },
        { status: 400 }
      )
    }

    const id = `outlet-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`
    await sql`
      INSERT INTO outlets (id, name, address, is_active)
      VALUES (${id}, ${name}, ${address || null}, true)
    `
    await sql`
      INSERT INTO outlet_stocks (outlet_id, product_id, stock, updated_at)
      SELECT ${id}, p.id, 0, NOW() FROM products p
      ON CONFLICT (outlet_id, product_id) DO NOTHING
    `

    return NextResponse.json({
      success: true,
      data: { id, name, address, is_active: true },
      message: `Outlet "${name}" berhasil ditambahkan`,
    })
  } catch (error) {
    console.error('[API Outlets POST Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan outlet' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, is_active } = body
    if (!id || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'ID outlet dan status wajib diisi' },
        { status: 400 }
      )
    }
    await sql`UPDATE outlets SET is_active = ${is_active} WHERE id = ${id}`
    return NextResponse.json({
      success: true,
      message: is_active ? 'Outlet diaktifkan' : 'Outlet dinonaktifkan',
    })
  } catch (error) {
    console.error('[API Outlets PATCH Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengubah status outlet' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID outlet wajib disertakan' },
        { status: 400 }
      )
    }

    const tx = await sql`SELECT 1 FROM transactions WHERE outlet_id = ${id} LIMIT 1`
    if (tx.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Outlet sudah memiliki riwayat penjualan, tidak bisa dihapus. Nonaktifkan saja.',
        },
        { status: 400 }
      )
    }

    await sql`DELETE FROM stock_movements WHERE outlet_id = ${id}`
    await sql`DELETE FROM outlet_stocks WHERE outlet_id = ${id}`
    await sql`DELETE FROM outlets WHERE id = ${id}`
    return NextResponse.json({ success: true, message: 'Outlet berhasil dihapus' })
  } catch (error) {
    console.error('[API Outlets DELETE Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus outlet' },
      { status: 500 }
    )
  }
}
