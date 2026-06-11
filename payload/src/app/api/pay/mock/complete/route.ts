import { NextResponse } from 'next/server'
import { markOrderFailed, markOrderPaid } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNo?: string
      outcome?: 'paid' | 'failed'
    }

    if (!body.orderNo || !body.outcome) {
      return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 })
    }

    if (body.outcome === 'paid') {
      const order = await markOrderPaid({
        orderNo: body.orderNo,
        paymentPayload: {
          provider: 'mock',
          status: 'TRADE_SUCCESS',
        },
        tradeNo: `MOCK-${body.orderNo}`,
        source: 'mock',
        message: 'Mock 支付页确认支付成功。',
      })

      return NextResponse.json({ orderNo: order.orderNo, paymentStatus: order.paymentStatus }, { status: 200 })
    }

    const order = await markOrderFailed({
      orderNo: body.orderNo,
      paymentPayload: {
        provider: 'mock',
        status: 'TRADE_FAILED',
      },
      source: 'mock',
      message: 'Mock 支付页确认支付失败。',
      status: 'TRADE_FAILED',
    })

    return NextResponse.json({ orderNo: order.orderNo, paymentStatus: order.paymentStatus }, { status: 200 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'MOCK_PAYMENT_FAILED'
    const status = code === 'ORDER_NOT_FOUND' ? 404 : code === 'ORDER_CANCELLED' ? 409 : 500

    return NextResponse.json({ error: code }, { status })
  }
}
