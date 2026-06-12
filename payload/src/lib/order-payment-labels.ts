import type { OrderPaymentEvent } from '@/lib/orders'
import { parseOrderPaymentEvents, summarizePaymentChain } from '@/lib/payment-chain'

export type OrderPaymentChainTag = 'notify_issue' | 'missing_return' | 'queried' | 'result_missing'

export function deriveOrderPaymentChainLabels(input: {
  paymentEvents?: unknown
  paymentLastError?: string | null
}) {
  const events = parseOrderPaymentEvents(input.paymentEvents)
  const summary = summarizePaymentChain(events)
  const tags: OrderPaymentChainTag[] = []

  if (summary.notifyState === 'issue') {
    tags.push('notify_issue')
  }

  if (!summary.lastReturn) {
    tags.push('missing_return')
  }

  if (summary.lastQuery) {
    tags.push('queried')
  }

  if (!summary.lastPaid && !summary.lastFailed) {
    tags.push('result_missing')
  }

  return {
    tags,
    summary,
    hasPaymentIssue: summary.overallState === 'attention' || Boolean(input.paymentLastError?.trim()),
    hasNotifyIssue: summary.notifyState === 'issue',
    hasReturnRecord: Boolean(summary.lastReturn),
    hasQueryRecord: Boolean(summary.lastQuery),
    hasFinalResult: Boolean(summary.lastPaid || summary.lastFailed),
  }
}

export function buildOrderPaymentChainFieldPatch(input: {
  paymentEvents?: unknown
  paymentLastError?: string | null
}) {
  const derived = deriveOrderPaymentChainLabels(input)

  return {
    paymentChainTags: derived.tags,
    paymentHasIssue: derived.hasPaymentIssue,
    paymentHasNotifyIssue: derived.hasNotifyIssue,
    paymentHasReturnRecord: derived.hasReturnRecord,
    paymentHasQueryRecord: derived.hasQueryRecord,
    paymentHasFinalResult: derived.hasFinalResult,
  }
}

export function mapWorkbenchFilterToChainTag(filter: 'notify-issue' | 'missing-return' | 'queried' | 'result-missing') {
  return (
    {
      'notify-issue': 'notify_issue',
      'missing-return': 'missing_return',
      queried: 'queried',
      'result-missing': 'result_missing',
    }[filter] as OrderPaymentChainTag
  )
}

export function eventPayloadHasPaymentChainContext(event: OrderPaymentEvent) {
  return Boolean(event.payload && typeof event.payload === 'object')
}
