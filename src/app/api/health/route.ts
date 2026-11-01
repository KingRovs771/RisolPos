import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isStorageConfigured } from '@/lib/storage'

export async function GET() {
  try {
    const result = await sql`SELECT 1 as connected, NOW() as current_time`
    return NextResponse.json({
      status: 'ok',
      service: 'RisolPOS API',
      postgres: {
        connected: Boolean(result && result.length > 0),
        timestamp: result[0]?.current_time,
      },
      objectStorage: {
        configured: isStorageConfigured(),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown database error'
    return NextResponse.json(
      {
        status: 'error',
        message: msg,
      },
      { status: 500 }
    )
  }
}
