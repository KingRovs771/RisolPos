import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, pin } = body

    if (!username || !pin) {
      return NextResponse.json(
        { success: false, message: 'Username dan PIN wajib diisi' },
        { status: 400 }
      )
    }

    const users = await sql`
      SELECT u.id, u.username, u.name, u.role, u.pin_code, u.outlet_id, o.name AS outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.username = ${username}
      LIMIT 1
    `

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Username atau PIN salah' },
        { status: 401 }
      )
    }

    const user = users[0]!
    const isValid = await bcrypt.compare(pin, user.pin_code as string)

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Username atau PIN salah' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        username: user.username,
        outlet_id: user.outlet_id || null,
        outlet_name: user.outlet_name || null,
      },
    })
  } catch (error) {
    console.error('[API Auth] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
