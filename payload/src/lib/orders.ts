import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@/payload.config'
import { buildOrderPaymentChainFieldPatch } from '@/lib/order-payment-labels'
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

export type CreateManualOrderInput = {
  productSlug: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  shippingAddress: string
  quantity: number
  operatorNote?: string
  markAsPaid?: boolean
  startFulfillment?: boolean
  deliveryMethod?: 'digital' | 'shipping' | 'service'
  deliveryNote?: string
  trackingNo?: string
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
    totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : totalAmount,
    productName: product.name,
    quantity,
  }
}

export async function createManualOrder(input: CreateManualOrderInput) {
  const order = await createOrder({
    productSlug: input.productSlug,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    shippingAddress: input.shippingAddress,
    quantity: input.quantity,
    source: 'manual',
  })

  if (input.operatorNote?.trim()) {
    await updateOrderOperatorNote({
      orderNo: order.orderNo,
      operatorNote: input.operatorNote,
    })
  }

  if (input.markAsPaid) {
    await markOrderPaid({
      orderNo: order.orderNo,
      source: 'operator',
      message: '后台录单时已确认线下到账，订单直接标记为支付成功。',
      paymentPayload: {
        provider: 'manual-offline',
        source: 'manual',
        markedPaidAt: new Date().toISOString(),
      },
    })
  }

  if (input.markAsPaid && input.startFulfillment) {
    await updateOrderFulfillment({
      orderNo: order.orderNo,
      fulfillmentStatus: 'processing',
      deliveryMethod: input.deliveryMethod,
      deliveryNote: input.deliveryNote,
      trackingNo: input.trackingNo,
    })
  }

  return {
    ...order,
    markedAsPaid: Boolean(input.markAsPaid),
    fulfillmentStarted: Boolean(input.markAsPaid && input.startFulfillment),
  }
}

