import { NextResponse } from 'next/server'
import { closeExpiredPendingOrders } from '@/lib/orders'

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || ''

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const result = await closeExpiredPendingOrders()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_CLOSE_EXPIRED_FAILED'
    return NextResponse.json({ error: code }, { status: 500 })
  }
}
