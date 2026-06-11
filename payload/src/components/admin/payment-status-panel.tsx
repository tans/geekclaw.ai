import type { ServerProps } from 'payload'
import { getPendingFulfillmentOrders, getRecentPaymentExceptions } from '@/lib/orders'
import { getPaymentDiagnostics } from '@/lib/payment-diagnostics'

export default async function PaymentStatusPanel(_: ServerProps) {
  const diagnostics = await getPaymentDiagnostics()
  const [recentExceptions, pendingFulfillmentOrders] = await Promise.all([
    getRecentPaymentExceptions(),
    getPendingFulfillmentOrders(),
  ])

  return (
    <section
      style={{
        marginBottom: 24,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 20,
        background: '#fff',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Payment Status
          </p>
          <h2 style={{ margin: '12px 0 0', fontSize: 28, lineHeight: 1.2 }}>支付配置状态</h2>
          <p style={{ margin: '12px 0 0', color: '#4f4742', lineHeight: 1.8 }}>{diagnostics.summary}</p>
        </div>
        <div
          style={{
            minWidth: 160,
            borderRadius: 18,
            background: diagnostics.mode === 'real' ? '#f4fbf6' : '#fff6f5',
            padding: '16px 18px',
            alignSelf: 'flex-start',
          }}
        >
          <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>当前模式</p>
          <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700, color: '#1d1a17' }}>{diagnostics.mode}</p>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card title="App ID" value={diagnostics.appId.configured ? diagnostics.appId.valuePreview : '未配置'} meta={diagnostics.appId.source} />
        <Card title="Seller ID" value={diagnostics.sellerId.configured ? diagnostics.sellerId.valuePreview : '未配置'} meta={diagnostics.sellerId.source} />
        <Card title="应用私钥" value={diagnostics.privateKey.configured ? `${diagnostics.privateKey.lineCount} 行` : '未配置'} meta={diagnostics.privateKey.source} />
        <Card title="支付宝公钥" value={diagnostics.publicKey.configured ? `${diagnostics.publicKey.lineCount} 行` : '未配置'} meta={diagnostics.publicKey.source} />
        <Card title="Notify URL" value={diagnostics.notifyUrl.configured ? '已配置' : '未配置'} meta={diagnostics.notifyUrl.source} />
        <Card
          title="未支付关闭"
          value={`${diagnostics.orderExpiry.expireMinutes} 分钟`}
          meta={diagnostics.orderExpiry.cronSecretConfigured ? 'cron protected' : 'secret missing'}
        />
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>联调提醒</p>
        <div
          style={{
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          当前服务端读取顺序：环境变量优先，`site-settings` 作为回退。联调前若修改了后台支付配置但结果没变化，需要同步检查 pm2 进程环境并重启服务。
        </div>
        <div
          style={{
            borderRadius: 14,
            background: '#f7f7f6',
            padding: '12px 14px',
            color: '#4f4742',
            lineHeight: 1.7,
          }}
        >
          当前未支付订单会在 {diagnostics.orderExpiry.expireMinutes} 分钟后自动关闭。可通过 `POST {diagnostics.orderExpiry.closeExpiredApiPath}`
          配合 `Authorization: Bearer $CRON_SECRET` 触发。
        </div>
        {diagnostics.warnings.length ? (
          diagnostics.warnings.map((warning) => (
            <div
              key={warning}
              style={{
                borderRadius: 14,
                background: '#faf5f3',
                padding: '12px 14px',
                color: '#4f4742',
                lineHeight: 1.7,
              }}
            >
              {warning}
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f4fbf6',
              padding: '12px 14px',
              color: '#265b35',
              lineHeight: 1.7,
            }}
          >
            当前未发现阻断真实支付宝联调的关键配置缺口，可以继续验证支付跳转与异步通知回写。
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/payment-diagnostics" style={buttonSecondary}>
          打开诊断页
        </a>
        <a href="/admin/globals/site-settings" style={buttonPrimary}>
          打开站点设置
        </a>
        <a href="/admin/collections/orders" style={buttonSecondary}>
          查看订单列表
        </a>
        <a href={buildOrdersFilterHref({ paymentStatus: 'failed' })} style={buttonSecondary}>
          支付失败列表
        </a>
        <a href={buildOrdersFilterHref({ paymentStatus: 'processing' })} style={buttonSecondary}>
          支付中列表
        </a>
        <a href={buildPendingFulfillmentHref()} style={buttonSecondary}>
          待履约列表
        </a>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>最近异常/处理中订单</p>
        {recentExceptions.length ? (
          recentExceptions.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'grid',
                gap: 8,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 16,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.orderNo}</strong>
                <span style={{ color: order.paymentStatus === 'failed' ? '#b42318' : '#8a5b12', fontWeight: 700 }}>
                  {order.paymentStatus}
                </span>
              </div>
              <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                <span>{order.customerName || '未填写联系人'}</span>
                <span> · </span>
                <span>¥{order.totalAmount.toLocaleString('zh-CN')}</span>
                <span> · </span>
                <span>{formatFulfillmentStatus(order.fulfillmentStatus)}</span>
                <span> · </span>
                <span>{order.paymentLastError || '等待回调或处理中'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                  订单详情
                </a>
                <a href={`/admin/collections/orders/${order.id}/payment-events`} style={smallButtonSecondary}>
                  订单时间线
                </a>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f7f7f6',
              padding: '12px 14px',
              color: '#4f4742',
              lineHeight: 1.7,
            }}
          >
            当前没有 `failed` 或 `processing` 的订单。
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>待履约订单</p>
        {pendingFulfillmentOrders.length ? (
          pendingFulfillmentOrders.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'grid',
                gap: 8,
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 16,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.orderNo}</strong>
                <span style={{ color: '#265b35', fontWeight: 700 }}>
                  {formatFulfillmentStatus(order.fulfillmentStatus)}
                </span>
              </div>
              <div style={{ color: '#4f4742', lineHeight: 1.7 }}>
                <span>{order.customerName || '未填写联系人'}</span>
                <span> · </span>
                <span>¥{order.totalAmount.toLocaleString('zh-CN')}</span>
                <span> · </span>
                <span>{formatDeliveryMethod(order.deliveryMethod)}</span>
                <span> · </span>
                <span>{order.paidAt ? `支付于 ${formatDate(order.paidAt)}` : '已支付，等待履约'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                  处理订单
                </a>
                <a href={`/orders/${order.orderNo}`} style={smallButtonSecondary}>
                  前台详情
                </a>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              borderRadius: 14,
              background: '#f7f7f6',
              padding: '12px 14px',
              color: '#4f4742',
              lineHeight: 1.7,
            }}
          >
            当前没有已支付但未完成履约的订单。
          </div>
        )}
      </div>
    </section>
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

function Card({ title, value, meta }: { title: string; value: string; meta: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        padding: 18,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{title}</p>
      <p style={{ margin: '8px 0 0', color: '#1d1a17', fontWeight: 700, wordBreak: 'break-all' }}>{value}</p>
      <p style={{ margin: '10px 0 0', color: '#6f6661', fontSize: 12 }}>来源：{meta}</p>
    </article>
  )
}

function buildOrdersFilterHref(filters: {
  paymentStatus?: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded'
}) {
  const params = new URLSearchParams()

  if (filters.paymentStatus) {
    params.set('where[paymentStatus][equals]', filters.paymentStatus)
  }

  return `/admin/collections/orders?${params.toString()}`
}

function buildPendingFulfillmentHref() {
  const params = new URLSearchParams()
  params.set('where[paymentStatus][equals]', 'paid')
  params.set('where[fulfillmentStatus][not_equals]', 'completed')
  return `/admin/collections/orders?${params.toString()}`
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