function getOrderTotalAmount(order: {
  totalAmount?: number | null
  items?: Array<{
    quantity?: number | null
    unitPrice?: number | null
  }> | null
}) {
  if (typeof order.totalAmount === 'number') {
    return order.totalAmount
  }

  const items = Array.isArray(order.items) ? order.items : []

  return items.reduce((sum, item) => {
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0
    const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0
    return sum + quantity * unitPrice
  }, 0)
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
    amount: getOrderTotalAmount(order),
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
      ...buildOrderPaymentChainFieldPatch({
        paymentEvents: order.paymentEvents,
        paymentLastError: null,
      }),
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
      ...buildOrderPaymentChainFieldPatch({
        paymentEvents: order.paymentEvents,
        paymentLastError: null,
      }),
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
      ...buildOrderPaymentChainFieldPatch({
        paymentEvents: order.paymentEvents,
        paymentLastError: args.message || '支付失败',
      }),
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

export async function syncStaleProcessingOrders(limit = 20) {
  const staleOrders = await getStaleProcessingOrders(limit)
  const results: Array<{
    orderNo: string
    action: 'no_change' | 'marked_paid' | 'marked_failed'
    paymentStatus: string
    tradeStatus: string | null
    isMock: boolean
  }> = []

  for (const order of staleOrders) {
    const synced = await syncProcessingOrderFromProvider({
      orderNo: order.orderNo,
    }).catch((error) => {
      if (error instanceof Error && (error.message === 'ORDER_CANCELLED' || error.message === 'ORDER_NOT_PROCESSING')) {
        return {
          action: 'no_change' as const,
          order,
          query: {
            isMock: true,
            tradeStatus: null,
          },
        }
      }

      throw error
    })

    results.push({
      orderNo: synced.order.orderNo,
      action: synced.action,
      paymentStatus: synced.order.paymentStatus,
      tradeStatus: synced.query.tradeStatus,
      isMock: synced.query.isMock,
    })
  }

  return {
    scannedCount: staleOrders.length,
    results,
    reviewMinutes: getProcessingReviewMinutes(),
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
      ...buildOrderPaymentChainFieldPatch({
        paymentEvents: order.paymentEvents,
        paymentLastError: args.reason || '订单已取消',
      }),
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
  const nextEvents = [...currentEvents, event].slice(-20)

  return payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      paymentEvents: nextEvents,
      ...buildOrderPaymentChainFieldPatch({
        paymentEvents: nextEvents,
        paymentLastError: order.paymentLastError || null,
      }),
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

export async function getRecentOrdersForPaymentObservability(limit = 20) {
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
            equals: 'processing',
          },
        },
        {
          paymentStatus: {
            equals: 'failed',
          },
        },
        {
          paymentStatus: {
            equals: 'paid',
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

export type OrderExportFilters = {
  paymentStatus?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded'
  fulfillmentStatus?: 'pending' | 'processing' | 'shipped' | 'completed'
  source?: 'shop' | 'landing' | 'manual'
  createdFrom?: string
  createdTo?: string
  limit?: number
}

export async function listOrdersForExport(filters: OrderExportFilters = {}) {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const andWhere: Where[] = []

  if (filters.paymentStatus) {
    andWhere.push({
      paymentStatus: {
        equals: filters.paymentStatus,
      },
    })
  }

  if (filters.fulfillmentStatus) {
    andWhere.push({
      fulfillmentStatus: {
        equals: filters.fulfillmentStatus,
      },
    })
  }

  if (filters.source) {
    andWhere.push({
      source: {
        equals: filters.source,
      },
    })
  }

  if (filters.createdFrom) {
    andWhere.push({
      createdAt: {
        greater_than_equal: filters.createdFrom,
      },
    })
  }

  if (filters.createdTo) {
    andWhere.push({
      createdAt: {
        less_than_equal: filters.createdTo,
      },
    })
  }

  const result = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: Math.min(filters.limit || 200, 1000),
    pagination: false,
    sort: '-updatedAt',
    where: andWhere.length ? { and: andWhere } : undefined,
  })

  return result.docs
}

export async function exportOrdersCsv(filters: OrderExportFilters = {}) {
  const orders = await listOrdersForExport(filters)

  const rows = orders.map((order) => {
    const firstItem = Array.isArray(order.items) ? order.items[0] : null
    const productName =
      firstItem && typeof firstItem.product === 'object' && firstItem.product?.name
        ? firstItem.product.name
        : firstItem && typeof firstItem.product === 'number'
          ? `#${firstItem.product}`
          : ''

    return [
      order.orderNo,
      order.status,
      order.paymentStatus,
      order.fulfillmentStatus || '',
      order.source,
      String(order.totalAmount ?? ''),
      order.customerName || '',
      order.customerPhone || '',
      order.customerEmail || '',
      order.shippingAddress || '',
      productName,
      String(firstItem?.quantity || ''),
      String(firstItem?.unitPrice || ''),
      order.deliveryMethod || '',
      order.trackingNo || '',
      order.operatorNote || '',
      order.paymentLastError || '',
      order.paidAt || '',
      order.fulfilledAt || '',
      order.updatedAt,
      order.createdAt,
    ]
  })

  const header = [
    'orderNo',
    'status',
    'paymentStatus',
    'fulfillmentStatus',
    'source',
    'totalAmount',
    'customerName',
    'customerPhone',
    'customerEmail',
    'shippingAddress',
    'productName',
    'quantity',
    'unitPrice',
    'deliveryMethod',
    'trackingNo',
    'operatorNote',
    'paymentLastError',
    'paidAt',
    'fulfilledAt',
    'updatedAt',
    'createdAt',
  ]

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

export async function exportProductSalesCsv(filters: OrderExportFilters = {}) {
  const orders = await listOrdersForExport({
    ...filters,
    paymentStatus: 'paid',
  })

  const productStats = new Map<
    string,
    {
      productName: string
      orderCount: number
      paidUnits: number
      paidRevenue: number
      lastPaidAt: string
    }
  >()

  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : []
    const paidAt = order.paidAt || ''

    for (const item of items) {
      const productName =
        typeof item.product === 'object' && item.product?.name
          ? item.product.name
          : typeof item.product === 'number'
            ? `#${item.product}`
            : 'Unknown Product'

      const current = productStats.get(productName) || {
        productName,
        orderCount: 0,
        paidUnits: 0,
        paidRevenue: 0,
        lastPaidAt: '',
      }

      current.orderCount += 1
      current.paidUnits += Number(item.quantity) || 0
      current.paidRevenue += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

      if (paidAt && (!current.lastPaidAt || paidAt > current.lastPaidAt)) {
        current.lastPaidAt = paidAt
      }

      productStats.set(productName, current)
    }
  }

  const rows = Array.from(productStats.values())
    .sort((left, right) => right.paidRevenue - left.paidRevenue)
    .map((item) => [
      item.productName,
      String(item.orderCount),
      String(item.paidUnits),
      String(item.paidRevenue),
      item.lastPaidAt,
    ])

  const header = ['productName', 'orderCount', 'paidUnits', 'paidRevenue', 'lastPaidAt']

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

function escapeCsvCell(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

export async function getLowStockProducts(limit = 6) {
  ensureProductsSchema()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'products',
    depth: 0,
    limit: Math.max(limit * 3, 18),
    pagination: false,
    sort: 'stockQuantity',
    where: {
      and: [
        {
          status: {
            equals: 'active',
          },
        },
        {
          trackInventory: {
            equals: true,
          },
        },
      ],
    },
  })

  return result.docs
    .filter((product) => {
      const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
      const allowBackorder = Boolean(product.allowBackorder)
      return stockQuantity <= 5 || !allowBackorder
    })
    .slice(0, limit)
}

export async function getMerchantOverview() {
  ensureOrdersSchema()
  ensureProductsSchema()
  const payload = await getPayload({ config })

  const [ordersResult, productsResult, pendingFulfillmentOrders, staleProcessingOrders, lowStockProducts] = await Promise.all([
    payload.find({
      collection: 'orders',
      depth: 0,
      limit: 500,
      pagination: false,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'products',
      depth: 0,
      limit: 200,
      pagination: false,
    }),
    getPendingFulfillmentOrders(6),
    getStaleProcessingOrders(6),
    getLowStockProducts(6),
  ])

  const orders = ordersResult.docs
  const products = productsResult.docs
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid')
  const paidRevenue30d = paidOrders.reduce((sum, order) => {
    const paidAt = order.paidAt ? new Date(order.paidAt) : null
    if (!paidAt || Number.isNaN(paidAt.getTime()) || paidAt < thirtyDaysAgo) {
      return sum
    }
    return sum + (Number(order.totalAmount) || 0)
  }, 0)

  const pendingPaymentCount = orders.filter(
    (order) => order.paymentStatus === 'unpaid' || order.paymentStatus === 'processing',
  ).length

  const todaysPaidOrders = paidOrders.filter((order) => {
    const paidAt = order.paidAt ? new Date(order.paidAt) : null
    if (!paidAt || Number.isNaN(paidAt.getTime())) {
      return false
    }

    const now = new Date()
    return (
      paidAt.getFullYear() === now.getFullYear() &&
      paidAt.getMonth() === now.getMonth() &&
      paidAt.getDate() === now.getDate()
    )
  }).length

  const activeProducts = products.filter((product) => product.status === 'active').length
  const trackedInventoryProducts = products.filter((product) => Boolean(product.trackInventory)).length

  return {
    stats: {
      totalOrders: orders.length,
      pendingPaymentCount,
      pendingFulfillmentCount: pendingFulfillmentOrders.length,
      staleProcessingCount: staleProcessingOrders.length,
      paidRevenue30d,
      todaysPaidOrders,
      activeProducts,
      trackedInventoryProducts,
      lowStockCount: lowStockProducts.length,
    },
    queues: {
      pendingFulfillmentOrders,
      staleProcessingOrders,
      lowStockProducts,
      recentPaidOrders: paidOrders.slice(0, 6),
    },
  }
}

export async function getMerchantAnalytics() {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 500,
    pagination: false,
    sort: '-createdAt',
  })

  const orders = result.docs
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt)
    return !Number.isNaN(createdAt.getTime()) && createdAt >= thirtyDaysAgo
  })

  const paidOrders = recentOrders.filter((order) => order.paymentStatus === 'paid')
  const failedOrders = recentOrders.filter((order) => order.paymentStatus === 'failed')
  const processingOrders = recentOrders.filter((order) => order.paymentStatus === 'processing')
  const unpaidOrders = recentOrders.filter((order) => order.paymentStatus === 'unpaid')

  const revenue30d = paidOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  const avgOrderValue30d = paidOrders.length ? revenue30d / paidOrders.length : 0
  const paymentSuccessRate30d = recentOrders.length ? paidOrders.length / recentOrders.length : 0
  const paymentFailureRate30d = recentOrders.length ? failedOrders.length / recentOrders.length : 0
  const pendingRate30d = recentOrders.length ? (processingOrders.length + unpaidOrders.length) / recentOrders.length : 0

  const productStats = new Map<
    string,
    {
      productName: string
      paidUnits: number
      paidRevenue: number
    }
  >()

  for (const order of paidOrders) {
    const items = Array.isArray(order.items) ? order.items : []

    for (const item of items) {
      const productName =
        typeof item.product === 'object' && item.product?.name
          ? item.product.name
          : typeof item.product === 'number'
            ? `#${item.product}`
            : 'Unknown Product'

      const current = productStats.get(productName) || {
        productName,
        paidUnits: 0,
        paidRevenue: 0,
      }

      current.paidUnits += Number(item.quantity) || 0
      current.paidRevenue += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
      productStats.set(productName, current)
    }
  }

  const topProducts = Array.from(productStats.values())
    .sort((left, right) => right.paidRevenue - left.paidRevenue)
    .slice(0, 5)

  return {
    windowLabel: '近 30 天',
    summary: {
      totalOrders: recentOrders.length,
      paidOrders: paidOrders.length,
      failedOrders: failedOrders.length,
      processingOrders: processingOrders.length,
      unpaidOrders: unpaidOrders.length,
      revenue30d,
      avgOrderValue30d,
      paymentSuccessRate30d,
      paymentFailureRate30d,
      pendingRate30d,
    },
    topProducts,
  }
}

