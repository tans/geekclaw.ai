import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureOrdersSchema } from '@/lib/order-schema'
import { createAlipayPaymentOrder } from '@/lib/payment'
import { getSiteData } from '@/lib/site'

export type OrderPaymentEvent = {
  createdAt: string
  source:
    | 'checkout'
    | 'mock'
    | 'alipay-notify'
    | 'alipay-return'
    | 'fulfillment'
    | 'operator'
    | 'system'
  type:
    | 'payment_initiated'
    | 'payment_paid'
    | 'payment_failed'
    | 'notify_invalid'
    | 'notify_received'
    | 'notify_error'
    | 'fulfillment_updated'
    | 'operator_note_updated'
  message: string
  status?: string
  payload?: Record<string, unknown>
}

function normalizePaymentEvents(value: unknown): OrderPaymentEvent[] {
  if (Array.isArray(value)) {
    return value as OrderPaymentEvent[]
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? (parsed as OrderPaymentEvent[]) : []
    } catch {
      return []
    }
  }

  return []
}

export type CreateOrderInput = {
  productSlug: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  shippingAddress: string
  quantity: number
  source?: 'shop' | 'landing' | 'manual'
}

export async function createOrder(input: CreateOrderInput) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const products = await payload.find({
    collection: 'products',
    limit: 1,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: input.productSlug,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  const product = products.docs[0]

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  const quantity = Number.isFinite(input.quantity) && input.quantity > 0 ? Math.floor(input.quantity) : 1
  const totalAmount = product.price * quantity
  const orderNo = `GC${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`

  const order = await payload.create({
    collection: 'orders',
    data: {
      orderNo,
      status: 'pending',
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      shippingAddress: input.shippingAddress,
      source: input.source || 'shop',
      totalAmount,
      fulfillmentStatus: 'pending',
      deliveryMethod: 'digital',
      paymentProvider: 'alipay',
      paymentStatus: 'unpaid',
      items: [
        {
          product: product.id,
          quantity,
          unitPrice: product.price,
        },
      ],
    },
  })

  return {
    id: order.id,
    orderNo: order.orderNo,
    totalAmount: order.totalAmount,
    productName: product.name,
    quantity,
  }
}

export async function createOrderPayment(orderNo: string) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const site = await getSiteData()

  const orders = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      orderNo: {
        equals: orderNo,
      },
    },
  })

  const order = orders.docs[0]

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  if (order.paymentStatus === 'paid') {
    throw new Error('ORDER_ALREADY_PAID')
  }

  const firstItem = order.items[0]
  const productName =
    typeof firstItem?.product === 'object' && firstItem.product?.name
      ? firstItem.product.name
      : `GeekClaw 订单 ${order.orderNo}`

  const hasRealConfig = Boolean(site.payment.appId && site.payment.privateKey && site.payment.publicKey)
  const payment = await createAlipayPaymentOrder({
    mode: hasRealConfig ? 'redirect' : 'mock',
    appId: site.payment.appId,
    gateway: site.payment.gateway,
    orderNo: order.orderNo,
    privateKey: site.payment.privateKey,
    publicKey: site.payment.publicKey,
    subject: productName,
    amount: order.totalAmount,
    notifyUrl: site.payment.notifyUrl,
    returnUrl: site.payment.returnUrl,
  })

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: 'pending',
      paymentStatus: 'processing',
      paymentOrderNo: order.orderNo,
      paymentPayload: payment.payload,
      paymentLastError: null,
    },
  })

  await appendOrderPaymentEvent(order.orderNo, {
    createdAt: new Date().toISOString(),
    source: 'checkout',
    type: 'payment_initiated',
    message: payment.isMock ? '已发起 mock 支付流程。' : '已发起真实支付宝支付跳转。',
    status: payment.isMock ? 'mock' : 'redirect',
    payload: {
      ...payment.payload,
      paymentUrl: payment.paymentUrl,
    },
  })

  return {
    orderNo: order.orderNo,
    isMock: payment.isMock,
    paymentUrl: payment.paymentUrl,
    mode: hasRealConfig ? 'redirect' : 'mock',
  }
}

export async function getOrderByOrderNo(orderNo: string) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const orders = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      orderNo: {
        equals: orderNo,
      },
    },
  })

  return orders.docs[0] || null
}

export async function markOrderPaid(args: {
  orderNo: string
  paymentPayload?: Record<string, unknown>
  tradeNo?: string
  source?: OrderPaymentEvent['source']
  message?: string
}) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: 'paid',
      paymentStatus: 'paid',
      paymentTradeNo: args.tradeNo || order.paymentTradeNo,
      paymentPayload: args.paymentPayload || order.paymentPayload,
      paymentLastError: null,
      paidAt: new Date().toISOString(),
    },
  })

  await appendOrderPaymentEvent(args.orderNo, {
    createdAt: new Date().toISOString(),
    source: args.source || 'system',
    type: 'payment_paid',
    message: args.message || '订单已标记为支付成功。',
    status: 'paid',
    payload: args.paymentPayload,
  })

  return updated
}

