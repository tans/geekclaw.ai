import type { OrderPaymentEvent } from '@/lib/orders'

export type PaymentChainSummary = {
  lastReturn: OrderPaymentEvent | null
  lastNotifyReceived: OrderPaymentEvent | null
  lastNotifyIssue: OrderPaymentEvent | null
  lastQuery: OrderPaymentEvent | null
  lastPaid: OrderPaymentEvent | null
  lastFailed: OrderPaymentEvent | null
  returnState: 'success' | 'missing'
  notifyState: 'success' | 'issue' | 'missing'
  queryState: 'requested' | 'missing'
  overallState: 'healthy' | 'attention' | 'idle'
}

export function parseOrderPaymentEvents(value: unknown): OrderPaymentEvent[] {
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

export function summarizePaymentChain(events: OrderPaymentEvent[]): PaymentChainSummary {
  const ordered = events
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const lastReturn =
    ordered.find((event) => event.source === 'alipay-return' || hasPayloadKeys(event.payload, ['provider'], ['alipay-return'])) || null
  const lastNotifyReceived = ordered.find((event) => event.type === 'notify_received') || null
  const lastNotifyIssue = ordered.find((event) => event.type === 'notify_invalid' || event.type === 'notify_error') || null
  const lastQuery = ordered.find((event) => event.type === 'payment_review_requested') || null
  const lastPaid = ordered.find((event) => event.type === 'payment_paid') || null
  const lastFailed = ordered.find((event) => event.type === 'payment_failed') || null

  const returnState = lastReturn ? 'success' : 'missing'
  const notifyState = lastNotifyReceived ? 'success' : lastNotifyIssue ? 'issue' : 'missing'
  const queryState = lastQuery ? 'requested' : 'missing'

  let overallState: PaymentChainSummary['overallState'] = 'idle'

  if (lastNotifyIssue || lastFailed) {
    overallState = 'attention'
  } else if (lastReturn || lastNotifyReceived || lastQuery || lastPaid) {
    overallState = 'healthy'
  }

  return {
    lastReturn,
    lastNotifyReceived,
    lastNotifyIssue,
    lastQuery,
    lastPaid,
    lastFailed,
    returnState,
    notifyState,
    queryState,
    overallState,
  }
}

function hasPayloadKeys(payload: OrderPaymentEvent['payload'], keys: string[], values: string[]) {
  if (!payload) {
    return false
  }

  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && values.includes(value)) {
      return true
    }
  }

  return false
}
