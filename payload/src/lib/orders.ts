import { getPayload } from 'payload'
import config from '@/payload.config'
import { ensureOrdersSchema } from '@/lib/order-schema'
import { getUnpaidOrderExpireCutoff, getUnpaidOrderExpireMinutes } from '@/lib/order-expiry'
import { createAlipayPaymentOrder, queryAlipayPaymentOrder } from '@/lib/payment'
import { getProcessingReviewCutoff, getProcessingReviewMinutes } from '@/lib/payment-review'
import { ensureProductsSchema } from '@/lib/product-schema'
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
    | 'order_cancelled'
    | 'order_expired'
    | 'payment_review_requested'
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
  ensureProductsSchema()
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
  const productStock = getProductStockFields({
    trackInventory:
      'trackInventory' in product ? (product as { trackInventory?: boolean | null }).trackInventory : undefined,
    stockQuantity:
      'stockQuantity' in product ? (product as { stockQuantity?: number | null }).stockQuantity : undefined,
    allowBackorder:
      'allowBackorder' in product ? (product as { allowBackorder?: boolean | null }).allowBackorder : undefined,
    limitPerOrder:
      'limitPerOrder' in product ? (product as { limitPerOrder?: number | null }).limitPerOrder : undefined,
  })

  if (productStock.limitPerOrder && quantity > productStock.limitPerOrder) {
    throw new Error('PRODUCT_LIMIT_EXCEEDED')
  }

  if (productStock.trackInventory && !productStock.allowBackorder) {
    const availability = await getProductAvailabilityForOrder(payload, {
      productId: product.id,
      stockQuantity: productStock.stockQuantity,
      trackInventory: productStock.trackInventory,
      allowBackorder: productStock.allowBackorder,
    })

    if ((availability.availableQuantity ?? 0) < quantity) {
      throw new Error('PRODUCT_SOLD_OUT')
    }
  }

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

function getProductStockFields(product: {
  trackInventory?: boolean | null
  stockQuantity?: number | null
  allowBackorder?: boolean | null
  limitPerOrder?: number | null
}) {
  return {
    trackInventory: Boolean(product.trackInventory),
    stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : 0,
    allowBackorder: Boolean(product.allowBackorder),
    limitPerOrder: typeof product.limitPerOrder === 'number' ? product.limitPerOrder : undefined,
  }
}

