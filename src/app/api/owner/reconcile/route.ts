import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { transactionId, isReconciled } = body

    if (!transactionId || typeof isReconciled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'transactionId dan isReconciled wajib diisi' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE transactions
      SET is_reconciled = ${isReconciled}
      WHERE id = ${transactionId}
    `

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        isReconciled,
      },
    })
  } catch (error) {
    console.error('[API Owner Reconcile] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status rekonsiliasi' },
      { status: 500 }
    )
  }
}
