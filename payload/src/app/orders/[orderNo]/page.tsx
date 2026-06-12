import type { ReactNode } from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { PaymentReviewActions } from '@/components/admin/payment-review-actions'
import { WorkbenchOrderActions } from '@/components/admin/workbench-order-actions'
import { CancelOrderButton } from '@/components/cancel-order-button'
import { MockPaymentActions } from '@/components/mock-payment-actions'
import { PageShell } from '@/components/page-shell'
import config from '@/payload.config'
import { hasRole } from '@/lib/access'
import type { OrderPaymentEvent } from '@/lib/orders'
import { getOrderByOrderNo } from '@/lib/orders'
import { parseOrderPaymentEvents, summarizePaymentChain } from '@/lib/payment-chain'
import {
  formatDeliveryMethod,
  formatEventStatus,
  formatOrderSource,
  formatPaymentMode,
  labelEventSource,
  labelEventType,
} from '@/lib/order-status'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>
}) {
  const { orderNo } = await params
  const order = await getOrderByOrderNo(orderNo)
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  const canManageCommerce = hasRole(auth.user, ['super-admin', 'ops'])
  const paymentDiagnostics = await getPaymentDiagnostics()

  if (!order) {
    notFound()
  }

  const firstItem = order.items[0]
  const productName =
    typeof firstItem?.product === 'object' && firstItem.product?.name
      ? firstItem.product.name
      : 'GeekClaw 商品'
  const quantity = firstItem?.quantity || 1
  const unitPrice = typeof firstItem?.unitPrice === 'number' ? firstItem.unitPrice : order.totalAmount
  const canRetryPayment =
    order.status !== 'cancelled' && order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded'
  const canCancelOrder = order.status !== 'cancelled' && order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded'
  const retryHref = canRetryPayment
    ? `/shop/checkout-success?orderNo=${encodeURIComponent(order.orderNo)}`
    : '/shop'
  const paymentEvents = parseOrderPaymentEvents(order.paymentEvents)
  const payloadEditHref = `/admin/collections/orders/${order.id}`
  const payloadEventsHref = `/admin/collections/orders/${order.id}/payment-events`
  const showPaymentReview = order.paymentStatus === 'processing'
  const showMockPaymentActions = paymentDiagnostics.mode === 'mock' && canRetryPayment
  const timelineSummary = summarizeTimeline(paymentEvents)
  const paymentChain = summarizePaymentChain(paymentEvents)
  const orderStatusMeta = getOrderStatusMeta(order.status)
  const paymentStatusMeta = getPaymentStatusMeta(order.paymentStatus)
  const fulfillmentStatusMeta = getFulfillmentStatusMeta(order.fulfillmentStatus)
  const deliveryMethodLabel = formatDeliveryMethod(order.deliveryMethod)
  const amountLabel = `¥${formatCurrency(order.totalAmount)}`

  return (
    <PageShell>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 20px 40px', display: 'grid', gap: 24 }}>
        <section
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: '1.25fr 0.95fr',
          }}
        >
          <article style={mainCard}>
            <p style={sectionEyebrow}>Order Detail</p>
            <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(30px, 5vw, 48px)' }}>订单详情</h1>
            <p style={{ margin: '12px 0 0', color: '#5c5048', lineHeight: 1.8 }}>
              聚合支付、履约、客户与事件流信息，方便客服和运营直接从订单页继续处理。
            </p>

            <div style={statusHeroGrid}>
              <StatusCard
                label="订单状态"
                value={orderStatusMeta.label}
                tone={orderStatusMeta.tone}
                note={orderStatusMeta.description}
              />
              <StatusCard
                label="支付状态"
                value={paymentStatusMeta.label}
                tone={paymentStatusMeta.tone}
                note={`${paymentStatusMeta.description} / 支付模式：${formatPaymentMode(paymentDiagnostics.mode)}`}
              />
              <StatusCard
                label="履约状态"
                value={fulfillmentStatusMeta.label}
                tone={fulfillmentStatusMeta.tone}
                note={`${fulfillmentStatusMeta.description} / 交付方式：${deliveryMethodLabel}`}
              />
              <StatusCard
                label="订单金额"
                value={amountLabel}
                tone="#1d1a17"
                note={`数量 ${quantity} / 单价 ¥${formatCurrency(unitPrice)}`}
              />
            </div>

            <div style={detailGrid}>
              <DetailBlock
                title="订单信息"
                rows={[
                  ['订单号', order.orderNo],
                  ['商品', productName],
                  ['订单来源', formatOrderSource(order.source)],
                  ['下单时间', formatDate(order.createdAt)],
                  ['支付时间', order.paidAt ? formatDate(order.paidAt) : '-'],
                ]}
              />
              <DetailBlock
                title="客户信息"
                rows={[
                  ['联系人', order.customerName || '-'],
                  ['手机号', order.customerPhone || '-'],
                  ['邮箱', order.customerEmail || '-'],
                  ['地址', order.shippingAddress || '-'],
                ]}
              />
            </div>
          </article>

          <aside style={sidebarCard}>
            <p style={{ margin: 0, color: '#6f6661' }}>状态摘要</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <Badge tone={orderStatusMeta.tone}>{orderStatusMeta.label}</Badge>
              <Badge tone={paymentStatusMeta.tone}>{paymentStatusMeta.label}</Badge>
              <Badge tone={fulfillmentStatusMeta.tone}>{fulfillmentStatusMeta.label}</Badge>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              <SummaryLine label="支付通道" value={formatPaymentMode(paymentDiagnostics.mode)} />
              <SummaryLine label="支付单号" value={order.paymentOrderNo || '-'} />
              <SummaryLine label="支付流水" value={order.paymentTradeNo || '-'} />
              <SummaryLine label="最近错误" value={order.paymentLastError || '-'} />
              <SummaryLine label="跟踪号" value={order.trackingNo || '-'} />
              <SummaryLine label="交付时间" value={order.fulfilledAt ? formatDate(order.fulfilledAt) : '-'} />
            </div>

            <div style={summaryPanel}>
              <p style={summaryPanelLabel}>履约备注</p>
              <p style={summaryPanelValue}>{order.deliveryNote || '-'}</p>
            </div>

            <div style={summaryPanel}>
              <p style={summaryPanelLabel}>运营备注</p>
              <p style={summaryPanelValue}>
                {typeof order.operatorNote === 'string' && order.operatorNote.trim() ? order.operatorNote : '-'}
              </p>
            </div>

            <div style={summaryPanel}>
              <p style={summaryPanelLabel}>Notify 回调地址</p>
              <p style={{ ...summaryPanelValue, wordBreak: 'break-all' }}>{paymentDiagnostics.notifyUrl.value}</p>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
              {canRetryPayment ? (
                <Link href={retryHref} style={buttonPrimary}>
                  继续支付
                </Link>
              ) : null}
              {canCancelOrder ? (
                <CancelOrderButton
                  orderNo={order.orderNo}
                  label="取消订单"
                  reason="用户在前台取消订单，库存占用已释放。"
                  source="shop"
                  variant="danger"
                />
              ) : null}
              <Link href="/payment-diagnostics" style={buttonSecondary}>
                支付配置诊断
              </Link>
              <Link href="/shop" style={buttonSecondary}>
                返回商城
              </Link>
            </div>
          </aside>
        </section>

        <section style={analyticsGrid}>
          <MetricChip
            label="支付链路总览"
            value={formatChainOverallState(paymentChain.overallState)}
            note={buildChainOverviewNote(paymentChain)}
          />
          <MetricChip
            label="最近事件"
            value={timelineSummary.lastEvent ? labelEventType(timelineSummary.lastEvent.type) : '暂无'}
            note={timelineSummary.lastEvent ? formatEventLine(timelineSummary.lastEvent) : '当前还没有事件流记录'}
          />
          <MetricChip
            label="最近支付动作"
            value={timelineSummary.lastPaymentAction ? labelEventType(timelineSummary.lastPaymentAction.type) : '暂无'}
            note={timelineSummary.lastPaymentAction ? formatEventLine(timelineSummary.lastPaymentAction) : '尚未有支付事件'}
          />
          <MetricChip
            label="最近履约动作"
            value={timelineSummary.lastFulfillment ? labelEventType(timelineSummary.lastFulfillment.type) : '暂无'}
            note={timelineSummary.lastFulfillment ? formatEventLine(timelineSummary.lastFulfillment) : '尚未有履约推进记录'}
          />
          <MetricChip
            label="最新异常"
            value={timelineSummary.lastIssue ? labelEventType(timelineSummary.lastIssue.type) : '无'}
            note={
              timelineSummary.lastIssue
                ? `${formatEventLine(timelineSummary.lastIssue)}${formatPayloadHint(timelineSummary.lastIssue.payload)}`
                : '最近没有失败、无效回调或显式异常'
            }
          />
        </section>

        <section style={mainCard}>
          <p style={sectionEyebrow}>Payment Chain</p>
          <h2 style={{ margin: '18px 0 0', fontSize: 28 }}>支付链路摘要</h2>
          <p style={{ margin: '12px 0 0', color: '#5c5048', lineHeight: 1.8 }}>
            把同步回跳、异步通知、主动查单和最终结果拆开看，联调时能更快知道卡在哪一步。
          </p>

          <div style={{ marginTop: 24, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <ChainCard
              label="同步回跳"
              state={formatReturnState(paymentChain.returnState)}
              note={paymentChain.lastReturn ? formatEventLine(paymentChain.lastReturn) : '当前还没有支付宝回跳记录'}
              tone={getChainTone(paymentChain.returnState === 'success' ? 'healthy' : 'idle')}
            />
            <ChainCard
              label="异步通知"
              state={formatNotifyState(paymentChain.notifyState)}
              note={
                paymentChain.notifyState === 'success'
                  ? formatEventLine(paymentChain.lastNotifyReceived as OrderPaymentEvent)
                  : paymentChain.notifyState === 'issue'
                    ? `${formatEventLine(paymentChain.lastNotifyIssue as OrderPaymentEvent)}${formatPayloadHint(paymentChain.lastNotifyIssue?.payload)}`
                    : '当前还没有 notify 记录'
              }
              tone={getChainTone(paymentChain.notifyState === 'issue' ? 'attention' : paymentChain.notifyState === 'success' ? 'healthy' : 'idle')}
            />
            <ChainCard
              label="主动查单"
              state={formatQueryState(paymentChain.queryState)}
              note={paymentChain.lastQuery ? `${formatEventLine(paymentChain.lastQuery)}${formatPayloadHint(paymentChain.lastQuery.payload)}` : '当前还没有查单记录'}
              tone={getChainTone(paymentChain.queryState === 'requested' ? 'healthy' : 'idle')}
            />
            <ChainCard
              label="最终结果"
              state={paymentChain.lastPaid ? '已确认支付成功' : paymentChain.lastFailed ? '已确认支付失败' : '尚未确认'}
              note={
                paymentChain.lastPaid
                  ? formatEventLine(paymentChain.lastPaid)
                  : paymentChain.lastFailed
                    ? `${formatEventLine(paymentChain.lastFailed)}${formatPayloadHint(paymentChain.lastFailed.payload)}`
                    : '当前还没有支付结果确认记录'
              }
              tone={getChainTone(paymentChain.lastFailed ? 'attention' : paymentChain.lastPaid ? 'healthy' : 'idle')}
            />
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          <article style={mainCard}>
            <p style={sectionEyebrow}>Admin Actions</p>
            <h2 style={{ margin: '18px 0 0', fontSize: 28 }}>后台处理</h2>
            <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
              在订单详情页直接推进支付复核、履约和运营备注，减少在多个后台页面间来回切换。
            </p>

            {canManageCommerce ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
                <Link href="/admin/orders-workbench" style={buttonPrimary}>
                  打开订单工作台
                </Link>
                <Link href={payloadEditHref} style={buttonSecondary}>
                  打开 Payload 编辑页
                </Link>
                <Link href={payloadEventsHref} style={buttonSecondary}>
                  查看后台时间线
                </Link>
              </div>
            ) : null}

            {canManageCommerce && showPaymentReview ? (
              <div style={adminBlock}>
                <h3 style={adminTitle}>支付复核</h3>
                <p style={adminText}>当前订单仍处于支付中，可先主动查单，再由运营确认到账或标记失败。</p>
                <PaymentReviewActions orderNo={order.orderNo} />
              </div>
            ) : null}

            {canManageCommerce && showMockPaymentActions ? (
              <div style={adminBlock}>
                <h3 style={adminTitle}>Mock 支付联调</h3>
                <p style={adminText}>当前环境仍是 mock 支付，可直接在这里模拟支付成功或失败，验证订单流转。</p>
                <MockPaymentActions orderNo={order.orderNo} />
              </div>
            ) : null}
          </article>

          <article style={mainCard}>
            <p style={sectionEyebrow}>Fulfillment</p>
            <h2 style={{ margin: '18px 0 0', fontSize: 28 }}>履约与备注</h2>
            <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
              适合客服在录单后直接填写交付信息、推进履约状态，或补充运营备注。
            </p>
            {canManageCommerce ? (
              <div style={{ marginTop: 20 }}>
                <WorkbenchOrderActions
                  orderNo={order.orderNo}
                  fulfillmentStatus={order.fulfillmentStatus}
                  deliveryMethod={order.deliveryMethod}
                  trackingNo={order.trackingNo}
                  deliveryNote={order.deliveryNote}
                  operatorNote={typeof order.operatorNote === 'string' ? order.operatorNote : ''}
                />
              </div>
            ) : (
              <p style={{ margin: '20px 0 0', color: '#6f6661', lineHeight: 1.8 }}>当前未登录具备商城权限的后台账号，因此不显示支付复核、履约和运营备注操作。</p>
            )}
          </article>
        </section>

        <section style={mainCard}>
          <p style={sectionEyebrow}>Order Timeline</p>
          <h2 style={{ margin: '18px 0 0', fontSize: 28 }}>订单事件时间线</h2>
          <p style={{ margin: '12px 0 0', color: '#5c5048', lineHeight: 1.8 }}>
            统一记录支付、履约、运营备注和系统动作。优先看最近事件和最新异常，再下钻具体 payload。
          </p>

          {paymentEvents.length ? (
            <div style={{ marginTop: 24, display: 'grid', gap: 14 }}>
              {paymentEvents
                .slice()
                .reverse()
                .map((event, index) => (
                  <article
                    key={`${event.createdAt}-${event.type}-${index}`}
                    style={{
                      border: '1px solid rgba(20,20,20,0.08)',
                      borderRadius: 20,
                      padding: 20,
                      background: getTimelineCardBackground(event),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>{labelEventType(event.type)}</strong>
                        <Badge tone={getEventTone(event)}>{labelEventSource(event.source)}</Badge>
                        <Badge tone={getEventTone(event, true)}>{formatEventStatus(event.status)}</Badge>
                      </div>
                      <span style={{ color: '#6f6661' }}>{formatDate(event.createdAt)}</span>
                    </div>
                    <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.8 }}>{event.message}</p>
                    {event.payload ? (
                      <pre
                        style={{
                          margin: '12px 0 0',
                          padding: 14,
                          borderRadius: 16,
                          background: '#ffffff',
                          color: '#4f4742',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: 13,
                          lineHeight: 1.7,
                          border: '1px solid rgba(20,20,20,0.06)',
                        }}
                      >
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    ) : null}
                  </article>
                ))}
            </div>
          ) : (
            <p style={{ margin: '20px 0 0', color: '#6f6661' }}>当前没有订单事件记录。</p>
          )}
        </section>
      </main>
    </PageShell>
  )
}

