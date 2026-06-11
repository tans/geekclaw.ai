import { NextResponse } from 'next/server'
import { updateOrderOperatorNote } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNo?: string
      operatorNote?: string
    }

    if (!body.orderNo) {
      return NextResponse.json({ error: 'MISSING_ORDER_NO' }, { status: 400 })
    }

    const order = await updateOrderOperatorNote({
      orderNo: body.orderNo,
      operatorNote: body.operatorNote,
    })

    return NextResponse.json(
      {
        orderNo: order.orderNo,
        operatorNote: order.operatorNote,
      },
      { status: 200 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'OPERATOR_NOTE_UPDATE_FAILED'
    const status = code === 'ORDER_NOT_FOUND' ? 404 : 500

    return NextResponse.json({ error: code }, { status })
  }
}
