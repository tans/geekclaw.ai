import { NextResponse } from 'next/server'
import { closeExpiredPendingOrders, syncStaleProcessingOrders } from '@/lib/orders'

type MaintenanceAction = 'close-expired' | 'sync-processing'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: MaintenanceAction
      limit?: number
    }

    if (!body.action) {
      return NextResponse.json({ error: 'MISSING_ACTION' }, { status: 400 })
    }

    if (body.action === 'close-expired') {
      const result = await closeExpiredPendingOrders()

      return NextResponse.json(
        {
          action: body.action,
          ...result,
        },
        { status: 200 },
      )
    }

    if (body.action === 'sync-processing') {
      const limit = typeof body.limit === 'number' && body.limit > 0 ? Math.min(Math.floor(body.limit), 100) : 20
      const result = await syncStaleProcessingOrders(limit)

      return NextResponse.json(
        {
          action: body.action,
          ...result,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'RUN_MAINTENANCE_FAILED'
    return NextResponse.json({ error: code }, { status: 500 })
  }
}
