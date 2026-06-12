'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CancelOrderButton } from '@/components/cancel-order-button'
import { PaymentReviewActions } from '@/components/admin/payment-review-actions'
import { WorkbenchOrderActions } from '@/components/admin/workbench-order-actions'
import { summarizePaymentChain, parseOrderPaymentEvents } from '@/lib/payment-chain'
import { formatDeliveryMethod, formatFulfillmentStatus, formatPaymentStatus, labelEventSource } from '@/lib/order-status'

type QueueOrder = {
  id: number
  orderNo: string
  customerName?: string | null
  customerPhone?: string | null
  totalAmount?: number | null
  paymentStatus: string
  fulfillmentStatus?: string | null
  deliveryMethod?: string | null
  trackingNo?: string | null
  deliveryNote?: string | null
  operatorNote?: string | null
  paidAt?: string | null
  updatedAt: string
  paymentEvents?: unknown
  paymentLastError?: string | null
}

type BatchAction = {
  label: string
  action: 'cancel' | 'mark-processing' | 'mark-completed' | 'mark-paid' | 'mark-failed'
  tone?: 'primary' | 'secondary' | 'danger' | 'success'
}

export function BatchOrderQueue({
  title,
  description,
  emptyText,
  orders,
  viewAllHref,
  batchActions = [],
  renderMode = 'default',
  allowCommerceActions = true,
}: {
  title: string
  description: string
  emptyText: string
  orders: QueueOrder[]
  viewAllHref: string
  batchActions?: BatchAction[]
  renderMode?: 'default' | 'review' | 'fulfillment'
  allowCommerceActions?: boolean
}) {
  const router = useRouter()
  const [selectedOrderNos, setSelectedOrderNos] = useState<string[]>([])
  const [pendingAction, setPendingAction] = useState<BatchAction['action'] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const cancellableCount = orders.filter((order) => order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded').length

  const allSelected = orders.length > 0 && selectedOrderNos.length === orders.length
  const selectedSet = useMemo(() => new Set(selectedOrderNos), [selectedOrderNos])

  function toggleOrder(orderNo: string) {
    setSelectedOrderNos((current) => (current.includes(orderNo) ? current.filter((item) => item !== orderNo) : [...current, orderNo]))
  }

  function toggleAll() {
    setSelectedOrderNos((current) => (current.length === orders.length ? [] : orders.map((order) => order.orderNo)))
  }

  async function runBatchAction(action: BatchAction['action']) {
    if (!selectedOrderNos.length) {
      setError('请先选择至少一笔订单。')
      setMessage('')
      return
    }

    setPendingAction(action)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNos: selectedOrderNos,
          action,
        }),
      })

      const result = (await response.json()) as {
        error?: string
        successCount?: number
        failureCount?: number
      }

      if (!response.ok) {
        throw new Error(mapBulkError(result.error || 'BULK_OPERATION_FAILED'))
      }

      setMessage(`批量操作完成：成功 ${result.successCount || 0} 笔，失败 ${result.failureCount || 0} 笔。`)
      setSelectedOrderNos([])
      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : mapBulkError('BULK_OPERATION_FAILED'))
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>{description}</p>
        </div>
        <Link href={viewAllHref} style={smallButtonSecondary}>
          查看全部
        </Link>
      </div>

      {orders.length ? (
        <>
          <div
            style={{
              marginTop: 18,
              borderRadius: 16,
              background: '#f8f4f2',
              padding: '14px 16px',
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f4742', fontSize: 13 }}>
                <input checked={allSelected} onChange={toggleAll} type="checkbox" />
                全选当前队列
              </label>
              <span style={{ color: '#8d827a', fontSize: 13 }}>已选 {selectedOrderNos.length} / {orders.length}</span>
            </div>
            {allowCommerceActions && batchActions.length ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {batchActions
                  .filter((item) => item.action !== 'cancel' || cancellableCount > 0)
                  .map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => runBatchAction(item.action)}
                    disabled={pendingAction !== null}
                    style={getBatchButtonStyle(item.tone || 'secondary')}
                  >
                    {pendingAction === item.action ? '处理中...' : item.label}
                  </button>
                  ))}
              </div>
            ) : null}
            {message ? <p style={{ margin: 0, color: '#265b35', fontSize: 13 }}>{message}</p> : null}
            {error ? <p style={{ margin: 0, color: '#b42318', fontSize: 13 }}>{error}</p> : null}
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            {orders.map((order) => (
              <article
                key={`${title}-${order.id}`}
                style={{
                  border: selectedSet.has(order.orderNo) ? '1px solid rgba(180,35,24,0.4)' : '1px solid rgba(20,20,20,0.08)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                    <input checked={selectedSet.has(order.orderNo)} onChange={() => toggleOrder(order.orderNo)} type="checkbox" />
                    <span>{order.orderNo}</span>
                  </label>
                  <span style={{ color: '#6f6661' }}>
                    {formatPaymentStatus(order.paymentStatus)} / {formatFulfillmentStatus(order.fulfillmentStatus)}
                  </span>
                </div>
                <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                  <span>{order.customerName || '未填写联系人'}</span>
                  <span> · </span>
                  <span>{order.customerPhone || '未填写手机号'}</span>
                  <span> · </span>
                  <span>¥{formatCurrency(order.totalAmount)}</span>
                  <span> · </span>
                  <span>{formatDeliveryMethod(order.deliveryMethod)}</span>
                </div>
                <div style={{ color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>
                  <span>支付时间：{order.paidAt ? formatDate(order.paidAt) : '-'}</span>
                  <span> · </span>
                  <span>最近更新：{formatDate(order.updatedAt)}</span>
                </div>
                {renderMode !== 'fulfillment' ? <PaymentChainInline order={order} /> : null}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                    处理订单
                  </Link>
                  <Link href={`/admin/collections/orders/${order.id}/payment-events`} style={smallButtonSecondary}>
                    订单时间线
                  </Link>
                  <Link href={`/orders/${order.orderNo}`} style={smallButtonSecondary}>
                    前台详情
                  </Link>
                  {allowCommerceActions && order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' ? (
                    <CancelOrderButton
                      orderNo={order.orderNo}
                      label="取消订单"
                      reason="后台工作台取消订单，库存占用已释放。"
                      source="operator"
                      variant="secondary"
                    />
                  ) : null}
                </div>
                {renderMode === 'fulfillment' ? (
                  <WorkbenchOrderActions
                    orderNo={order.orderNo}
                    fulfillmentStatus={order.fulfillmentStatus}
                    deliveryMethod={order.deliveryMethod}
                    trackingNo={typeof order.trackingNo === 'string' ? order.trackingNo : ''}
                    deliveryNote={typeof order.deliveryNote === 'string' ? order.deliveryNote : ''}
                    operatorNote={typeof order.operatorNote === 'string' ? order.operatorNote : ''}
                    allowCommerceActions={allowCommerceActions}
                  />
                ) : null}
                {renderMode === 'review' && allowCommerceActions ? <PaymentReviewActions orderNo={order.orderNo} /> : null}
              </article>
            ))}
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: 18,
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          {emptyText}
        </div>
      )}
    </section>
  )
}

