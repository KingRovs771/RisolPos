import { NextResponse, connection } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'

export async function GET() {
  await connection()
  try {
    const users = await sql`
      SELECT u.id, u.username, u.name, u.role, u.outlet_id, o.name AS outlet_name, u.created_at
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      ORDER BY u.role DESC, u.created_at ASC;
    `

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('[API Owner Users GET Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data user karyawan' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, name, role, pin, outlet_id } = body

    if (!username || !name || !role || !pin) {
      return NextResponse.json(
        { success: false, message: 'Username, Nama, Role, dan PIN wajib diisi' },
        { status: 400 }
      )
    }

    const cleanUsername = String(username).trim().toLowerCase()
    const cleanName = String(name).trim()
    const cleanPin = String(pin).trim()
    const cleanRole = role === 'OWNER' ? 'OWNER' : 'CASHIER'
    const cleanOutletId = outlet_id ? String(outlet_id).trim() : null

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Username minimal 3 karakter' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json(
        { success: false, message: 'PIN harus berupa 6 digit angka' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existing = await sql`
      SELECT id FROM users WHERE username = ${cleanUsername} LIMIT 1;
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Username "${cleanUsername}" sudah digunakan` },
        { status: 400 }
      )
    }

    const pinCodeHash = await bcrypt.hash(cleanPin, 12)
    const newUserId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`

    await sql`
      INSERT INTO users (id, username, name, role, pin_code, outlet_id, created_at)
      VALUES (${newUserId}, ${cleanUsername}, ${cleanName}, ${cleanRole}, ${pinCodeHash}, ${cleanOutletId}, NOW());
    `

    return NextResponse.json({
      success: true,
      data: {
        id: newUserId,
        username: cleanUsername,
        name: cleanName,
        role: cleanRole,
        outlet_id: cleanOutletId,
      },
      message: `User ${cleanName} berhasil ditambahkan!`,
    })
  } catch (error) {
    console.error('[API Owner Users POST Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan user baru' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID User wajib disertakan' },
        { status: 400 }
      )
    }

    if (userId === 'user-owner') {
      return NextResponse.json(
        { success: false, message: 'Akun Owner utama tidak dapat dihapus' },
        { status: 403 }
      )
    }

    await sql`DELETE FROM users WHERE id = ${userId};`

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    })
  } catch (error) {
    console.error('[API Owner Users DELETE Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, pin, name, outlet_id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID User wajib disertakan' },
        { status: 400 }
      )
    }

    const existing = await sql`SELECT id, name, role, outlet_id FROM users WHERE id = ${String(id)} LIMIT 1;`
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    const current = existing[0]!
    const nextName = name !== undefined && String(name).trim() ? String(name).trim() : current.name
    const nextOutletId =
      outlet_id !== undefined
        ? outlet_id
          ? String(outlet_id).trim()
          : null
        : current.outlet_id

    if (pin !== undefined && String(pin).trim() !== '') {
      const cleanPin = String(pin).trim()
      if (!/^\d{6}$/.test(cleanPin)) {
        return NextResponse.json(
          { success: false, message: 'PIN baru harus tepat 6 digit angka' },
          { status: 400 }
        )
      }
      const pinCodeHash = await bcrypt.hash(cleanPin, 12)
      await sql`
        UPDATE users
        SET pin_code = ${pinCodeHash}, name = ${nextName}, outlet_id = ${nextOutletId}
        WHERE id = ${String(id)};
      `
    } else {
      await sql`
        UPDATE users
        SET name = ${nextName}, outlet_id = ${nextOutletId}
        WHERE id = ${String(id)};
      `
    }

    return NextResponse.json({
      success: true,
      message: `PIN / data untuk ${nextName} berhasil diperbarui!`,
    })
  } catch (error) {
    console.error('[API Owner Users PATCH Error]:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui PIN / data user' },
      { status: 500 }
    )
  }
}
