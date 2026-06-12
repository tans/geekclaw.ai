import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureRole, hasSystemAuthorization } from '@/lib/access'
import { updateOrderFulfillment } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    if (!hasSystemAuthorization(request.headers)) {
      const payload = await getPayload({ config })
      const auth = await payload.auth({ headers: request.headers })
      ensureRole(auth.user ? ({ user: auth.user } as never) : undefined, ['super-admin', 'ops'])
    }

    const body = (await request.json()) as {
      orderNo?: string
      fulfillmentStatus?: 'pending' | 'processing' | 'shipped' | 'completed'
      deliveryMethod?: 'digital' | 'shipping' | 'service'
      deliveryNote?: string
      trackingNo?: string
    }

    if (!body.orderNo || !body.fulfillmentStatus) {
      return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 })
    }

    const order = await updateOrderFulfillment({
      orderNo: body.orderNo,
      fulfillmentStatus: body.fulfillmentStatus,
      deliveryMethod: body.deliveryMethod,
      deliveryNote: body.deliveryNote,
      trackingNo: body.trackingNo,
    })

    return NextResponse.json(
      {
        orderNo: order.orderNo,
        fulfillmentStatus: order.fulfillmentStatus,
        fulfilledAt: order.fulfilledAt,
      },
      { status: 200 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'FULFILLMENT_UPDATE_FAILED'
    const status = code === 'ORDER_NOT_FOUND' ? 404 : code === 'FORBIDDEN' ? 403 : 500

    return NextResponse.json({ error: code }, { status })
  }
}
