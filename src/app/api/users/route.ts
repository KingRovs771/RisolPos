import { NextResponse, connection } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  await connection()
  try {
    const users = await sql`
      SELECT u.id, u.username, u.name, u.role, u.outlet_id, o.name AS outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      ORDER BY u.role DESC, u.name ASC;
    `

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('[API Users Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data user' },
      { status: 500 }
    )
  }
}
