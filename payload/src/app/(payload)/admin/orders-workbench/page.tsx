import Link from 'next/link'
import { CancelOrderButton } from '@/components/cancel-order-button'
import { PaymentReviewActions } from '@/components/admin/payment-review-actions'
import { WorkbenchOrderActions } from '@/components/admin/workbench-order-actions'
import { getPendingFulfillmentOrders, getPendingPaymentOrders, getRecentPaymentExceptions, getStaleProcessingOrders } from '@/lib/orders'
import { getProcessingReviewMinutes } from '@/lib/payment-review'
import type { ReactNode } from 'react'

export default async function OrdersWorkbenchPage() {
  const [pendingPayments, pendingFulfillment, paymentExceptions, staleProcessingOrders] = await Promise.all([
    getPendingPaymentOrders(12),
    getPendingFulfillmentOrders(12),
    getRecentPaymentExceptions(12),
    getStaleProcessingOrders(12),
  ])
  const processingReviewMinutes = getProcessingReviewMinutes()

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
          borderRadius: 20,
          background: '#fff',
          padding: 24,
        }}
      >
        <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Orders Workbench
        </p>
        <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>订单运营工作台</h1>
        <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
          把待支付、待履约、异常单集中到一个后台页面，方便运营同学按优先级处理。
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link href="/admin/collections/orders" style={buttonPrimary}>
            打开订单列表
          </Link>
          <Link href={buildOrdersFilterHref({ paymentStatus: 'failed' })} style={buttonSecondary}>
            仅看支付失败
          </Link>
          <Link href={buildOrdersFilterHref({ paymentStatus: 'processing' })} style={buttonSecondary}>
            仅看支付中
          </Link>
          <Link href={buildPendingFulfillmentHref()} style={buttonSecondary}>
            仅看待履约
          </Link>
          <Link href="/admin/globals/site-settings" style={buttonSecondary}>
            站点设置
          </Link>
        </div>
      </section>

      <section style={gridStyle}>
        <MetricCard label="待支付/支付中" value={String(pendingPayments.length)} tone="#8a5b12" />
        <MetricCard label="待履约" value={String(pendingFulfillment.length)} tone="#265b35" />
        <MetricCard label="异常/处理中" value={String(paymentExceptions.length)} tone="#b42318" />
        <MetricCard label="超时待复核" value={String(staleProcessingOrders.length)} tone="#7c4d12" />
      </section>

      <QueueSection
        title="支付中待复核"
        description={`支付状态停留在 processing 超过 ${processingReviewMinutes} 分钟的订单，建议人工确认是否到账。`}
        emptyText="当前没有超时待复核的支付中订单。"
        orders={staleProcessingOrders}
        viewAllHref={buildOrdersFilterHref({ paymentStatus: 'processing' })}
        renderExtra={(order) => <PaymentReviewActions orderNo={order.orderNo} />}
      />

      <QueueSection
        title="待支付 / 支付中"
        description="适合客服或运营跟进用户补支付、确认支付卡点。"
        emptyText="当前没有待支付或支付中的订单。"
        orders={pendingPayments}
        viewAllHref={buildPendingPaymentHref()}
      />

      <QueueSection
        title="待履约"
        description="已支付但尚未完成交付的订单，适合运营逐单推进。"
        emptyText="当前没有待履约订单。"
        orders={pendingFulfillment}
        viewAllHref={buildPendingFulfillmentHref()}
      />

      <QueueSection
        title="异常 / 处理中"
        description="聚合支付失败和处理中订单，便于排查支付问题。"
        emptyText="当前没有异常或处理中订单。"
        orders={paymentExceptions}
        viewAllHref={buildExceptionHref()}
      />
    </main>
  )
}