async function getProductAvailabilityForOrder(
  payload: Awaited<ReturnType<typeof getPayload>>,
  args: {
    productId: number
    trackInventory: boolean
    stockQuantity: number
    allowBackorder: boolean
  },
) {
  if (!args.trackInventory) {
    return {
      availableQuantity: null,
    }
  }

  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 200,
    pagination: false,
    where: {
      status: {
        not_equals: 'cancelled',
      },
    },
  })

  const reservedQuantity = orders.docs.reduce((sum, order) => {
    if (order.status === 'failed' || order.status === 'refunded') {
      return sum
    }

    const items = Array.isArray(order.items) ? order.items : []

    return (
      sum +
      items.reduce((itemSum, item) => {
        const productId = typeof item.product === 'number' ? item.product : item.product?.id
        return productId === args.productId ? itemSum + (Number(item.quantity) || 0) : itemSum
      }, 0)
    )
  }, 0)

  return {
    availableQuantity: Math.max(0, args.stockQuantity - reservedQuantity),
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

  if (order.status === 'cancelled') {
    throw new Error('ORDER_CANCELLED')
  }

  if (isOrderExpired(order)) {
    await cancelOrder({
      orderNo,
      source: 'system',
      reason: `订单超过 ${getUnpaidOrderExpireMinutes()} 分钟未支付，系统已自动关闭。`,
      eventType: 'order_expired',
    })
    throw new Error('ORDER_EXPIRED')
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

  if (order.status === 'cancelled') {
    throw new Error('ORDER_CANCELLED')
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

export async function reviewProcessingOrder(args: {
  orderNo: string
  outcome: 'paid' | 'failed'
  reason?: string
}) {
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  if (order.status === 'cancelled') {
    throw new Error('ORDER_CANCELLED')
  }

  if (order.paymentStatus !== 'processing') {
    throw new Error('ORDER_NOT_PROCESSING')
  }

  await appendOrderPaymentEvent(args.orderNo, {
    createdAt: new Date().toISOString(),
    source: 'operator',
    type: 'payment_review_requested',
    message: args.reason || `运营已手动复核支付状态：${args.outcome === 'paid' ? '确认已支付' : '标记支付失败'}。`,
    status: args.outcome,
    payload: {
      outcome: args.outcome,
      reason: args.reason || null,
      reviewThresholdMinutes: getProcessingReviewMinutes(),
    },
  })

  if (args.outcome === 'paid') {
    return markOrderPaid({
      orderNo: args.orderNo,
      source: 'operator',
      message: args.reason || '运营复核后手动确认该支付单已完成。',
      paymentPayload: {
        provider: 'manual-review',
        outcome: 'paid',
        reviewedAt: new Date().toISOString(),
      },
    })
  }

  return markOrderFailed({
    orderNo: args.orderNo,
    source: 'operator',
    message: args.reason || '运营复核后将该支付单标记为失败。',
    status: 'manual_review_failed',
    paymentPayload: {
      provider: 'manual-review',
      outcome: 'failed',
      reviewedAt: new Date().toISOString(),
    },
  })
}

export async function syncProcessingOrderFromProvider(args: {
  orderNo: string
}) {
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  if (order.status === 'cancelled') {
    throw new Error('ORDER_CANCELLED')
  }

  if (order.paymentStatus !== 'processing') {
    throw new Error('ORDER_NOT_PROCESSING')
  }

  const site = await getSiteData()
  const canQuery = Boolean(site.payment.appId && site.payment.privateKey && site.payment.publicKey)
  const query = await queryAlipayPaymentOrder({
    mode: canQuery ? 'query' : 'mock',
    appId: site.payment.appId,
    privateKey: site.payment.privateKey,
    publicKey: site.payment.publicKey,
    gateway: site.payment.gateway,
    orderNo: args.orderNo,
  })

  await appendOrderPaymentEvent(args.orderNo, {
    createdAt: new Date().toISOString(),
    source: 'operator',
    type: 'payment_review_requested',
    message: query.isMock ? '运营触发了查单，但当前仍是 mock 配置。' : '运营触发了支付宝主动查单。',
    status: query.tradeStatus || 'query_pending',
    payload: query.raw,
  })

  if (query.tradeStatus === 'TRADE_SUCCESS' || query.tradeStatus === 'TRADE_FINISHED') {
    const updated = await markOrderPaid({
      orderNo: args.orderNo,
      tradeNo: query.tradeNo,
      source: 'operator',
      message: '支付宝主动查单确认支付成功，系统已同步更新订单。',
      paymentPayload: query.raw,
    })

    return {
      action: 'marked_paid' as const,
      order: updated,
      query,
    }
  }

  if (query.tradeStatus === 'TRADE_CLOSED') {
    const updated = await markOrderFailed({
      orderNo: args.orderNo,
      source: 'operator',
      message: '支付宝主动查单确认交易已关闭，系统已同步更新订单。',
      status: 'TRADE_CLOSED',
      paymentPayload: query.raw,
    })

    return {
      action: 'marked_failed' as const,
      order: updated,
      query,
    }
  }

  return {
    action: 'no_change' as const,
    order,
    query,
  }
}

export async function cancelOrder(args: {
  orderNo: string
  source?: OrderPaymentEvent['source']
  reason?: string
  eventType?: 'order_cancelled' | 'order_expired'
}) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const order = await getOrderByOrderNo(args.orderNo)

  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
    throw new Error('ORDER_CANNOT_CANCEL')
  }

  if (order.status === 'cancelled') {
    throw new Error('ORDER_ALREADY_CANCELLED')
  }

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: 'cancelled',
      paymentStatus: 'failed',
      paymentLastError: args.reason || '订单已取消',
    },
  })

  await appendOrderPaymentEvent(args.orderNo, {
    createdAt: new Date().toISOString(),
    source: args.source || 'system',
    type: args.eventType || 'order_cancelled',
    message: args.reason || '订单已取消，库存占用已释放。',
    status: 'cancelled',
    payload: {
      orderStatus: 'cancelled',
      reason: args.reason || null,
    },
  })

  return updated
}

export async function closeExpiredPendingOrders() {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const cutoff = getUnpaidOrderExpireCutoff()

  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 200,
    pagination: false,
    sort: 'createdAt',
    where: {
      and: [
        {
          status: {
            equals: 'pending',
          },
        },
        {
          paymentStatus: {
            equals: 'unpaid',
          },
        },
        {
          createdAt: {
            less_than: cutoff.toISOString(),
          },
        },
      ],
    },
  })

  const closed: string[] = []

  for (const order of result.docs) {
    await cancelOrder({
      orderNo: order.orderNo,
      source: 'system',
      reason: `订单超过 ${getUnpaidOrderExpireMinutes()} 分钟未支付，系统已自动关闭。`,
      eventType: 'order_expired',
    }).catch((error) => {
      if (!(error instanceof Error) || error.message !== 'ORDER_ALREADY_CANCELLED') {
        throw error
      }
    })

    closed.push(order.orderNo)
  }

  return {
    closedOrderNos: closed,
    closedCount: closed.length,
    cutoff: cutoff.toISOString(),
    expireMinutes: getUnpaidOrderExpireMinutes(),
  }
}

function isOrderExpired(order: {
  status?: string | null
  paymentStatus?: string | null
  createdAt: string
}) {
  if (order.status !== 'pending' || order.paymentStatus !== 'unpaid') {
    return false
  }

  const createdAt = new Date(order.createdAt)

  if (Number.isNaN(createdAt.getTime())) {
    return false
  }

  return createdAt.getTime() < getUnpaidOrderExpireCutoff().getTime()
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

export async function getStaleProcessingOrders(limit = 10) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })
  const cutoff = getProcessingReviewCutoff()

  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit,
    pagination: false,
    sort: 'updatedAt',
    where: {
      and: [
        {
          paymentStatus: {
            equals: 'processing',
          },
        },
        {
          updatedAt: {
            less_than: cutoff.toISOString(),
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
