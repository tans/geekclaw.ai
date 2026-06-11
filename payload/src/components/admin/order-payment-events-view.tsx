import type { DocumentViewServerProps } from 'payload'
import type { OrderPaymentEvent } from '@/lib/orders'

export default async function OrderPaymentEventsView(props: DocumentViewServerProps) {
  const paymentEvents = parsePaymentEvents(props.doc?.paymentEvents)
  const paymentLastError = typeof props.doc?.paymentLastError === 'string' ? props.doc.paymentLastError : ''
  const paymentStatus = typeof props.doc?.paymentStatus === 'string' ? props.doc.paymentStatus : '-'
  const orderNo = typeof props.doc?.orderNo === 'string' ? props.doc.orderNo : '-'

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
          订单号：{orderNo} / 当前支付状态：{paymentStatus}
        </p>
        <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          最近错误：{paymentLastError || '-'}
        </p>
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

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}
