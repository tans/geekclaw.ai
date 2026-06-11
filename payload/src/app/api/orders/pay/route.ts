import { NextResponse } from 'next/server'
import { createOrderPayment } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderNo?: string }

    if (!body.orderNo) {
      return NextResponse.json({ error: 'MISSING_ORDER_NO' }, { status: 400 })
    }

    const payment = await createOrderPayment(body.orderNo)

    return NextResponse.json(payment, { status: 200 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PAYMENT_CREATE_FAILED'
    const status = code === 'ORDER_NOT_FOUND' ? 404 : 400

    return NextResponse.json({ error: code }, { status })
  }
}
