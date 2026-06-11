import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerEmail?: string
      customerName?: string
      customerPhone?: string
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

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ORDER_CREATE_FAILED'
    const status = code === 'PRODUCT_NOT_FOUND' ? 404 : 500

    return NextResponse.json({ error: code }, { status })
  }
}
