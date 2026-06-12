import { NextResponse } from 'next/server'
import { syncStaleProcessingOrders } from '@/lib/orders'

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || ''

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number
    }

    const result = await syncStaleProcessingOrders(
      typeof body.limit === 'number' && body.limit > 0 ? Math.floor(body.limit) : 20,
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PROCESSING_SYNC_FAILED'
    return NextResponse.json({ error: code }, { status: 500 })
  }
}
