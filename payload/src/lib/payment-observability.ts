import type { OrderPaymentEvent } from '@/lib/orders'
import { getRecentOrdersForPaymentObservability } from '@/lib/orders'

export type PaymentObservabilityEventFilter =
  | 'all'
  | 'notify_received'
  | 'notify_invalid'
  | 'notify_error'
  | 'return_paid'
  | 'review_requested'

export type PaymentObservabilityEntry = {
  orderId: number
  orderNo: string
  orderStatus: string
  paymentStatus: string
  updatedAt: string
  lastEventAt: string
  source: OrderPaymentEvent['source']
  type: OrderPaymentEvent['type']
  status: string
  message: string
  payload?: Record<string, unknown>
}

export type PaymentObservabilitySummary = {
  totalEntries: number
  notifyReceivedCount: number
  notifyInvalidCount: number
  notifyErrorCount: number
  returnSuccessCount: number
  reviewRequestedCount: number
}

export async function getPaymentObservability(input?: {
  limit?: number
  orderNo?: string
  eventFilter?: PaymentObservabilityEventFilter
}) {
  const limit = Math.max(input?.limit ?? 12, 12)
  const orderNoKeyword = input?.orderNo?.trim().toUpperCase() ?? ''
  const eventFilter = input?.eventFilter ?? 'all'
  const orders = await getRecentOrdersForPaymentObservability(Math.max(limit, 12))
  const entries: PaymentObservabilityEntry[] = []

  for (const order of orders) {
    if (orderNoKeyword && !order.orderNo.toUpperCase().includes(orderNoKeyword)) {
      continue
    }

    const events = parsePaymentEvents(order.paymentEvents)

    for (const event of events) {
      if (!isPaymentObservabilityEvent(event)) {
        continue
      }

      if (!matchesEventFilter(event, eventFilter)) {
        continue
      }

      entries.push({
        orderId: order.id,
        orderNo: order.orderNo,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
        lastEventAt: event.createdAt,
        source: event.source,
        type: event.type,
        status: event.status || '',
        message: event.message,
        payload: event.payload,
      })
    }
  }

  const sortedEntries = entries
    .sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime())
    .slice(0, limit)

  const summary = sortedEntries.reduce<PaymentObservabilitySummary>(
    (acc, item) => {
      acc.totalEntries += 1

      if (item.type === 'notify_received') {
        acc.notifyReceivedCount += 1
      }

      if (item.type === 'notify_invalid') {
        acc.notifyInvalidCount += 1
      }

      if (item.type === 'notify_error') {
        acc.notifyErrorCount += 1
      }

      if (item.source === 'alipay-return' && item.type === 'payment_paid') {
        acc.returnSuccessCount += 1
      }

      if (item.type === 'payment_review_requested') {
        acc.reviewRequestedCount += 1
      }

      return acc
    },
    {
      totalEntries: 0,
      notifyReceivedCount: 0,
      notifyInvalidCount: 0,
      notifyErrorCount: 0,
      returnSuccessCount: 0,
      reviewRequestedCount: 0,
    },
  )

  return {
    activeOrderNoKeyword: orderNoKeyword,
    activeEventFilter: eventFilter,
    entries: sortedEntries,
    summary,
  }
}

function isPaymentObservabilityEvent(event: OrderPaymentEvent) {
  return (
    event.source === 'alipay-notify' ||
    event.source === 'alipay-return' ||
    event.type === 'payment_review_requested' ||
    event.type === 'notify_invalid' ||
    event.type === 'notify_received' ||
    event.type === 'notify_error'
  )
}

function parsePaymentEvents(value: unknown): OrderPaymentEvent[] {
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

function matchesEventFilter(event: OrderPaymentEvent, filter: PaymentObservabilityEventFilter) {
  switch (filter) {
    case 'notify_received':
      return event.type === 'notify_received'
    case 'notify_invalid':
      return event.type === 'notify_invalid'
    case 'notify_error':
      return event.type === 'notify_error'
    case 'return_paid':
      return event.source === 'alipay-return' && event.type === 'payment_paid'
    case 'review_requested':
      return event.type === 'payment_review_requested'
    case 'all':
    default:
      return true
  }
}
