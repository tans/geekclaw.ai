import type { CSSProperties } from 'react'
import { headers } from 'next/headers'
import type { ServerProps } from 'payload'
import { OrderExportActions } from '@/components/admin/order-export-actions'
import { hasAnyRole } from '@/lib/access'
import { getMerchantAnalytics, getMerchantOverview } from '@/lib/orders'
export default async function MerchantOverviewPanel(props: ServerProps) {
  const auth = await props.payload.auth({ headers: await headers() })
  const [overview, analytics] = await Promise.all([getMerchantOverview(), getMerchantAnalytics()])
  const user = auth.user
  const role = user && typeof user === 'object' && 'role' in user ? user.role : null
  const canSeeCommerce = hasAnyRole({ user: { role } } as never, ['super-admin', 'ops'])

  return (
    <section
      style={{
        marginBottom: 24,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 24,
        background: 'linear-gradient(135deg, #fff8f7 0%, #ffffff 45%, #fff5f3 100%)',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Merchant Overview
          </p>
          <h1 style={{ margin: '12px 0 0', fontSize: 30, lineHeight: 1.2 }}>商家总览</h1>
          <p style={{ margin: '12px 0 0', color: '#5c5048', lineHeight: 1.8 }}>
            把订单状态、近 30 天成交、库存风险和待处理事项集中到后台首页，运营进入 `/admin` 就能直接判断今天先做什么。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/ops-center" style={buttonPrimary}>
            后台运营中枢
          </a>
          {canSeeCommerce ? (
            <>
              <a href="/admin/orders-workbench" style={buttonPrimary}>
                打开订单工作台
              </a>
              <a href="/admin/payment-readiness" style={buttonPrimary}>
                支付联调就绪页
              </a>
              <a href="/admin/payment-observability" style={buttonPrimary}>
                支付回调观测页
              </a>
              <a href="/admin/manual-order" style={buttonPrimary}>
                后台录单
              </a>
              <a href="/admin/sales-fulfillment" style={buttonSecondary}>
                销售与履约报表
              </a>
              <a href="/admin/inventory-occupancy" style={buttonSecondary}>
                库存占用明细
              </a>
              <a href="/admin/collections/products" style={buttonSecondary}>
                管理商品
              </a>
            </>
          ) : null}
          <a href="/admin/collections/posts" style={buttonSecondary}>
            发布文章
          </a>
        </div>
      </div>

      <div style={{ marginTop: 22, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="订单总量" value={String(overview.stats.totalOrders)} hint="历史全部订单" />
        <MetricCard label="近 30 天成交额" value={`¥${overview.stats.paidRevenue30d.toLocaleString('zh-CN')}`} hint="已支付订单口径" />
        <MetricCard label="今日支付单" value={String(overview.stats.todaysPaidOrders)} hint="按 paidAt 统计" />
        <MetricCard label="待支付/支付中" value={String(overview.stats.pendingPaymentCount)} hint="需要催付或查单" />
        <MetricCard label="待履约" value={String(overview.stats.pendingFulfillmentCount)} hint="已支付待交付" />
        <MetricCard label="超时待复核" value={String(overview.stats.staleProcessingCount)} hint="processing 超时" />
        <MetricCard label="上架商品" value={String(overview.stats.activeProducts)} hint="当前 active" />
        <MetricCard label="库存跟踪商品" value={String(overview.stats.trackedInventoryProducts)} hint="开启 trackInventory" />
        <MetricCard label="低库存风险" value={String(overview.stats.lowStockCount)} hint="库存 <= 5 或禁缺货接单" tone="#8a2f16" />
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <QueueCard
          title="待履约订单"
          emptyText="当前没有待履约订单。"
          footerHref="/admin/orders-workbench"
          footerLabel="进入工作台处理"
          items={overview.queues.pendingFulfillmentOrders.map((order) => ({
            key: `${order.id}`,
            title: order.orderNo,
            meta: `${order.customerName || '未填写联系人'} · ¥${formatCurrency(order.totalAmount)}`,
            detail: order.paidAt ? `支付于 ${formatDate(order.paidAt)}` : '已支付，等待履约',
            href: `/admin/collections/orders/${order.id}`,
          }))}
        />
        <QueueCard
          title="超时待复核"
          emptyText="当前没有超时 processing 订单。"
          footerHref="/admin/orders-workbench"
          footerLabel="批量处理异常单"
          items={overview.queues.staleProcessingOrders.map((order) => ({
            key: `${order.id}`,
            title: order.orderNo,
            meta: `${order.customerName || '未填写联系人'} · ¥${formatCurrency(order.totalAmount)}`,
            detail: `最近更新 ${formatDate(order.updatedAt)}`,
            href: `/admin/collections/orders/${order.id}/payment-events`,
          }))}
        />
        <QueueCard
          title="低库存商品"
          emptyText="当前没有明显库存风险商品。"
          footerHref="/admin/collections/products"
          footerLabel="查看商品列表"
          items={overview.queues.lowStockProducts.map((product) => ({
            key: `${product.id}`,
            title: product.name,
            meta: `${product.sku || '未设置 SKU'} · 库存 ${typeof product.stockQuantity === 'number' ? product.stockQuantity : 0}`,
            detail: product.allowBackorder ? '允许缺货接单' : '库存不足会阻止下单',
            href: `/admin/collections/products/${product.id}`,
          }))}
        />
        <QueueCard
          title="最近成交"
          emptyText="当前还没有已支付订单。"
          footerHref="/admin/collections/orders"
          footerLabel="查看全部订单"
          items={overview.queues.recentPaidOrders.map((order) => ({
            key: `${order.id}`,
            title: order.orderNo,
            meta: `${order.customerName || '未填写联系人'} · ¥${formatCurrency(order.totalAmount)}`,
            detail: order.paidAt ? `支付于 ${formatDate(order.paidAt)}` : '已支付',
            href: `/orders/${order.orderNo}`,
          }))}
        />
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: '1.15fr 0.85fr' }}>
        <AnalyticsCard
          title="经营报表"
          description={`${analytics.windowLabel} 内的成交、失败和待支付结构，帮助判断支付转化和运营压力。`}
          metrics={[
            { label: '支付成功率', value: formatPercent(analytics.summary.paymentSuccessRate30d), tone: '#265b35' },
            { label: '支付失败率', value: formatPercent(analytics.summary.paymentFailureRate30d), tone: '#b42318' },
            { label: '待支付占比', value: formatPercent(analytics.summary.pendingRate30d), tone: '#8a5b12' },
            { label: '客单价', value: `¥${analytics.summary.avgOrderValue30d.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`, tone: '#1d1a17' },
          ]}
          footer={[
            `近 30 天订单 ${analytics.summary.totalOrders} 笔`,
            `支付成功 ${analytics.summary.paidOrders} 笔`,
            `支付失败 ${analytics.summary.failedOrders} 笔`,
            `处理中/未支付 ${analytics.summary.processingOrders + analytics.summary.unpaidOrders} 笔`,
          ]}
        />
        <TopProductsCard
          title="热销商品"
          description="按近 30 天已支付收入排序，方便判断推广重点和库存压力。"
          products={analytics.topProducts}
        />
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d1a17' }}>订单导出</p>
        <p style={{ margin: 0, color: '#5c5048', lineHeight: 1.7 }}>
          支持按支付状态和履约状态导出 CSV，方便客服跟进、对账和离线分析。
        </p>
        <OrderExportActions />
      </div>
    </section>
  )
}

function AnalyticsCard({
  title,
  description,
  metrics,
  footer,
}: {
  title: string
  description: string
  metrics: Array<{
    label: string
    value: string
    tone: string
  }>
  footer: string[]
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>{description}</p>
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {metrics.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 16,
              background: '#faf8f7',
              padding: '14px 16px',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: '#6f6661' }}>{item.label}</p>
            <p style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 700, color: item.tone }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {footer.map((item) => (
          <p key={item} style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

function TopProductsCard({
  title,
  description,
  products,
}: {
  title: string
  description: string
  products: Array<{
    productName: string
    paidUnits: number
    paidRevenue: number
  }>
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>{description}</p>
      </div>
      {products.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {products.map((product, index) => (
            <div
              key={`${product.productName}-${index}`}
              style={{
                borderRadius: 16,
                border: '1px solid rgba(20,20,20,0.08)',
                padding: '12px 14px',
                display: 'grid',
                gap: 6,
              }}
            >
              <strong>{product.productName}</strong>
              <span style={{ color: '#5c5048' }}>已支付 {product.paidUnits} 件</span>
              <span style={{ color: '#8d827a', fontSize: 13 }}>
                收入 ¥{product.paidRevenue.toLocaleString('zh-CN')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            borderRadius: 14,
            background: '#f7f4f3',
            padding: '12px 14px',
            color: '#5c5048',
            lineHeight: 1.7,
          }}
        >
          近 30 天还没有已支付商品收入。
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  tone = '#1d1a17',
}: {
  label: string
  value: string
  hint: string
  tone?: string
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '16px 18px',
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: '#6f6661' }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#8d827a' }}>{hint}</p>
    </div>
  )
}

function QueueCard({
  title,
  emptyText,
  footerHref,
  footerLabel,
  items,
}: {
  title: string
  emptyText: string
  footerHref: string
  footerLabel: string
  items: Array<{
    key: string
    title: string
    meta: string
    detail: string
    href: string
  }>
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 18,
        display: 'grid',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        <a href={footerHref} style={smallButton}>
          {footerLabel}
        </a>
      </div>
      {items.length ? (
        items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            style={{
              borderRadius: 16,
              border: '1px solid rgba(20,20,20,0.08)',
              padding: '12px 14px',
              textDecoration: 'none',
              color: '#1d1a17',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{item.title}</strong>
            <span style={{ color: '#5c5048', lineHeight: 1.6 }}>{item.meta}</span>
            <span style={{ color: '#8d827a', fontSize: 13 }}>{item.detail}</span>
          </a>
        ))
      ) : (
        <div
          style={{
            borderRadius: 14,
            background: '#f7f4f3',
            padding: '12px 14px',
            color: '#5c5048',
            lineHeight: 1.7,
          }}
        >
          {emptyText}
        </div>
      )}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function formatCurrency(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '0'
}

const buttonPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 16px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
}

const buttonSecondary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 16px',
  borderRadius: 999,
  background: '#fff',
  color: '#7e2d1a',
  textDecoration: 'none',
  fontWeight: 700,
  border: '1px solid rgba(180,35,24,0.18)',
}

const smallButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#fff5f3',
  color: '#9d2a13',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}
