import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { buildInventoryOccupancySummary } from '@/lib/inventory-occupancy'
import { formatFulfillmentStatus, formatOrderStatus, formatPaymentStatus } from '@/lib/order-status'
import type { Order, Product } from '@/payload-types'

export default async function InventoryOccupancyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = (await searchParams) || {}
  const selectedProductId = readNumberParam(resolvedSearchParams.productId)
  const payload = await getPayload({ config })
  const [productsResult, ordersResult] = await Promise.all([
    payload.find({
      collection: 'products',
      depth: 0,
      limit: 200,
      pagination: false,
      sort: 'name',
    }),
    payload.find({
      collection: 'orders',
      depth: 0,
      limit: 300,
      pagination: false,
      sort: '-updatedAt',
    }),
  ])

  const summaries = buildInventoryOccupancySummary(productsResult.docs as Product[], ordersResult.docs as Order[])
  const selectedSummary =
    summaries.find((item) => item.productId === selectedProductId) ||
    summaries.find((item) => item.totalReserved > 0) ||
    summaries[0] ||
    null

  const riskProducts = summaries.filter((item) => item.hasBlockingRisk || item.hasLowStockRisk)
  const occupiedProducts = summaries.filter((item) => item.totalReserved > 0)
  const totalReserved = summaries.reduce((sum, item) => sum + item.totalReserved, 0)
  const totalPaidReserved = summaries.reduce((sum, item) => sum + item.paidReserved, 0)

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
            <p style={eyebrowStyle}>Inventory Occupancy</p>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>库存占用与单品运营台</h1>
            <p style={descStyle}>
              把未取消订单对库存的占用拆到单品级别，区分未支付、支付中和已支付未履约，方便运营判断该催付、补货还是优先交付。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Link href="/admin/collections/products" style={buttonPrimary}>
              打开商品列表
            </Link>
            <Link href="/admin/orders-workbench" style={buttonSecondary}>
              打开订单工作台
            </Link>
            <Link href="/admin/manual-order" style={buttonSecondary}>
              后台录单
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <MetricCard label="占用商品数" value={String(occupiedProducts.length)} note="至少有一张未取消订单占用库存" tone="#1d1a17" />
          <MetricCard label="风险商品数" value={String(riskProducts.length)} note="低库存或会阻断下单" tone={riskProducts.length ? '#b42318' : '#265b35'} />
          <MetricCard label="总占用件数" value={String(totalReserved)} note="未支付 + 支付中 + 已支付未取消" tone="#8a5b12" />
          <MetricCard label="已支付占用" value={String(totalPaidReserved)} note="通常应优先履约释放压力" tone={totalPaidReserved ? '#265b35' : '#1d1a17'} />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '360px minmax(0, 1fr)' }}>
        <div
          style={{
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 20,
            background: '#fff',
            padding: 20,
            display: 'grid',
            gap: 14,
            alignContent: 'start',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>商品队列</h2>
            <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
              优先展示库存风险更高、占用更多的商品。
            </p>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {summaries.length ? (
              summaries.map((item) => {
                const isActive = selectedSummary?.productId === item.productId
                const note = [`库存 ${item.stockQuantity}`, `占用 ${item.totalReserved}`, `可售 ${item.availableQuantity}`]

                if (item.paidReserved > 0) {
                  note.push(`已支付 ${item.paidReserved}`)
                }

                if (item.hasBlockingRisk) {
                  note.push('阻断下单')
                } else if (item.hasLowStockRisk) {
                  note.push('低库存')
                }

                return (
                  <Link
                    key={item.productId}
                    href={buildProductHref(item.productId)}
                    style={{
                      borderRadius: 16,
                      border: isActive ? '1px solid rgba(180,35,24,0.28)' : '1px solid rgba(20,20,20,0.08)',
                      background: isActive ? '#fff4f2' : '#fff',
                      padding: '14px 16px',
                      color: '#1d1a17',
                      textDecoration: 'none',
                      display: 'grid',
                      gap: 6,
                    }}
                  >
                    <strong>{item.name}</strong>
                    <span style={{ color: '#6f6661', fontSize: 13 }}>{item.sku}</span>
                    <span style={{ color: item.hasBlockingRisk ? '#b42318' : item.hasLowStockRisk ? '#8a2f16' : '#4f4742', fontSize: 13 }}>
                      {note.join(' · ')}
                    </span>
                  </Link>
                )
              })
            ) : (
              <EmptyPanel text="当前没有商品数据，先在商品后台创建可售商品。" />
            )}
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 20,
            background: '#fff',
            padding: 20,
            display: 'grid',
            gap: 16,
            alignContent: 'start',
          }}
        >
          {selectedSummary ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    Product Detail
                  </p>
                  <h2 style={{ margin: '10px 0 0', fontSize: 26 }}>{selectedSummary.name}</h2>
                  <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
                    SKU {selectedSummary.sku}，当前状态 {selectedSummary.status}，库存策略
                    {selectedSummary.trackInventory ? '已开启跟踪' : '未跟踪库存'}
                    {selectedSummary.allowBackorder ? '，允许缺货接单。' : '，缺货时会阻断下单。'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                  <Link href={`/admin/collections/products/${selectedSummary.productId}`} style={buttonPrimary}>
                    编辑商品
                  </Link>
                  <Link href={`/admin/product-orders?productId=${selectedSummary.productId}`} style={buttonSecondary}>
                    查看关联订单
                  </Link>
                  {selectedSummary.slug ? (
                    <Link href={`/shop/${selectedSummary.slug}`} style={buttonSecondary}>
                      打开前台商品
                    </Link>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <MetricCard label="当前库存" value={String(selectedSummary.stockQuantity)} note="商品库存总量" tone="#1d1a17" />
                <MetricCard label="未支付占用" value={String(selectedSummary.unpaidReserved)} note="适合催付或取消" tone={selectedSummary.unpaidReserved ? '#8a5b12' : '#1d1a17'} />
                <MetricCard label="支付中占用" value={String(selectedSummary.processingReserved)} note="适合主动查单或人工复核" tone={selectedSummary.processingReserved ? '#7c4d12' : '#1d1a17'} />
                <MetricCard label="已支付占用" value={String(selectedSummary.paidReserved)} note="应优先推进履约" tone={selectedSummary.paidReserved ? '#265b35' : '#1d1a17'} />
                <MetricCard label="总占用" value={String(selectedSummary.totalReserved)} note="全部未取消订单占用" tone="#b42318" />
                <MetricCard label="剩余可售" value={String(selectedSummary.availableQuantity)} note={selectedSummary.allowBackorder ? '允许缺货接单' : '不允许超卖'} tone={selectedSummary.hasBlockingRisk ? '#b42318' : selectedSummary.hasLowStockRisk ? '#8a2f16' : '#265b35'} />
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                <InfoCard
                  title="建议动作"
                  detail={
                    selectedSummary.paidReserved > 0
                      ? `有 ${selectedSummary.paidReserved} 件已支付库存被占用，优先推进履约最直接。`
                      : selectedSummary.processingReserved > 0
                        ? '当前主要是支付中占用，适合先查单或人工复核。'
                        : selectedSummary.unpaidReserved > 0
                          ? '当前主要是未支付占用，适合催付或关闭超时单。'
                          : '当前没有订单占用，适合继续观察补货和上架策略。'
                  }
                />
                <InfoCard
                  title="订单联动"
                  detail="下方每一行都可以跳到订单编辑页；复杂支付异常建议再进入订单工作台或支付观测页处理。"
                />
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>占用订单明细</h3>
                {selectedSummary.orders.length ? (
                  selectedSummary.orders.map((order) => (
                    <article
                      key={order.id}
                      style={{
                        borderRadius: 16,
                        border: '1px solid rgba(20,20,20,0.08)',
                        background: '#fff',
                        padding: '14px 16px',
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{order.orderNo}</strong>
                          <p style={{ margin: '6px 0 0', color: '#4f4742', fontSize: 13 }}>
                            {order.customerName} · 占用 {order.quantity} 件
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <StatusPill label={formatPaymentStatus(order.paymentStatus)} tone={order.paymentStatus === 'paid' ? '#265b35' : order.paymentStatus === 'processing' ? '#8a5b12' : '#6f6661'} />
                          <StatusPill label={formatFulfillmentStatus(order.fulfillmentStatus)} tone={order.fulfillmentStatus === 'completed' ? '#265b35' : '#1d1a17'} />
                          <StatusPill label={formatOrderStatus(order.status)} tone="#1d1a17" />
                        </div>
                      </div>
                      <p style={{ margin: 0, color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>
                        创建于 {formatDate(order.createdAt)}，最近更新 {formatDate(order.updatedAt)}
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link href={`/admin/collections/orders/${order.id}`} style={smallButtonPrimary}>
                          编辑订单
                        </Link>
                        <Link href={`/orders/${order.orderNo}`} style={smallButtonSecondary}>
                          前台订单页
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyPanel text="当前商品没有未取消订单占用库存。" />
                )}
              </div>
            </>
          ) : (
            <EmptyPanel text="当前没有可展示的商品占用数据。" />
          )}
        </div>
      </section>
    </main>
  )
}

function readNumberParam(input: string | string[] | undefined) {
  const value = Array.isArray(input) ? input[0] : input
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

function buildProductHref(productId: number) {
  return `/admin/inventory-occupancy?productId=${productId}`
}

function formatDate(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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
        border: '1px solid rgba(20,20,20,0.08)',
        background: '#fff',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

function InfoCard({
  title,
  detail,
}: {
  title: string
  detail: string
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#faf8f7',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <strong>{title}</strong>
      <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>{detail}</p>
    </div>
  )
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#f7f4f3',
        padding: '14px 16px',
        color: '#5c5048',
        lineHeight: 1.7,
      }}
    >
      {text}
    </div>
  )
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '6px 10px',
        background: '#fff8f7',
        color: tone,
        border: '1px solid rgba(20,20,20,0.08)',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
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

const smallButtonPrimary = {
  ...buttonPrimary,
  minWidth: 0,
  padding: '8px 12px',
  fontSize: 13,
} as const

const smallButtonSecondary = {
  ...buttonSecondary,
  minWidth: 0,
  padding: '8px 12px',
  fontSize: 13,
} as const