function QueueSection({
  title,
  description,
  emptyText,
  orders,
  viewAllHref,
  renderExtra,
}: {
  title: string
  description: string
  emptyText: string
  orders: Array<{
    id: number
    orderNo: string
    customerName?: string | null
    customerPhone?: string | null
    totalAmount: number
    paymentStatus: string
    fulfillmentStatus?: string | null
    deliveryMethod?: string | null
    trackingNo?: string | null
    deliveryNote?: string | null
    operatorNote?: string | null
    paidAt?: string | null
    updatedAt: string
  }>
  viewAllHref: string
  renderExtra?: (order: {
    id: number
    orderNo: string
    customerName?: string | null
    customerPhone?: string | null
    totalAmount: number
    paymentStatus: string
    fulfillmentStatus?: string | null
    deliveryMethod?: string | null
    trackingNo?: string | null
    deliveryNote?: string | null
    operatorNote?: string | null
    paidAt?: string | null
    updatedAt: string
  }) => ReactNode
}) {
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
        <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          {orders.map((order) => (
            <article
              key={`${title}-${order.id}`}
              style={{
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 16,
                padding: '14px 16px',
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.orderNo}</strong>
                <span style={{ color: '#6f6661' }}>
                  {order.paymentStatus} / {formatFulfillmentStatus(order.fulfillmentStatus)}
                </span>
              </div>
              <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                <span>{order.customerName || '未填写联系人'}</span>
                <span> · </span>
                <span>{order.customerPhone || '未填写手机号'}</span>
                <span> · </span>
                <span>¥{order.totalAmount.toLocaleString('zh-CN')}</span>
                <span> · </span>
                <span>{formatDeliveryMethod(order.deliveryMethod)}</span>
              </div>
              <div style={{ color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>
                <span>支付时间：{order.paidAt ? formatDate(order.paidAt) : '-'}</span>
                <span> · </span>
                <span>最近更新：{formatDate(order.updatedAt)}</span>
              </div>
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
                {order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' ? (
                  <CancelOrderButton
                    orderNo={order.orderNo}
                    label="取消订单"
                    reason="后台工作台取消订单，库存占用已释放。"
                    source="operator"
                    variant="secondary"
                  />
                ) : null}
              </div>
              {title === '待履约' ? (
                <WorkbenchOrderActions
                  orderNo={order.orderNo}
                  fulfillmentStatus={order.fulfillmentStatus}
                  deliveryMethod={order.deliveryMethod}
                  trackingNo={typeof order.trackingNo === 'string' ? order.trackingNo : ''}
                  deliveryNote={typeof order.deliveryNote === 'string' ? order.deliveryNote : ''}
                  operatorNote={typeof order.operatorNote === 'string' ? order.operatorNote : ''}
                />
              ) : null}
              {renderExtra ? renderExtra(order) : null}
            </article>
          ))}
        </div>
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

function buildOrdersFilterHref(filters: {
  paymentStatus?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded'
  fulfillmentStatusNotEquals?: 'completed'
}) {
  const params = new URLSearchParams()

  if (filters.paymentStatus) {
    params.set('where[paymentStatus][equals]', filters.paymentStatus)
  }

  if (filters.fulfillmentStatusNotEquals) {
    params.set('where[fulfillmentStatus][not_equals]', filters.fulfillmentStatusNotEquals)
  }

  return `/admin/collections/orders?${params.toString()}`
}

function buildPendingPaymentHref() {
  return buildOrdersFilterHref({ paymentStatus: 'unpaid' })
}

function buildPendingFulfillmentHref() {
  const params = new URLSearchParams()
  params.set('where[paymentStatus][equals]', 'paid')
  params.set('where[fulfillmentStatus][not_equals]', 'completed')
  return `/admin/collections/orders?${params.toString()}`
}

function buildExceptionHref() {
  return buildOrdersFilterHref({ paymentStatus: 'failed' })
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

function formatFulfillmentStatus(value: string | null | undefined) {
  switch (value) {
    case 'processing':
      return '准备中'
    case 'shipped':
      return '已发货/已交付'
    case 'completed':
      return '已完成'
    case 'pending':
    default:
      return '待处理'
  }
}

function formatDeliveryMethod(value: string | null | undefined) {
  switch (value) {
    case 'shipping':
      return '快递物流'
    case 'service':
      return '人工服务'
    case 'digital':
    default:
      return '数字交付'
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

const gridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
} as const

const smallButtonSecondary = {
  ...smallButtonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
