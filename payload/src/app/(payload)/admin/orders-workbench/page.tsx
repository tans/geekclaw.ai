import Link from 'next/link'
import { WorkbenchOrderActions } from '@/components/admin/workbench-order-actions'
import { getPendingFulfillmentOrders, getPendingPaymentOrders, getRecentPaymentExceptions } from '@/lib/orders'

export default async function OrdersWorkbenchPage() {
  const [pendingPayments, pendingFulfillment, paymentExceptions] = await Promise.all([
    getPendingPaymentOrders(12),
    getPendingFulfillmentOrders(12),
    getRecentPaymentExceptions(12),
  ])

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
          <Link href="/admin/globals/site-settings" style={buttonSecondary}>
            站点设置
          </Link>
        </div>
      </section>

      <section style={gridStyle}>
        <MetricCard label="待支付/支付中" value={String(pendingPayments.length)} tone="#8a5b12" />
        <MetricCard label="待履约" value={String(pendingFulfillment.length)} tone="#265b35" />
        <MetricCard label="异常/处理中" value={String(paymentExceptions.length)} tone="#b42318" />
      </section>

      <QueueSection
        title="待支付 / 支付中"
        description="适合客服或运营跟进用户补支付、确认支付卡点。"
        emptyText="当前没有待支付或支付中的订单。"
        orders={pendingPayments}
      />

      <QueueSection
        title="待履约"
        description="已支付但尚未完成交付的订单，适合运营逐单推进。"
        emptyText="当前没有待履约订单。"
        orders={pendingFulfillment}
      />

      <QueueSection
        title="异常 / 处理中"
        description="聚合支付失败和处理中订单，便于排查支付问题。"
        emptyText="当前没有异常或处理中订单。"
        orders={paymentExceptions}
      />
    </main>
  )
}

function QueueSection({
  title,
  description,
  emptyText,
  orders,
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
      <h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
      <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>{description}</p>
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