export async function markOrderFailed(args: {
  orderNo: string
  paymentPayload?: Record<string, unknown>
  source?: OrderPaymentEvent['source']
  message?: string
  status?: string
}) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: 'failed',
      paymentStatus: 'failed',
      paymentPayload: args.paymentPayload || order.paymentPayload,
      paymentLastError: args.message || '支付失败',
    },
  })

  await appendOrderPaymentEvent(args.orderNo, {
    createdAt: new Date().toISOString(),
    source: args.source || 'system',
    type: 'payment_failed',
    message: args.message || '订单已标记为支付失败。',
    status: args.status || 'failed',
    payload: args.paymentPayload,
  })

  return updated
}

export async function appendOrderPaymentEvent(orderNo: string, event: OrderPaymentEvent) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const order = await getOrderByOrderNo(orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const currentEvents = normalizePaymentEvents(order.paymentEvents)

  return payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      paymentEvents: [...currentEvents, event].slice(-20),
    },
  })
}

export async function getRecentPaymentExceptions(limit = 5) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit,
    pagination: false,
    sort: '-updatedAt',
    where: {
      or: [
        {
          paymentStatus: {
            equals: 'failed',
          },
        },
        {
          paymentStatus: {
            equals: 'processing',
          },
        },
      ],
    },
  })

  return result.docs
}

export async function getPendingFulfillmentOrders(limit = 5) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit,
    pagination: false,
    sort: '-paidAt',
    where: {
      and: [
        {
          paymentStatus: {
            equals: 'paid',
          },
        },
        {
          fulfillmentStatus: {
            not_equals: 'completed',
          },
        },
      ],
    },
  })

  return result.docs
}

export async function getPendingPaymentOrders(limit = 5) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit,
    pagination: false,
    sort: '-updatedAt',
    where: {
      or: [
        {
          paymentStatus: {
            equals: 'unpaid',
          },
        },
        {
          paymentStatus: {
            equals: 'processing',
          },
        },
      ],
    },
  })

  return result.docs
}

export async function updateOrderFulfillment(args: {
  orderNo: string
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'completed'
  deliveryMethod?: 'digital' | 'shipping' | 'service'
  deliveryNote?: string
  trackingNo?: string
}) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      fulfillmentStatus: args.fulfillmentStatus,
      deliveryMethod: args.deliveryMethod || order.deliveryMethod,
      deliveryNote: args.deliveryNote ?? order.deliveryNote,
      trackingNo: args.trackingNo ?? order.trackingNo,
    },
  })

  await appendOrderPaymentEvent(args.orderNo, {
    createdAt: new Date().toISOString(),
    source: 'fulfillment',
    type: 'fulfillment_updated',
    message: `订单履约状态已更新为：${formatFulfillmentStatusLabel(args.fulfillmentStatus)}。`,
    status: args.fulfillmentStatus,
    payload: {
      deliveryMethod: args.deliveryMethod || order.deliveryMethod,
      deliveryNote: args.deliveryNote ?? order.deliveryNote,
      trackingNo: args.trackingNo ?? order.trackingNo,
    },
  })

  return updated
}

export async function updateOrderOperatorNote(args: {
  orderNo: string
  operatorNote?: string
}) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  const nextOperatorNote = args.operatorNote?.trim() || null
  const previousOperatorNote =
    typeof order.operatorNote === 'string' && order.operatorNote.trim() ? order.operatorNote.trim() : null

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      operatorNote: nextOperatorNote,
    },
  })

  if (nextOperatorNote !== previousOperatorNote) {
    await appendOrderPaymentEvent(args.orderNo, {
      createdAt: new Date().toISOString(),
      source: 'operator',
      type: 'operator_note_updated',
      message: nextOperatorNote ? '运营备注已更新。' : '运营备注已清空。',
      status: order.fulfillmentStatus || order.paymentStatus || order.status,
      payload: {
        previousOperatorNote,
        operatorNote: nextOperatorNote,
      },
    })
  }

  return updated
}

function formatFulfillmentStatusLabel(value: 'pending' | 'processing' | 'shipped' | 'completed') {
  switch (value) {
    case 'processing':
      return '准备中'
    case 'shipped':
      return '已发货/已交付'
    case 'completed':
      return '已完成'
    case 'pending':
    default:
      return '待处理'
  }
}
