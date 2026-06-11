import type { DocumentViewServerProps } from 'payload'
import type { OrderPaymentEvent } from '@/lib/orders'

export default async function OrderPaymentEventsView(props: DocumentViewServerProps) {
  const paymentEvents = parsePaymentEvents(props.doc?.paymentEvents)
  const paymentLastError = typeof props.doc?.paymentLastError === 'string' ? props.doc.paymentLastError : ''
  const paymentStatus = typeof props.doc?.paymentStatus === 'string' ? props.doc.paymentStatus : '-'
  const orderStatus = typeof props.doc?.status === 'string' ? props.doc.status : '-'
  const orderNo = typeof props.doc?.orderNo === 'string' ? props.doc.orderNo : '-'
  const paymentProvider = typeof props.doc?.paymentProvider === 'string' ? props.doc.paymentProvider : '-'
  const paymentOrderNo = typeof props.doc?.paymentOrderNo === 'string' ? props.doc.paymentOrderNo : '-'
  const paymentTradeNo = typeof props.doc?.paymentTradeNo === 'string' ? props.doc.paymentTradeNo : '-'
  const paidAt = typeof props.doc?.paidAt === 'string' ? props.doc.paidAt : ''
  const summary = summarizeEvents(paymentEvents)

  return (
    <div
      style={{
        padding: 24,
        display: 'grid',
        gap: 20,
      }}
    >
      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 20,
          background: '#fff',
          padding: 24,
        }}
      >
        <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Order Timeline
        </p>
        <h1 style={{ margin: '14px 0 0', fontSize: 28 }}>订单事件时间线</h1>
        <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          订单号：{orderNo} / 当前支付状态：{labelPaymentStatus(paymentStatus)} / 订单状态：{labelOrderStatus(orderStatus)}
        </p>
        <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          最近错误：{paymentLastError || '-'}
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <SummaryCard label="支付通道" value={paymentProvider} note={`商户订单号：${paymentOrderNo}`} />
        <SummaryCard label="交易号" value={paymentTradeNo} note={paidAt ? `支付时间：${formatDate(paidAt)}` : '尚未记录支付时间'} />
        <SummaryCard
          label="最近成功事件"
          value={summary.lastSuccess ? labelEventType(summary.lastSuccess.type) : '-'}
          note={summary.lastSuccess ? formatEventLine(summary.lastSuccess) : '暂无成功支付事件'}
        />
        <SummaryCard
          label="最近发起事件"
          value={summary.lastInitiated ? labelEventType(summary.lastInitiated.type) : '-'}
          note={summary.lastInitiated ? formatEventLine(summary.lastInitiated) : '暂无支付发起记录'}
        />
        <SummaryCard
          label="最近异常"
          value={summary.lastInvalid ? labelEventType(summary.lastInvalid.type) : paymentLastError ? '支付异常' : '-'}
          note={
            summary.lastInvalid
              ? `${formatEventLine(summary.lastInvalid)}${formatPayloadHint(summary.lastInvalid.payload)}`
              : paymentLastError || '暂无无效回调或显式异常'
          }
        />
        <SummaryCard
          label="最近失败事件"
          value={summary.lastFailed ? labelEventType(summary.lastFailed.type) : '-'}
          note={summary.lastFailed ? `${formatEventLine(summary.lastFailed)}${formatPayloadHint(summary.lastFailed.payload)}` : '暂无失败事件'}
        />
      </section>

      <section style={{ display: 'grid', gap: 14 }}>
        {paymentEvents.length ? (
          paymentEvents
            .slice()
            .reverse()
            .map((event, index) => (
              <article
                key={`${event.createdAt}-${event.type}-${index}`}
                style={{
                  border: '1px solid rgba(20,20,20,0.08)',
                  borderRadius: 20,
                  background: '#fff',
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{event.type}</strong>
                  <span style={{ color: '#6f6661' }}>{formatDate(event.createdAt)}</span>
                </div>
                <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.8 }}>{event.message}</p>
                <p style={{ margin: '8px 0 0', color: '#6f6661' }}>
                  来源：{event.source} / 状态：{event.status || '-'}
                </p>
                {event.payload ? (
                  <pre
                    style={{
                      margin: '12px 0 0',
                      padding: 14,
                      borderRadius: 16,
                      background: '#faf5f3',
                      color: '#4f4742',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))
        ) : (
          <div
            style={{
              borderRadius: 16,
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              padding: 20,
              color: '#4f4742',
            }}
          >
            当前没有订单事件记录。
          </div>
        )}
      </section>
    </div>
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

function summarizeEvents(events: OrderPaymentEvent[]) {
  const ordered = events
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    lastSuccess: ordered.find((event) => event.type === 'payment_paid'),
    lastInitiated: ordered.find((event) => event.type === 'payment_initiated'),
    lastInvalid: ordered.find((event) => event.type === 'notify_invalid' || event.type === 'notify_error'),
    lastFailed: ordered.find((event) => event.type === 'payment_failed'),
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function formatEventLine(event: OrderPaymentEvent) {
  return `${formatDate(event.createdAt)} / ${labelEventSource(event.source)} / ${event.status || '-'}`
}

function formatPayloadHint(payload: OrderPaymentEvent['payload']) {
  if (!payload) {
    return ''
  }

  const parts = [
    pickPayloadValue(payload, ['trade_status']),
    pickPayloadValue(payload, ['msg']),
    pickPayloadValue(payload, ['sub_msg']),
    pickPayloadValue(payload, ['reason']),
  ].filter(Boolean)

  return parts.length ? ` / ${parts.join(' / ')}` : ''
}

function pickPayloadValue(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) {
      return `${key}: ${value}`
    }
  }

  return ''
}

function labelPaymentStatus(value: string) {
  return (
    {
      unpaid: '未支付',
      processing: '支付中',
      paid: '支付成功',
      failed: '支付失败',
      refunded: '已退款',
    }[value] || value
  )
}

function labelOrderStatus(value: string) {
  return (
    {
      pending: '待支付',
      paid: '已支付',
      failed: '支付失败',
      cancelled: '已取消',
      refunded: '已退款',
    }[value] || value
  )
}

function labelEventType(value: OrderPaymentEvent['type']) {
  return (
    {
      payment_initiated: '支付发起',
      payment_paid: '支付成功',
      payment_failed: '支付失败',
      notify_invalid: '无效回调',
      notify_received: '收到回调',
      notify_error: '回调异常',
      order_cancelled: '订单取消',
      order_expired: '订单超时关闭',
      payment_review_requested: '支付复核',
      fulfillment_updated: '履约更新',
      operator_note_updated: '运营备注更新',
    }[value] || value
  )
}

function labelEventSource(value: OrderPaymentEvent['source']) {
  return (
    {
      checkout: '结账页',
      mock: 'Mock',
      'alipay-notify': '支付宝回调',
      'alipay-return': '支付宝返回页',
      fulfillment: '履约操作',
      operator: '运营操作',
      system: '系统',
    }[value] || value
  )
}

function SummaryCard(props: { label: string; value: string; note: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 18,
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#8a5a44',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {props.label}
      </p>
      <h2 style={{ margin: '10px 0 0', fontSize: 20, lineHeight: 1.3 }}>{props.value || '-'}</h2>
      <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>{props.note || '-'}</p>
    </article>
  )
}