function summarizeTimeline(events: OrderPaymentEvent[]) {
  const ordered = events
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    lastEvent: ordered[0] || null,
    lastPaymentAction: ordered.find((event) =>
      [
        'payment_initiated',
        'payment_paid',
        'payment_failed',
        'payment_review_requested',
        'notify_received',
        'notify_invalid',
        'notify_error',
      ].includes(event.type),
    ),
    lastFulfillment: ordered.find((event) => event.type === 'fulfillment_updated'),
    lastIssue: ordered.find((event) =>
      ['payment_failed', 'notify_invalid', 'notify_error', 'order_cancelled', 'order_expired'].includes(event.type),
    ),
  }
}

function formatChainOverallState(value: 'healthy' | 'attention' | 'idle') {
  return (
    {
      healthy: '链路有记录',
      attention: '链路需关注',
      idle: '链路尚未启动',
    }[value] || value
  )
}

function buildChainOverviewNote(summary: ReturnType<typeof summarizePaymentChain>) {
  const parts = [
    `回跳：${formatReturnState(summary.returnState)}`,
    `通知：${formatNotifyState(summary.notifyState)}`,
    `查单：${formatQueryState(summary.queryState)}`,
  ]

  return parts.join(' / ')
}

function formatReturnState(value: 'success' | 'missing') {
  return value === 'success' ? '已收到回跳' : '暂无回跳'
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

function formatQueryState(value: 'requested' | 'missing') {
  return value === 'requested' ? '已有查单记录' : '暂无查单'
}

function getChainTone(value: 'healthy' | 'attention' | 'idle') {
  return (
    {
      healthy: '#265b35',
      attention: '#b42318',
      idle: '#6f6661',
    }[value] || '#6f6661'
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function formatCurrency(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '0'
}

function formatEventLine(event: OrderPaymentEvent) {
  return `${formatDate(event.createdAt)} / ${labelEventSource(event.source)} / ${formatEventStatus(event.status)}`
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

function getOrderStatusMeta(value: string | null | undefined) {
  switch (value) {
    case 'paid':
      return { label: '已支付', tone: '#265b35', description: '订单已经到账，后续重点转向履约交付。' }
    case 'failed':
      return { label: '支付失败', tone: '#b42318', description: '支付链路已失败，建议检查异常原因或重新收款。' }
    case 'cancelled':
      return { label: '已取消', tone: '#6f6661', description: '订单已经取消，库存占用应已释放。' }
    case 'refunded':
      return { label: '已退款', tone: '#7c4d12', description: '订单已退款，需关注售后与对账。' }
    case 'pending':
    default:
      return { label: '待支付', tone: '#8a5b12', description: '订单仍在支付阶段，需继续跟进付款结果。' }
  }
}

function getPaymentStatusMeta(value: string | null | undefined) {
  switch (value) {
    case 'paid':
      return { label: '支付成功', tone: '#265b35', description: '支付已确认到账。' }
    case 'failed':
      return { label: '支付失败', tone: '#b42318', description: '支付已明确失败，可继续排查或重建支付。' }
    case 'refunded':
      return { label: '已退款', tone: '#7c4d12', description: '支付已回退，需结合订单状态确认售后闭环。' }
    case 'processing':
      return { label: '支付中', tone: '#8a5b12', description: '支付仍在处理中，可主动查单或人工复核。' }
    case 'unpaid':
    default:
      return { label: '未支付', tone: '#6f6661', description: '尚未进入成功支付状态。' }
  }
}

function getFulfillmentStatusMeta(value: string | null | undefined) {
  switch (value) {
    case 'completed':
      return { label: '已完成', tone: '#265b35', description: '订单已完成交付。' }
    case 'shipped':
      return { label: '已发货/已交付', tone: '#0f766e', description: '订单已经发出或已交付，等待确认完成。' }
    case 'processing':
      return { label: '准备中', tone: '#8a5b12', description: '履约已启动，正在准备或处理中。' }
    case 'pending':
    default:
      return { label: '待处理', tone: '#6f6661', description: '尚未进入履约执行阶段。' }
  }
}

function getEventTone(event: OrderPaymentEvent, preferStatus = false) {
  if (event.type === 'payment_paid' || event.type === 'fulfillment_updated' || event.status === 'paid' || event.status === 'completed') {
    return '#265b35'
  }

  if (
    event.type === 'payment_failed' ||
    event.type === 'notify_invalid' ||
    event.type === 'notify_error' ||
    event.status === 'failed' ||
    event.status === 'cancelled'
  ) {
    return '#b42318'
  }

  if (event.type === 'payment_review_requested' || event.status === 'processing' || event.status === 'query_pending') {
    return '#8a5b12'
  }

  if (preferStatus) {
    return '#6f6661'
  }

  return '#0f766e'
}

function getTimelineCardBackground(event: OrderPaymentEvent) {
  if (event.type === 'payment_paid' || event.status === 'paid' || event.status === 'completed') {
    return '#f6fbf7'
  }

  if (event.type === 'payment_failed' || event.type === 'notify_invalid' || event.type === 'notify_error' || event.status === 'failed') {
    return '#fff7f6'
  }

  if (event.type === 'payment_review_requested' || event.status === 'processing' || event.status === 'query_pending') {
    return '#fffaf2'
  }

  return '#fff'
}

function StatusCard({
  label,
  value,
  tone,
  note,
}: {
  label: string
  value: string
  tone: string
  note: string
}) {
  return (
    <article
      style={{
        borderRadius: 22,
        background: '#faf5f3',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 18,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: '10px 0 0', color: '#5c5048', lineHeight: 1.7, fontSize: 13 }}>{note}</p>
    </article>
  )
}

function DetailBlock({
  title,
  rows,
}: {
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <article
      style={{
        borderRadius: 22,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 20,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'grid',
              gap: 4,
              paddingBottom: 10,
              borderBottom: '1px solid rgba(20,20,20,0.06)',
            }}
          >
            <span style={{ color: '#6f6661', fontSize: 13 }}>{label}</span>
            <span style={{ color: '#1d1a17', fontWeight: 600, lineHeight: 1.7 }}>{value}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(20,20,20,0.06)',
      }}
    >
      <span style={{ color: '#6f6661', fontSize: 13 }}>{label}</span>
      <span style={{ color: '#1d1a17', fontWeight: 600, lineHeight: 1.7 }}>{value}</span>
    </div>
  )
}

function MetricChip({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <article
      style={{
        borderRadius: 22,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 20,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 700 }}>{value}</p>
      <p style={{ margin: '10px 0 0', color: '#5c5048', lineHeight: 1.7, fontSize: 13 }}>{note}</p>
    </article>
  )
}

function ChainCard({
  label,
  state,
  note,
  tone,
}: {
  label: string
  state: string
  note: string
  tone: string
}) {
  return (
    <article
      style={{
        borderRadius: 22,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 20,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 700, color: tone }}>{state}</p>
      <p style={{ margin: '10px 0 0', color: '#5c5048', lineHeight: 1.7, fontSize: 13 }}>{note}</p>
    </article>
  )
}

function Badge({
  tone,
  children,
}: {
  tone: string
  children: ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 30,
        padding: '0 12px',
        borderRadius: 999,
        background: `${tone}14`,
        color: tone,
        fontWeight: 700,
        fontSize: 13,
        border: `1px solid ${tone}26`,
      }}
    >
      {children}
    </span>
  )
}

