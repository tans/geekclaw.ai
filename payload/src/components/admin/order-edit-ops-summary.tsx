import { headers } from 'next/headers'
import type { BeforeDocumentControlsServerProps } from 'payload'
import { PaymentReviewActions } from '@/components/admin/payment-review-actions'
import { WorkbenchOrderActions } from '@/components/admin/workbench-order-actions'
import { hasRole } from '@/lib/access'
import { summarizePaymentChain, parseOrderPaymentEvents } from '@/lib/payment-chain'
import { formatDeliveryMethod, formatFulfillmentStatus, formatOrderStatus, formatPaymentStatus } from '@/lib/order-status'

export default async function OrderEditOpsSummary(props: BeforeDocumentControlsServerProps) {
  const id = typeof props.id === 'number' || typeof props.id === 'string' ? props.id : null

  if (!id) {
    return null
  }

  const order = await props.payload.findByID({
    collection: 'orders',
    id,
    depth: 0,
  }).catch(() => null)

  if (!order) {
    return null
  }

  const auth = await props.payload.auth({ headers: await headers() })
  const canManageCommerce = hasRole(auth.user, ['super-admin', 'ops'])
  const paymentEvents = parseOrderPaymentEvents(order.paymentEvents)
  const chain = summarizePaymentChain(paymentEvents)
  const chainTone = chain.overallState === 'attention' ? '#b42318' : chain.overallState === 'healthy' ? '#265b35' : '#6f6661'

  return (
    <section
      style={{
        marginBottom: 16,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Order Ops Summary
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>订单运营摘要</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            订单号 {order.orderNo}，当前支付状态 {formatPaymentStatus(order.paymentStatus)}，履约状态 {formatFulfillmentStatus(order.fulfillmentStatus)}。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href={`/orders/${order.orderNo}`} style={buttonPrimary}>
            前台订单页
          </a>
          <a href={`/admin/collections/orders/${order.id}/payment-events`} style={buttonSecondary}>
            完整时间线
          </a>
          <a href="/admin/payment-observability" style={buttonSecondary}>
            支付观测页
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="订单状态" value={formatOrderStatus(order.status)} note={`来源：${order.source || '-'}`} />
        <MetricCard label="支付状态" value={formatPaymentStatus(order.paymentStatus)} note={`通道：${order.paymentProvider || '-'}`} />
        <MetricCard label="履约状态" value={formatFulfillmentStatus(order.fulfillmentStatus)} note={`交付：${formatDeliveryMethod(order.deliveryMethod)}`} />
        <MetricCard
          label="链路总览"
          value={formatChainOverview(chain.overallState)}
          note={`回跳：${chain.lastReturn ? '已收到' : '暂无'} / 通知：${formatNotifyState(chain.notifyState)} / 查单：${chain.lastQuery ? '已有' : '暂无'}`}
          tone={chainTone}
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div
          style={{
            borderRadius: 16,
            background: '#faf8f7',
            padding: 16,
            display: 'grid',
            gap: 12,
          }}
        >
          <div>
            <strong>支付复核</strong>
            <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
              当订单停留在 `processing` 或链路异常时，可直接在原生编辑页先查单，再手动确认已支付或标记失败。
            </p>
          </div>
          {canManageCommerce ? <PaymentReviewActions orderNo={order.orderNo} compact /> : <PermissionHint text="当前账号只有内容权限，不能执行支付复核。" />}
        </div>

        <div
          style={{
            borderRadius: 16,
            background: '#faf8f7',
            padding: 16,
            display: 'grid',
            gap: 12,
          }}
        >
          <div>
            <strong>履约与备注</strong>
            <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
              已支付订单可直接推进履约、填写交付信息和维护运营备注，不必回工作台处理。
            </p>
          </div>
          <WorkbenchOrderActions
            orderNo={order.orderNo}
            fulfillmentStatus={typeof order.fulfillmentStatus === 'string' ? order.fulfillmentStatus : 'pending'}
            deliveryMethod={typeof order.deliveryMethod === 'string' ? order.deliveryMethod : 'digital'}
            trackingNo={typeof order.trackingNo === 'string' ? order.trackingNo : ''}
            deliveryNote={typeof order.deliveryNote === 'string' ? order.deliveryNote : ''}
            operatorNote={typeof order.operatorNote === 'string' ? order.operatorNote : ''}
            allowCommerceActions={canManageCommerce}
          />
        </div>
      </div>
    </section>
  )
}

function PermissionHint({ text }: { text: string }) {
  return <p style={{ margin: 0, color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>{text}</p>
}

function MetricCard({
  label,
  value,
  note,
  tone = '#1d1a17',
}: {
  label: string
  value: string
  note: string
  tone?: string
}) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 16,
        background: '#fff',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

function formatNotifyState(value: 'success' | 'issue' | 'missing') {
  return (
    {
      success: '正常',
      issue: '异常',
      missing: '暂无',
    }[value] || value
  )
}

function formatChainOverview(value: 'healthy' | 'attention' | 'idle') {
  return (
    {
      healthy: '链路有记录',
      attention: '链路需关注',
      idle: '链路未启动',
    }[value] || value
  )
}

const buttonPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 120,
  padding: '10px 14px',
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
