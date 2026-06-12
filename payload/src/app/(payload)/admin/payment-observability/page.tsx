import Link from 'next/link'
import { getPaymentObservability } from '@/lib/payment-observability'
import { formatEventStatus, formatOrderStatus, formatPaymentStatus, labelEventSource, labelEventType } from '@/lib/order-status'

const filterOptions = [
  { value: 'all', label: '全部事件' },
  { value: 'notify_received', label: '仅看收到 notify' },
  { value: 'notify_invalid', label: '仅看无效 notify' },
  { value: 'notify_error', label: '仅看 notify 异常' },
  { value: 'return_paid', label: '仅看同步回跳成功' },
  { value: 'review_requested', label: '仅看主动查单' },
] as const

export default async function PaymentObservabilityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = (await searchParams) || {}
  const orderNo = readSingleParam(resolvedSearchParams.orderNo)
  const eventFilter = normalizeEventFilter(readSingleParam(resolvedSearchParams.event))
  const observability = await getPaymentObservability({
    limit: 36,
    orderNo,
    eventFilter,
  })
  const activeFilterMeta = filterOptions.find((item) => item.value === observability.activeEventFilter) || filterOptions[0]

  return (
    <main
      style={{
        padding: 24,
        display: 'grid',
        gap: 20,
        background: '#f5f5f3',
        minHeight: '100vh',
      }}
    >
      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          background: '#fff',
          padding: 24,
        }}
      >
        <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Payment Observability
        </p>
        <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>支付回调观测页</h1>
        <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          聚合最近订单中的支付宝回跳、异步通知、主动查单和无效回调记录，联调时可以直接判断问题发生在哪个链路节点。
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href="/admin/payment-readiness" style={buttonPrimary}>
            支付联调就绪页
          </Link>
          <Link href="/payment-diagnostics" style={buttonSecondary}>
            前台诊断页
          </Link>
          <Link href="/admin/orders-workbench" style={buttonSecondary}>
            订单工作台
          </Link>
        </div>
      </section>

      <section style={gridStyle}>
        <MetricCard label="当前结果数" value={String(observability.summary.totalEntries)} tone="#1d1a17" />
        <MetricCard label="收到 notify" value={String(observability.summary.notifyReceivedCount)} tone="#265b35" />
        <MetricCard label="无效 notify" value={String(observability.summary.notifyInvalidCount)} tone="#b42318" />
        <MetricCard label="notify 异常" value={String(observability.summary.notifyErrorCount)} tone="#8a2f16" />
        <MetricCard label="同步回跳成功" value={String(observability.summary.returnSuccessCount)} tone="#1d1a17" />
        <MetricCard label="主动查单记录" value={String(observability.summary.reviewRequestedCount)} tone="#8a5b12" />
      </section>

      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          background: '#fff',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>筛选排查</h2>
          <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>
            支持按订单号和事件类型直接收敛范围，处理线上异常时不需要反复翻工作台和原始事件。
          </p>
        </div>

        <form method="get" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label style={fieldStyle}>
            订单号关键词
            <input
              type="text"
              name="orderNo"
              defaultValue={orderNo}
              placeholder="例如 GC17812031514971935"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            事件类型
            <select name="event" defaultValue={observability.activeEventFilter} style={inputStyle}>
              {filterOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            应用筛选
            <button type="submit" style={buttonPrimary}>
              重新筛选
            </button>
          </label>
        </form>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/payment-observability" style={buttonSecondary}>
            清空筛选
          </Link>
          <Link href={buildQuickFilterHref('notify_invalid')} style={smallButtonSecondary}>
            仅看无效 notify
          </Link>
          <Link href={buildQuickFilterHref('notify_error')} style={smallButtonSecondary}>
            仅看 notify 异常
          </Link>
          <Link href={buildQuickFilterHref('review_requested')} style={smallButtonSecondary}>
            仅看主动查单
          </Link>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: '#faf8f7',
            padding: '14px 16px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          当前条件：事件类型为“{activeFilterMeta.label}”
          {observability.activeOrderNoKeyword ? `，订单号包含 “${observability.activeOrderNoKeyword}”` : '，未限制订单号'}
          。
        </div>
      </section>

      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          background: '#fff',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>最近支付链路记录</h2>
          <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>
            这里优先展示最有联调价值的事件，不再只看原始 JSON。
          </p>
        </div>

        {observability.entries.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {observability.entries.map((entry, index) => (
              <article
                key={`${entry.orderNo}-${entry.lastEventAt}-${entry.type}-${index}`}
                style={{
                  border: '1px solid rgba(20,20,20,0.08)',
                  borderRadius: 18,
                  padding: '16px 18px',
                  display: 'grid',
                  gap: 10,
                  background: getEventBackground(entry.type),
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <strong style={{ fontSize: 18 }}>{entry.orderNo}</strong>
                    <span style={{ color: '#6f6661', fontSize: 13 }}>
                      {labelEventSource(entry.source)} / {labelEventType(entry.type)} / {formatEventStatus(entry.status)}
                    </span>
                  </div>
                  <span style={{ color: '#6f6661', fontSize: 13 }}>{formatDate(entry.lastEventAt)}</span>
                </div>

                <div style={{ color: '#4f4742', lineHeight: 1.7 }}>{entry.message}</div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#5c5048', fontSize: 13 }}>
                  <span>订单状态：{formatOrderStatus(entry.orderStatus)}</span>
                  <span>支付状态：{formatPaymentStatus(entry.paymentStatus)}</span>
                  <span>订单更新时间：{formatDate(entry.updatedAt)}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link href={`/orders/${entry.orderNo}`} style={smallButtonPrimary}>
                    前台订单页
                  </Link>
                  <Link href={`/admin/collections/orders/${entry.orderId}`} style={smallButtonSecondary}>
                    Payload 编辑页
                  </Link>
                  <Link href={`/admin/collections/orders/${entry.orderId}/payment-events`} style={smallButtonSecondary}>
                    完整时间线
                  </Link>
                </div>

                {entry.payload ? (
                  <pre
                    style={{
                      margin: 0,
                      padding: 14,
                      borderRadius: 16,
                      background: '#fff',
                      color: '#4f4742',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 16,
              background: '#f7f7f6',
              padding: '16px 18px',
              color: '#4f4742',
              lineHeight: 1.7,
            }}
          >
            当前还没有可观测的支付回调或查单记录。
          </div>
        )}
      </section>
    </main>
  )
}

function getEventBackground(type: string) {
  if (type === 'notify_invalid' || type === 'notify_error') {
    return '#fff7f6'
  }

  if (type === 'notify_received') {
    return '#f4fbf6'
  }

  if (type === 'payment_review_requested') {
    return '#fffaf2'
  }

  return '#fff'
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function readSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function normalizeEventFilter(value: string) {
  const matched = filterOptions.find((item) => item.value === value)
  return matched ? matched.value : 'all'
}

function buildQuickFilterHref(filter: (typeof filterOptions)[number]['value']) {
  return `/admin/payment-observability?event=${encodeURIComponent(filter)}`
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        background: '#fff',
        padding: 20,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 30, fontWeight: 700, color: tone }}>{value}</p>
    </article>
  )
}

const gridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
} as const

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

const fieldStyle = {
  display: 'grid',
  gap: 6,
  color: '#4f4742',
  fontSize: 13,
} as const

const inputStyle = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid rgba(20,20,20,0.12)',
  background: '#fff',
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
} as const

const smallButtonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 108,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
} as const

const smallButtonSecondary = {
  ...smallButtonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
