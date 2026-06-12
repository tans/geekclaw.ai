import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureRole, hasSystemAuthorization } from '@/lib/access'
import { syncProcessingOrderFromProvider } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    if (!hasSystemAuthorization(request.headers)) {
      const payload = await getPayload({ config })
      const auth = await payload.auth({ headers: request.headers })
      ensureRole(auth.user ? ({ user: auth.user } as never) : undefined, ['super-admin', 'ops'])
    }

    const body = (await request.json()) as {
      orderNo?: string
    }

    if (!body.orderNo) {
      return NextResponse.json({ error: 'MISSING_ORDER_NO' }, { status: 400 })
    }

    const result = await syncProcessingOrderFromProvider({
      orderNo: body.orderNo,
    })

    return NextResponse.json(
      {
        action: result.action,
        orderNo: result.order.orderNo,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus,
        tradeStatus: result.query.tradeStatus,
        isMock: result.query.isMock,
      },
      { status: 200 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PAYMENT_QUERY_FAILED'
    const status =
      code === 'ORDER_NOT_FOUND'
        ? 404
        : code === 'FORBIDDEN'
          ? 403
        : code === 'ORDER_CANCELLED' || code === 'ORDER_NOT_PROCESSING'
          ? 400
          : 500

    return NextResponse.json({ error: code }, { status })
  }
}
