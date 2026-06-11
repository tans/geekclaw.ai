import { NextResponse } from 'next/server'
import { reviewProcessingOrder } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNo?: string
      outcome?: 'paid' | 'failed'
      reason?: string
    }

    if (!body.orderNo || !body.outcome) {
      return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 })
    }

    const order = await reviewProcessingOrder({
      orderNo: body.orderNo,
      outcome: body.outcome,
      reason: body.reason?.trim() || undefined,
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
    const code = error instanceof Error ? error.message : 'PAYMENT_REVIEW_FAILED'
    const status =
      code === 'ORDER_NOT_FOUND'
        ? 404
        : code === 'ORDER_CANCELLED' || code === 'ORDER_NOT_PROCESSING'
          ? 400
          : 500

    return NextResponse.json({ error: code }, { status })
  }
}
