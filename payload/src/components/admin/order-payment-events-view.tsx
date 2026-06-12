import type { DocumentViewServerProps } from 'payload'
import type { OrderPaymentEvent } from '@/lib/orders'
import { summarizePaymentChain } from '@/lib/payment-chain'
import { formatEventStatus, formatOrderStatus, formatPaymentStatus, labelEventSource, labelEventType } from '@/lib/order-status'

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
  const chainSummary = summarizePaymentChain(paymentEvents)
  const orderId = typeof props.doc?.id === 'number' ? props.doc.id : 0
  const chainOverview = buildChainOverview(chainSummary)

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
          订单号：{orderNo} / 当前支付状态：{formatPaymentStatus(paymentStatus)} / 订单状态：{formatOrderStatus(orderStatus)}
        </p>
        <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          最近错误：{paymentLastError || '-'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          {orderId ? (
            <a href={`/orders/${orderNo}`} style={buttonPrimary}>
              打开前台订单页
            </a>
          ) : null}
          <a href="/admin/payment-observability" style={buttonSecondary}>
            支付回调观测页
          </a>
          <a href="/admin/payment-readiness" style={buttonSecondary}>
            支付联调就绪页
          </a>
        </div>
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
        <SummaryCard label="链路总览" value={chainOverview.value} note={chainOverview.note} />
        <SummaryCard
          label="同步回跳"
          value={chainSummary.lastReturn ? '已收到回跳' : '暂无回跳'}
          note={chainSummary.lastReturn ? formatEventLine(chainSummary.lastReturn) : '当前还没有支付宝回跳记录'}
        />
        <SummaryCard
          label="异步通知"
          value={formatNotifyState(chainSummary.notifyState)}
          note={
            chainSummary.notifyState === 'success'
              ? formatEventLine(chainSummary.lastNotifyReceived as OrderPaymentEvent)
              : chainSummary.notifyState === 'issue'
                ? `${formatEventLine(chainSummary.lastNotifyIssue as OrderPaymentEvent)}${formatPayloadHint(chainSummary.lastNotifyIssue?.payload)}`
                : '当前还没有支付宝 notify 记录'
          }
        />
        <SummaryCard
          label="主动查单"
          value={chainSummary.lastQuery ? '已有查单记录' : '暂无查单'}
          note={chainSummary.lastQuery ? `${formatEventLine(chainSummary.lastQuery)}${formatPayloadHint(chainSummary.lastQuery.payload)}` : '当前还没有支付复核查单记录'}
        />
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

      <section
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <ChainSegmentCard
          label="同步回跳"
          state={chainSummary.lastReturn ? '已收到回跳' : '暂无回跳'}
          note={chainSummary.lastReturn ? `${formatEventLine(chainSummary.lastReturn)}${formatPayloadHint(chainSummary.lastReturn.payload)}` : '当前还没有支付宝同步回跳记录。'}
          tone={chainSummary.lastReturn ? '#265b35' : '#6f6661'}
        />
        <ChainSegmentCard
          label="异步通知"
          state={formatNotifyState(chainSummary.notifyState)}
          note={
            chainSummary.notifyState === 'success'
              ? `${formatEventLine(chainSummary.lastNotifyReceived as OrderPaymentEvent)}${formatPayloadHint(chainSummary.lastNotifyReceived?.payload)}`
              : chainSummary.notifyState === 'issue'
                ? `${formatEventLine(chainSummary.lastNotifyIssue as OrderPaymentEvent)}${formatPayloadHint(chainSummary.lastNotifyIssue?.payload)}`
                : '当前还没有支付宝 notify 记录。'
          }
          tone={chainSummary.notifyState === 'issue' ? '#b42318' : chainSummary.notifyState === 'success' ? '#265b35' : '#6f6661'}
        />
        <ChainSegmentCard
          label="主动查单"
          state={chainSummary.lastQuery ? '已有查单记录' : '暂无查单'}
          note={chainSummary.lastQuery ? `${formatEventLine(chainSummary.lastQuery)}${formatPayloadHint(chainSummary.lastQuery.payload)}` : '当前还没有主动查单记录。'}
          tone={chainSummary.lastQuery ? '#8a5b12' : '#6f6661'}
        />
        <ChainSegmentCard
          label="最终结果"
          state={chainSummary.lastPaid ? '已确认支付成功' : chainSummary.lastFailed ? '已确认支付失败' : '尚未确认'}
          note={
            chainSummary.lastPaid
              ? `${formatEventLine(chainSummary.lastPaid)}${formatPayloadHint(chainSummary.lastPaid.payload)}`
              : chainSummary.lastFailed
                ? `${formatEventLine(chainSummary.lastFailed)}${formatPayloadHint(chainSummary.lastFailed.payload)}`
                : '当前还没有支付结果确认记录。'
          }
          tone={chainSummary.lastFailed ? '#b42318' : chainSummary.lastPaid ? '#265b35' : '#6f6661'}
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

function formatNotifyState(value: 'success' | 'issue' | 'missing') {
  return (
    {
      success: '通知正常',
      issue: '通知异常',
      missing: '暂无通知',
    }[value] || value
  )
}

function buildChainOverview(summary: ReturnType<typeof summarizePaymentChain>) {
  if (summary.overallState === 'attention') {
    return {
      value: '链路需关注',
      note: `回跳：${summary.lastReturn ? '已收到' : '暂无'} / 通知：${formatNotifyState(summary.notifyState)} / 查单：${summary.lastQuery ? '已有记录' : '暂无'}`,
    }
  }

  if (summary.overallState === 'healthy') {
    return {
      value: '链路有记录',
      note: `回跳：${summary.lastReturn ? '已收到' : '暂无'} / 通知：${formatNotifyState(summary.notifyState)} / 查单：${summary.lastQuery ? '已有记录' : '暂无'}`,
    }
  }

  return {
    value: '链路尚未启动',
    note: '当前还没有回跳、notify 或查单记录。',
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

function ChainSegmentCard(props: { label: string; state: string; note: string; tone: string }) {
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
      <h2 style={{ margin: '10px 0 0', fontSize: 20, lineHeight: 1.3, color: props.tone }}>{props.state}</h2>
      <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>{props.note || '-'}</p>
    </article>
  )
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 148,
  padding: '12px 18px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
} as const

const buttonSecondary = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