function PaymentChainInline({ order }: { order: QueueOrder }) {
  const chain = summarizePaymentChain(parseOrderPaymentEvents(order.paymentEvents))
  const tone =
    chain.overallState === 'attention' ? '#b42318' : chain.overallState === 'healthy' ? '#265b35' : '#8d827a'

  return (
    <div
      style={{
        borderRadius: 14,
        background: chain.overallState === 'attention' ? '#fff7f6' : '#faf8f7',
        padding: '12px 14px',
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ color: '#1d1a17' }}>支付链路摘要</strong>
        <span style={{ color: tone, fontSize: 13, fontWeight: 700 }}>{formatChainState(chain.overallState)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ChainBadge label="回跳" value={chain.lastReturn ? '已收到' : '暂无'} tone={chain.lastReturn ? 'success' : 'neutral'} />
        <ChainBadge label="通知" value={formatNotifyState(chain.notifyState)} tone={chain.notifyState === 'issue' ? 'danger' : chain.notifyState === 'success' ? 'success' : 'neutral'} />
        <ChainBadge label="查单" value={chain.lastQuery ? '已有记录' : '暂无'} tone={chain.lastQuery ? 'warning' : 'neutral'} />
        <ChainBadge label="结果" value={chain.lastPaid ? '已支付' : chain.lastFailed ? '失败' : '未确认'} tone={chain.lastFailed ? 'danger' : chain.lastPaid ? 'success' : 'neutral'} />
      </div>
      <div style={{ color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>
        {buildChainDetail(order, chain)}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href={`/admin/payment-observability?orderNo=${encodeURIComponent(order.orderNo)}`} style={tinyButtonSecondary}>
          观测此订单
        </Link>
        <Link href={`/admin/collections/orders/${order.id}/payment-events`} style={tinyButtonSecondary}>
          打开完整链路
        </Link>
      </div>
    </div>
  )
}

function ChainBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'success' | 'danger' | 'warning' | 'neutral'
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '6px 10px',
        background: badgeToneMap[tone].background,
        color: badgeToneMap[tone].color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </span>
  )
}

function buildChainDetail(order: QueueOrder, chain: ReturnType<typeof summarizePaymentChain>) {
  if (chain.lastNotifyIssue) {
    return `最近异常：${formatEventLine(chain.lastNotifyIssue)}${formatPayloadHint(chain.lastNotifyIssue.payload)}`
  }

  if (chain.lastNotifyReceived) {
    return `最近通知：${formatEventLine(chain.lastNotifyReceived)}${formatPayloadHint(chain.lastNotifyReceived.payload)}`
  }

  if (chain.lastReturn) {
    return `最近回跳：${formatEventLine(chain.lastReturn)}${formatPayloadHint(chain.lastReturn.payload)}`
  }

  if (chain.lastQuery) {
    return `最近查单：${formatEventLine(chain.lastQuery)}${formatPayloadHint(chain.lastQuery.payload)}`
  }

  if (order.paymentLastError?.trim()) {
    return `最近错误：${order.paymentLastError.trim()}`
  }

  return '当前还没有可用的支付链路记录。'
}

function mapBulkError(code: string) {
  switch (code) {
    case 'MISSING_REQUIRED_FIELDS':
      return '缺少批量操作参数。'
    case 'TOO_MANY_ORDERS':
      return '单次最多处理 50 笔订单。'
    case 'BULK_OPERATION_FAILED':
    default:
      return '批量操作失败，请稍后重试。'
  }
}

function getBatchButtonStyle(tone: 'primary' | 'secondary' | 'danger' | 'success') {
  if (tone === 'primary') {
    return smallButtonPrimary
  }

  if (tone === 'success') {
    return {
      ...smallButtonPrimary,
      background: '#265b35',
    }
  }

  if (tone === 'danger') {
    return {
      ...smallButtonPrimary,
      background: '#b42318',
    }
  }

  return smallButtonSecondary
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function formatCurrency(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '0'
}

function formatChainState(value: ReturnType<typeof summarizePaymentChain>['overallState']) {
  return (
    {
      healthy: '链路有记录',
      attention: '链路需关注',
      idle: '链路未启动',
    }[value] || value
  )
}

function formatNotifyState(value: ReturnType<typeof summarizePaymentChain>['notifyState']) {
  return (
    {
      success: '正常',
      issue: '异常',
      missing: '暂无',
    }[value] || value
  )
}

function formatEventLine(event: ReturnType<typeof parseOrderPaymentEvents>[number]) {
  return `${labelEventSource(event.source)} / ${formatDate(event.createdAt)} / ${event.status || '-'}`
}

function formatPayloadHint(payload: Record<string, unknown> | undefined) {
  if (!payload) {
    return ''
  }

  const parts = [pickPayloadValue(payload, 'trade_status'), pickPayloadValue(payload, 'msg'), pickPayloadValue(payload, 'sub_msg')].filter(Boolean)
  return parts.length ? ` / ${parts.join(' / ')}` : ''
}

function pickPayloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? `${key}: ${value}` : ''
}

const smallButtonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 96,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
  border: 0,
  cursor: 'pointer',
} as const

const smallButtonSecondary = {
  ...smallButtonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const

const tinyButtonSecondary = {
  ...smallButtonSecondary,
  minWidth: 88,
  padding: '6px 10px',
  fontSize: 12,
} as const

const badgeToneMap = {
  success: {
    background: '#f4fbf6',
    color: '#265b35',
  },
  danger: {
    background: '#fff1ef',
    color: '#b42318',
  },
  warning: {
    background: '#fff7e8',
    color: '#8a5b12',
  },
  neutral: {
    background: '#f3f1ef',
    color: '#6f6661',
  },
} as const
