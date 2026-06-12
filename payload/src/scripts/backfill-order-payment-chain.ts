import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { ensureOrdersSchema } from '../lib/order-schema.ts'

type RawOrderRow = {
  id: number
  payment_events: string | null
  payment_last_error: string | null
}

function getDatabasePath() {
  const configured = process.env.DATABASE_URI

  if (configured?.startsWith('file:')) {
    return configured.slice(5)
  }

  if (configured && !configured.includes(':')) {
    return configured
  }

  return path.resolve(process.cwd(), '.payload/geekclaw.db')
}

function run() {
  ensureOrdersSchema()
  const db = new DatabaseSync(getDatabasePath())

  try {
    const orders = db.prepare('select id, payment_events, payment_last_error from orders').all() as RawOrderRow[]
    const update = db.prepare(`
      update orders
      set
        payment_chain_tags = ?,
        payment_has_issue = ?,
        payment_has_notify_issue = ?,
        payment_has_return_record = ?,
        payment_has_query_record = ?,
        payment_has_final_result = ?
      where id = ?
    `)

    for (const order of orders) {
      const patch = buildOrderPaymentChainFieldPatch({
        paymentEvents: order.payment_events,
        paymentLastError: order.payment_last_error,
      })

      update.run(
        JSON.stringify(patch.paymentChainTags),
        patch.paymentHasIssue ? 1 : 0,
        patch.paymentHasNotifyIssue ? 1 : 0,
        patch.paymentHasReturnRecord ? 1 : 0,
        patch.paymentHasQueryRecord ? 1 : 0,
        patch.paymentHasFinalResult ? 1 : 0,
        order.id,
      )
    }

    console.log(`backfilled ${orders.length} orders`)
  } finally {
    db.close()
  }
}

function buildOrderPaymentChainFieldPatch(input: {
  paymentEvents?: unknown
  paymentLastError?: string | null
}) {
  const summary = summarizePaymentChain(parseOrderPaymentEvents(input.paymentEvents))
  const paymentChainTags: string[] = []

  if (summary.notifyState === 'issue') {
    paymentChainTags.push('notify_issue')
  }

  if (!summary.lastReturn) {
    paymentChainTags.push('missing_return')
  }

  if (summary.lastQuery) {
    paymentChainTags.push('queried')
  }

  if (!summary.lastPaid && !summary.lastFailed) {
    paymentChainTags.push('result_missing')
  }

  return {
    paymentChainTags,
    paymentHasIssue: summary.overallState === 'attention' || Boolean(input.paymentLastError?.trim()),
    paymentHasNotifyIssue: summary.notifyState === 'issue',
    paymentHasReturnRecord: Boolean(summary.lastReturn),
    paymentHasQueryRecord: Boolean(summary.lastQuery),
    paymentHasFinalResult: Boolean(summary.lastPaid || summary.lastFailed),
  }
}

function parseOrderPaymentEvents(value: unknown) {
  if (Array.isArray(value)) {
    return value as Array<Record<string, unknown>>
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : []
    } catch {
      return []
    }
  }

  return []
}

function summarizePaymentChain(events: Array<Record<string, unknown>>) {
  const ordered = events
    .slice()
    .sort((a, b) => new Date(String(b.createdAt || '')).getTime() - new Date(String(a.createdAt || '')).getTime())

  const lastReturn =
    ordered.find(
      (event) =>
        event.source === 'alipay-return' ||
        (event.payload &&
          typeof event.payload === 'object' &&
          'provider' in (event.payload as Record<string, unknown>) &&
          (event.payload as Record<string, unknown>).provider === 'alipay-return'),
    ) || null
  const lastNotifyReceived = ordered.find((event) => event.type === 'notify_received') || null
  const lastNotifyIssue = ordered.find((event) => event.type === 'notify_invalid' || event.type === 'notify_error') || null
  const lastQuery = ordered.find((event) => event.type === 'payment_review_requested') || null
  const lastPaid = ordered.find((event) => event.type === 'payment_paid') || null
  const lastFailed = ordered.find((event) => event.type === 'payment_failed') || null

  let overallState: 'healthy' | 'attention' | 'idle' = 'idle'

  if (lastNotifyIssue || lastFailed) {
    overallState = 'attention'
  } else if (lastReturn || lastNotifyReceived || lastQuery || lastPaid) {
    overallState = 'healthy'
  }

  return {
    lastReturn,
    lastQuery,
    lastPaid,
    lastFailed,
    notifyState: lastNotifyReceived ? 'success' : lastNotifyIssue ? 'issue' : 'missing',
    overallState,
  }
}

try {
  run()
} catch (error) {
  console.error(error)
  process.exit(1)
}
