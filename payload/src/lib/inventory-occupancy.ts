import type { Order, Product } from '@/payload-types'

type OccupancyOrderStatus = Order['status']
type OccupancyPaymentStatus = Order['paymentStatus']
type OccupancyFulfillmentStatus = Order['fulfillmentStatus']

export type InventoryOccupancyOrderRow = {
  id: number
  orderNo: string
  quantity: number
  status: OccupancyOrderStatus
  paymentStatus: OccupancyPaymentStatus
  fulfillmentStatus: OccupancyFulfillmentStatus
  customerName: string
  customerPhone: string
  totalAmount: number
  deliveryMethod: string
  trackingNo: string
  deliveryNote: string
  operatorNote: string
  createdAt: string
  updatedAt: string
  paidAt: string
  paymentEvents?: Order['paymentEvents']
  paymentLastError?: string | null
}

export type InventoryOccupancyProductSummary = {
  productId: number
  name: string
  slug: string
  sku: string
  status: string
  trackInventory: boolean
  allowBackorder: boolean
  stockQuantity: number
  unpaidReserved: number
  processingReserved: number
  paidReserved: number
  totalReserved: number
  availableQuantity: number
  hasBlockingRisk: boolean
  hasLowStockRisk: boolean
  orders: InventoryOccupancyOrderRow[]
}

function readProductId(value: number | Product | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id
  }

  return 0
}

function isReservableOrder(order: Pick<Order, 'status'>) {
  return order.status !== 'failed' && order.status !== 'refunded' && order.status !== 'cancelled'
}

export function buildInventoryOccupancySummary(products: Product[], orders: Order[]) {
  const summaries = new Map<number, InventoryOccupancyProductSummary>()

  for (const product of products) {
    summaries.set(product.id, {
      productId: product.id,
      name: product.name || '未命名商品',
      slug: product.slug || '',
      sku: product.sku || '未设置 SKU',
      status: product.status || 'draft',
      trackInventory: Boolean(product.trackInventory),
      allowBackorder: Boolean(product.allowBackorder),
      stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : 0,
      unpaidReserved: 0,
      processingReserved: 0,
      paidReserved: 0,
      totalReserved: 0,
      availableQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : 0,
      hasBlockingRisk: false,
      hasLowStockRisk: false,
      orders: [],
    })
  }

  for (const order of orders) {
    if (!isReservableOrder(order)) {
      continue
    }

    for (const item of order.items || []) {
      const productId = readProductId(item.product)
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0

      if (!productId || quantity <= 0) {
        continue
      }

      const summary = summaries.get(productId)

      if (!summary) {
        continue
      }

      if (order.paymentStatus === 'paid') {
        summary.paidReserved += quantity
      } else if (order.paymentStatus === 'processing') {
        summary.processingReserved += quantity
      } else {
        summary.unpaidReserved += quantity
      }

      summary.orders.push({
        id: order.id,
        orderNo: order.orderNo,
        quantity,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        customerName: order.customerName || '未填写联系人',
        customerPhone: order.customerPhone || '未填写手机号',
        totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : 0,
        deliveryMethod: order.deliveryMethod || 'digital',
        trackingNo: order.trackingNo || '',
        deliveryNote: order.deliveryNote || '',
        operatorNote: order.operatorNote || '',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paidAt: order.paidAt || '',
        paymentEvents: order.paymentEvents,
        paymentLastError: order.paymentLastError,
      })
    }
  }

  const result = Array.from(summaries.values()).map((summary) => {
    summary.totalReserved = summary.unpaidReserved + summary.processingReserved + summary.paidReserved
    summary.availableQuantity = Math.max(0, summary.stockQuantity - summary.totalReserved)
    summary.hasBlockingRisk =
      summary.trackInventory && !summary.allowBackorder && summary.status === 'active' && summary.availableQuantity <= 0
    summary.hasLowStockRisk =
      summary.trackInventory &&
      summary.status === 'active' &&
      (summary.hasBlockingRisk || (summary.availableQuantity > 0 && summary.availableQuantity <= 5))
    summary.orders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return summary
  })

  return result.sort((a, b) => {
    const riskDelta = Number(b.hasBlockingRisk) - Number(a.hasBlockingRisk)

    if (riskDelta !== 0) {
      return riskDelta
    }

    const lowStockDelta = Number(b.hasLowStockRisk) - Number(a.hasLowStockRisk)

    if (lowStockDelta !== 0) {
      return lowStockDelta
    }

    return b.totalReserved - a.totalReserved
  })
}

export function buildProductOrdersSummary(input: {
  product: Product
  orders: InventoryOccupancyOrderRow[]
}) {
  const activeOrders = input.orders.filter((order) => order.status !== 'cancelled' && order.status !== 'failed' && order.status !== 'refunded')
  const pendingPaymentOrders = activeOrders.filter((order) => order.paymentStatus === 'unpaid' || order.paymentStatus === 'processing')
  const pendingFulfillmentOrders = activeOrders.filter(
    (order) => order.paymentStatus === 'paid' && order.fulfillmentStatus !== 'completed',
  )
  const completedOrders = activeOrders.filter(
    (order) => order.paymentStatus === 'paid' && order.fulfillmentStatus === 'completed',
  )
  const exceptionOrders = input.orders.filter(
    (order) =>
      order.paymentStatus === 'failed' ||
      order.status === 'failed' ||
      order.paymentStatus === 'processing' ||
      order.paymentLastError,
  )

  const totalReserved = activeOrders.reduce((sum, order) => sum + order.quantity, 0)
  const paidReserved = pendingFulfillmentOrders.reduce((sum, order) => sum + order.quantity, 0)
  const processingReserved = activeOrders
    .filter((order) => order.paymentStatus === 'processing')
    .reduce((sum, order) => sum + order.quantity, 0)
  const unpaidReserved = activeOrders
    .filter((order) => order.paymentStatus === 'unpaid')
    .reduce((sum, order) => sum + order.quantity, 0)
  const paidRevenue = input.orders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0)
  const availableQuantity = Math.max(0, (typeof input.product.stockQuantity === 'number' ? input.product.stockQuantity : 0) - totalReserved)

  return {
    productId: input.product.id,
    productName: input.product.name || '未命名商品',
    sku: input.product.sku || '未设置 SKU',
    slug: input.product.slug || '',
    status: input.product.status || 'draft',
    trackInventory: Boolean(input.product.trackInventory),
    allowBackorder: Boolean(input.product.allowBackorder),
    stockQuantity: typeof input.product.stockQuantity === 'number' ? input.product.stockQuantity : 0,
    availableQuantity,
    totalOrders: input.orders.length,
    totalReserved,
    unpaidReserved,
    processingReserved,
    paidReserved,
    paidRevenue,
    pendingPaymentOrders,
    pendingFulfillmentOrders,
    exceptionOrders,
    completedOrders,
  }
}
