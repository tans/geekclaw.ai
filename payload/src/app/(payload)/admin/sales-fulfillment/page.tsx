import Link from 'next/link'
import { OrderExportActions } from '@/components/admin/order-export-actions'
import { getSalesFulfillmentReport } from '@/lib/orders'

export default async function SalesFulfillmentPage() {
  const report = await getSalesFulfillmentReport()

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
          display: 'grid',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={eyebrowStyle}>Sales Report</p>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>销售与履约报表</h1>
            <p style={descStyle}>
              把近 30 天订单成交、支付状态、履约积压和商品表现集中成一个后台页，方便运营判断今天重点催付、发货还是补库存。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Link href="/admin/orders-workbench" style={buttonPrimary}>
              订单工作台
            </Link>
            <Link href="/admin/product-orders" style={buttonSecondary}>
              单品订单台
            </Link>
            <Link href="/admin/inventory-occupancy" style={buttonSecondary}>
              库存占用台
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <MetricCard label="近 30 天订单" value={String(report.summary.totalOrders)} note="全部来源订单" tone="#1d1a17" />
          <MetricCard label="已支付订单" value={String(report.summary.paidOrders)} note="成功成交口径" tone="#265b35" />
          <MetricCard label="待履约订单" value={String(report.summary.pendingFulfillmentOrders)} note="已支付但未完成交付" tone={report.summary.pendingFulfillmentOrders ? '#b42318' : '#265b35'} />
          <MetricCard label="支付中/未支付" value={String(report.summary.processingOrders + report.summary.unpaidOrders)} note="适合催付和查单" tone={report.summary.processingOrders + report.summary.unpaidOrders ? '#8a5b12' : '#265b35'} />
          <MetricCard label="支付失败" value={String(report.summary.failedOrders)} note="需要复盘链路或客户沟通" tone={report.summary.failedOrders ? '#b42318' : '#265b35'} />
          <MetricCard label="成交额" value={`¥${report.summary.totalRevenue.toLocaleString('zh-CN')}`} note={report.windowLabel} tone="#1d1a17" />
          <MetricCard
            label="待履约客单价"
            value={`¥${report.summary.avgFulfillmentOrderValue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`}
            note="当前履约积压订单均值"
            tone="#1d1a17"
          />
          <MetricCard label="已完成履约" value={String(report.summary.completedFulfillmentOrders)} note="近 30 天完成交付订单" tone="#265b35" />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <article
          style={{
            borderRadius: 20,
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            padding: 20,
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>履约分布</h2>
            <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>已支付订单当前卡在什么阶段，一眼看清。</p>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <BucketCard label="待处理" value={String(report.fulfillmentBuckets.pending)} tone="#8a5b12" />
            <BucketCard label="准备中" value={String(report.fulfillmentBuckets.processing)} tone="#b42318" />
            <BucketCard label="已发货/已交付" value={String(report.fulfillmentBuckets.shipped)} tone="#7c4d12" />
            <BucketCard label="已完成" value={String(report.fulfillmentBuckets.completed)} tone="#265b35" />
          </div>
        </article>

        <article
          style={{
            borderRadius: 20,
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            padding: 20,
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>导出与分析</h2>
            <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>报表页保留现有导出能力，适合客服对账、销售复盘和离线分析。</p>
          </div>
          <OrderExportActions />
        </article>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 0.9fr' }}>
        <article
          style={{
            borderRadius: 20,
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            padding: 20,
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>热销与履约压力商品</h2>
            <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>同时看成交收入和待履约件数，方便判断哪些商品最值得优先补货或统一交付。</p>
          </div>
          {report.productPerformance.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {report.productPerformance.map((product) => (
                <div
                  key={product.productName}
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(20,20,20,0.08)',
                    padding: '12px 14px',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <strong>{product.productName}</strong>
                  <span style={{ color: '#4f4742' }}>
                    已支付 {product.paidUnits} 件 · 待履约 {product.pendingUnits} 件 · 已完成 {product.completedUnits} 件
                  </span>
                  <span style={{ color: '#6f6661', fontSize: 13 }}>
                    订单项 {product.orderCount} 条 · 收入 ¥{product.paidRevenue.toLocaleString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel text="近 30 天还没有商品成交数据。" />
          )}
        </article>

        <article
          style={{
            borderRadius: 20,
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            padding: 20,
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>最早待履约订单</h2>
            <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>按支付/更新时间排序，优先处理这些积压更久的订单。</p>
          </div>
          {report.fulfillmentLeadOrders.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {report.fulfillmentLeadOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/collections/orders/${order.id}`}
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(20,20,20,0.08)',
                    padding: '12px 14px',
                    display: 'grid',
                    gap: 6,
                    color: '#1d1a17',
                    textDecoration: 'none',
                  }}
                >
                  <strong>{order.orderNo}</strong>
                  <span style={{ color: '#4f4742' }}>
                    {order.customerName || '未填写联系人'} · ¥{(Number(order.totalAmount) || 0).toLocaleString('zh-CN')}
                  </span>
                  <span style={{ color: '#6f6661', fontSize: 13 }}>
                    支付于 {formatDate(order.paidAt || order.updatedAt)} · 履约 {formatFulfillmentLabel(order.fulfillmentStatus)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPanel text="当前没有待履约订单。" />
          )}
        </article>
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: string
}) {
  return (
    <article
      style={{
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

function BucketCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#faf8f7',
        padding: '14px 16px',
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 700, color: tone }}>{value}</p>
    </div>
  )
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: '#f7f4f3',
        padding: '12px 14px',
        color: '#5c5048',
        lineHeight: 1.7,
      }}
    >
      {text}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function formatFulfillmentLabel(value: string | null | undefined) {
  return (
    {
      pending: '待处理',
      processing: '准备中',
      shipped: '已发货/已交付',
      completed: '已完成',
    }[value || ''] || value || '-'
  )
}

const eyebrowStyle = {
  margin: 0,
  color: '#b42318',
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
} as const

const descStyle = {
  margin: '12px 0 0',
  color: '#5c5048',
  lineHeight: 1.8,
} as const

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
