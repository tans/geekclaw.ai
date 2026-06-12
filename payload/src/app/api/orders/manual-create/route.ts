import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureRole, hasSystemAuthorization } from '@/lib/access'
import { createManualOrder } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    if (!hasSystemAuthorization(request.headers)) {
      const payload = await getPayload({ config })
      const auth = await payload.auth({ headers: request.headers })
      ensureRole(auth.user ? ({ user: auth.user } as never) : undefined, ['super-admin', 'ops'])
    }

    const body = (await request.json()) as {
      customerEmail?: string
      customerName?: string
      customerPhone?: string
      deliveryMethod?: 'digital' | 'shipping' | 'service'
      deliveryNote?: string
      markAsPaid?: boolean
      operatorNote?: string
      productSlug?: string
      quantity?: number
      shippingAddress?: string
      startFulfillment?: boolean
      trackingNo?: string
    }

    if (!body.productSlug || !body.customerName || !body.customerPhone || !body.shippingAddress) {
      return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 })
    }

    const result = await createManualOrder({
      productSlug: body.productSlug,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim() || undefined,
      shippingAddress: body.shippingAddress.trim(),
      quantity: body.quantity || 1,
      operatorNote: body.operatorNote,
      markAsPaid: body.markAsPaid,
      startFulfillment: body.startFulfillment,
      deliveryMethod: body.deliveryMethod,
      deliveryNote: body.deliveryNote,
      trackingNo: body.trackingNo,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_CREATE_FAILED'
    const status =
      code === 'PRODUCT_NOT_FOUND'
        ? 404
        : code === 'FORBIDDEN'
          ? 403
        : code === 'PRODUCT_SOLD_OUT' || code === 'PRODUCT_LIMIT_EXCEEDED'
          ? 400
          : 500

    return NextResponse.json({ error: code }, { status })
  }
}
