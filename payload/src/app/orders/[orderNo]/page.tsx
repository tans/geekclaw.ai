import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CancelOrderButton } from '@/components/cancel-order-button'
import { PageShell } from '@/components/page-shell'
import type { OrderPaymentEvent } from '@/lib/orders'
import { getOrderByOrderNo } from '@/lib/orders'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>
}) {
  const { orderNo } = await params
  const order = await getOrderByOrderNo(orderNo)
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
  const unitPrice = firstItem?.unitPrice || order.totalAmount
  const canRetryPayment =
    order.status !== 'cancelled' && order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded'
  const canCancelOrder = order.status !== 'cancelled' && order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded'
  const retryHref = canRetryPayment
    ? `/shop/checkout-success?orderNo=${encodeURIComponent(order.orderNo)}`
    : '/shop'
  const paymentEvents = parsePaymentEvents(order.paymentEvents)

  return (
    <PageShell>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: '1.2fr 0.8fr',
          }}
        >
          <article
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 32,
            }}
          >
            <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
              Order Detail
            </p>
            <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(30px, 5vw, 48px)' }}>订单详情</h1>
            <div style={{ marginTop: 24, display: 'grid', gap: 14, color: '#4f4742', lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}><strong>订单号：</strong>{order.orderNo}</p>
              <p style={{ margin: 0 }}><strong>商品：</strong>{productName}</p>
              <p style={{ margin: 0 }}><strong>数量：</strong>{quantity}</p>
              <p style={{ margin: 0 }}><strong>单价：</strong>¥{unitPrice.toLocaleString('zh-CN')}</p>
              <p style={{ margin: 0 }}><strong>订单来源：</strong>{order.source || '-'}</p>
              <p style={{ margin: 0 }}><strong>联系人：</strong>{order.customerName || '-'}</p>
              <p style={{ margin: 0 }}><strong>手机号：</strong>{order.customerPhone || '-'}</p>
              <p style={{ margin: 0 }}><strong>邮箱：</strong>{order.customerEmail || '-'}</p>
              <p style={{ margin: 0 }}><strong>地址：</strong>{order.shippingAddress || '-'}</p>
              <p style={{ margin: 0 }}><strong>下单时间：</strong>{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
              <p style={{ margin: 0 }}><strong>支付时间：</strong>{order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '-'}</p>
            </div>
          </article>

          <aside
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 28,
              alignSelf: 'start',
            }}
          >
            <p style={{ margin: 0, color: '#6f6661' }}>订单状态</p>
            <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{order.status}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>支付状态</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.paymentStatus}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>支付模式</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{paymentDiagnostics.mode}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>履约状态</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{formatFulfillmentStatus(order.fulfillmentStatus)}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>交付方式</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{formatDeliveryMethod(order.deliveryMethod)}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>跟踪号</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.trackingNo || '-'}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>Notify 回调地址</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700, wordBreak: 'break-all' }}>{paymentDiagnostics.notifyUrl.value}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>支付单号</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.paymentOrderNo || '-'}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>支付流水</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.paymentTradeNo || '-'}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>最近错误</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{order.paymentLastError || '-'}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>金额</p>
            <p style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 700 }}>¥{order.totalAmount.toLocaleString('zh-CN')}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>交付时间</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>
              {order.fulfilledAt ? new Date(order.fulfilledAt).toLocaleString('zh-CN') : '-'}
            </p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>交付备注</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700, lineHeight: 1.7 }}>{order.deliveryNote || '-'}</p>
            <p style={{ margin: '16px 0 0', color: '#6f6661' }}>运营备注</p>
            <p style={{ margin: '8px 0 0', fontWeight: 700, lineHeight: 1.7 }}>
              {typeof order.operatorNote === 'string' && order.operatorNote.trim() ? order.operatorNote : '-'}
            </p>
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

        <section
          style={{
            marginTop: 24,
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 28,
            padding: 32,
          }}
        >
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Order Timeline
          </p>
          <h2 style={{ margin: '18px 0 0', fontSize: 28 }}>订单事件时间线</h2>
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
