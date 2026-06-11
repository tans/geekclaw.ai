import { NextResponse } from 'next/server'
import { cancelOrder } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNo?: string
      reason?: string
      source?: 'shop' | 'landing' | 'manual' | 'operator'
    }

    if (!body.orderNo) {
      return NextResponse.json({ error: 'MISSING_ORDER_NO' }, { status: 400 })
    }

    const order = await cancelOrder({
      orderNo: body.orderNo,
      reason: body.reason?.trim() || undefined,
      source: body.source === 'operator' ? 'operator' : 'system',
    })

    return NextResponse.json(
      {
        orderNo: order.orderNo,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      { status: 200 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_CANCEL_FAILED'
    const status =
      code === 'ORDER_NOT_FOUND'
        ? 404
        : code === 'ORDER_CANNOT_CANCEL' || code === 'ORDER_ALREADY_CANCELLED'
          ? 400
          : 500

    return NextResponse.json({ error: code }, { status })
  }
}
