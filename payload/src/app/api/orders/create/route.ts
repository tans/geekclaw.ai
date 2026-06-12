import { NextResponse } from 'next/server'
import { createOrder, markOrderPaid } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerEmail?: string
      customerName?: string
      customerPhone?: string
      markAsPaid?: boolean
      productSlug?: string
      quantity?: number
      source?: 'shop' | 'landing' | 'manual'
      shippingAddress?: string
    }

    if (!body.productSlug || !body.customerName || !body.customerPhone || !body.shippingAddress) {
      return NextResponse.json({ error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 })
    }

    const order = await createOrder({
      productSlug: body.productSlug,
      customerEmail: body.customerEmail?.trim() || undefined,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      shippingAddress: body.shippingAddress.trim(),
      quantity: body.quantity || 1,
      source: body.source || 'shop',
    })

    if (body.markAsPaid) {
      await markOrderPaid({
        orderNo: order.orderNo,
        source: 'operator',
        message: '后台录单时已确认线下到账，订单直接标记为支付成功。',
        paymentPayload: {
          provider: 'manual-offline',
          source: body.source || 'manual',
          markedPaidAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json(
      {
        ...order,
        markedAsPaid: Boolean(body.markAsPaid),
      },
      { status: 201 },
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_CREATE_FAILED'
    const status =
      code === 'PRODUCT_NOT_FOUND'
        ? 404
        : code === 'PRODUCT_SOLD_OUT' || code === 'PRODUCT_LIMIT_EXCEEDED'
          ? 400
          : 500

    return NextResponse.json({ error: code }, { status })
  }
}