const mainCard = {
  background: '#fff',
  border: '1px solid rgba(20,20,20,0.08)',
  borderRadius: 28,
  padding: 32,
} as const

const sidebarCard = {
  ...mainCard,
  alignSelf: 'start',
} as const

const statusHeroGrid = {
  marginTop: 24,
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
} as const

const detailGrid = {
  marginTop: 24,
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
} as const

const analyticsGrid = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} as const

const sectionEyebrow = {
  margin: 0,
  color: '#b42318',
  fontSize: 12,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
} as const

const summaryPanel = {
  marginTop: 18,
  padding: 16,
  borderRadius: 20,
  background: '#faf5f3',
  border: '1px solid rgba(20,20,20,0.08)',
} as const

const summaryPanelLabel = {
  margin: 0,
  color: '#6f6661',
  fontSize: 13,
} as const

const summaryPanelValue = {
  margin: '10px 0 0',
  color: '#1d1a17',
  fontWeight: 600,
  lineHeight: 1.8,
} as const

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 140,
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

const adminBlock = {
  marginTop: 20,
  padding: 20,
  borderRadius: 20,
  background: '#faf5f3',
  border: '1px solid rgba(20,20,20,0.08)',
} as const

const adminTitle = {
  margin: 0,
  fontSize: 18,
} as const

const adminText = {
  margin: '10px 0 0',
  color: '#4f4742',
  lineHeight: 1.8,
} as const