export async function getSalesFulfillmentReport() {
  ensureOrdersSchema()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 500,
    pagination: false,
    sort: '-createdAt',
  })

  const orders = result.docs
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const recentOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt)
    return !Number.isNaN(createdAt.getTime()) && createdAt >= thirtyDaysAgo
  })

  const paidOrders = recentOrders.filter((order) => order.paymentStatus === 'paid')
  const pendingFulfillmentOrders = paidOrders.filter((order) => order.fulfillmentStatus !== 'completed')
  const completedFulfillmentOrders = paidOrders.filter((order) => order.fulfillmentStatus === 'completed')
  const failedOrders = recentOrders.filter((order) => order.paymentStatus === 'failed')
  const processingOrders = recentOrders.filter((order) => order.paymentStatus === 'processing')
  const unpaidOrders = recentOrders.filter((order) => order.paymentStatus === 'unpaid')

  const fulfillmentBuckets = {
    pending: paidOrders.filter((order) => order.fulfillmentStatus === 'pending').length,
    processing: paidOrders.filter((order) => order.fulfillmentStatus === 'processing').length,
    shipped: paidOrders.filter((order) => order.fulfillmentStatus === 'shipped').length,
    completed: completedFulfillmentOrders.length,
  }

  const totalRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  const avgFulfillmentOrderValue = pendingFulfillmentOrders.length
    ? pendingFulfillmentOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0) / pendingFulfillmentOrders.length
    : 0

  const productPerformance = new Map<
    string,
    {
      productName: string
      pendingUnits: number
      completedUnits: number
      paidUnits: number
      paidRevenue: number
      orderCount: number
    }
  >()

  for (const order of paidOrders) {
    const items = Array.isArray(order.items) ? order.items : []

    for (const item of items) {
      const productName =
        typeof item.product === 'object' && item.product?.name
          ? item.product.name
          : typeof item.product === 'number'
            ? `#${item.product}`
            : 'Unknown Product'
      const quantity = Number(item.quantity) || 0
      const revenue = quantity * (Number(item.unitPrice) || 0)
      const current = productPerformance.get(productName) || {
        productName,
        pendingUnits: 0,
        completedUnits: 0,
        paidUnits: 0,
        paidRevenue: 0,
        orderCount: 0,
      }

      current.paidUnits += quantity
      current.paidRevenue += revenue
      current.orderCount += 1

      if (order.fulfillmentStatus === 'completed') {
        current.completedUnits += quantity
      } else {
        current.pendingUnits += quantity
      }

      productPerformance.set(productName, current)
    }
  }

  const fulfillmentLeadOrders = pendingFulfillmentOrders
    .slice()
    .sort((left, right) => {
      const leftTime = left.paidAt ? new Date(left.paidAt).getTime() : new Date(left.updatedAt).getTime()
      const rightTime = right.paidAt ? new Date(right.paidAt).getTime() : new Date(right.updatedAt).getTime()
      return leftTime - rightTime
    })
    .slice(0, 12)

  return {
    windowLabel: '近 30 天',
    summary: {
      totalOrders: recentOrders.length,
      paidOrders: paidOrders.length,
      failedOrders: failedOrders.length,
      processingOrders: processingOrders.length,
      unpaidOrders: unpaidOrders.length,
      pendingFulfillmentOrders: pendingFulfillmentOrders.length,
      completedFulfillmentOrders: completedFulfillmentOrders.length,
      totalRevenue,
      avgFulfillmentOrderValue,
    },
    fulfillmentBuckets,
    productPerformance: Array.from(productPerformance.values())
      .sort((left, right) => right.paidRevenue - left.paidRevenue)
      .slice(0, 12),
    fulfillmentLeadOrders,
  }
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
