import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { BatchOrderQueue } from '@/components/admin/batch-order-queue'
import { hasRole } from '@/lib/access'
import { buildInventoryOccupancySummary, buildProductOrdersSummary } from '@/lib/inventory-occupancy'
import type { Order, Product } from '@/payload-types'

export default async function ProductOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = (await searchParams) || {}
  const selectedProductId = readNumberParam(resolvedSearchParams.productId)
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  const canManageCommerce = hasRole(auth.user, ['super-admin', 'ops'])
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

  const products = productsResult.docs as Product[]
  const occupancy = buildInventoryOccupancySummary(products, ordersResult.docs as Order[])
  const selectedProduct =
    products.find((item) => item.id === selectedProductId) ||
    products.find((item) => occupancy.find((summary) => summary.productId === item.id && summary.orders.length > 0)) ||
    products[0] ||
    null

  const selectedOrders = selectedProduct ? occupancy.find((item) => item.productId === selectedProduct.id)?.orders || [] : []
  const summary = selectedProduct ? buildProductOrdersSummary({ product: selectedProduct, orders: selectedOrders }) : null

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
            <p style={eyebrowStyle}>Product Orders</p>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>单品订单运营台</h1>
            <p style={descStyle}>
              围绕单个商品查看待支付、待履约、异常和已完成订单，适合运营在补货、催付和交付时集中处理同一商品相关订单。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Link href="/admin/orders-workbench" style={buttonPrimary}>
              订单工作台
            </Link>
            <Link href="/admin/inventory-occupancy" style={buttonSecondary}>
              库存占用台
            </Link>
            <Link href="/admin/collections/products" style={buttonSecondary}>
              商品列表
            </Link>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '340px minmax(0, 1fr)' }}>
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
            <h2 style={{ margin: 0, fontSize: 22 }}>商品选择</h2>
            <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
              优先显示当前有订单关联的商品。
            </p>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {products.length ? (
              products.map((product) => {
                const productOrders = occupancy.find((item) => item.productId === product.id)?.orders.length || 0
                const isActive = selectedProduct?.id === product.id
                return (
                  <Link
                    key={product.id}
                    href={`/admin/product-orders?productId=${product.id}`}
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
                    <strong>{product.name || '未命名商品'}</strong>
                    <span style={{ color: '#6f6661', fontSize: 13 }}>{product.sku || '未设置 SKU'}</span>
                    <span style={{ color: '#4f4742', fontSize: 13 }}>关联订单 {productOrders} 笔</span>
                  </Link>
                )
              })
            ) : (
              <EmptyPanel text="当前没有商品数据。" />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {summary ? (
            <>
              <section
                style={{
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
                      Product Summary
                    </p>
                    <h2 style={{ margin: '10px 0 0', fontSize: 26 }}>{summary.productName}</h2>
                    <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
                      SKU {summary.sku}，当前状态 {summary.status}，共关联 {summary.totalOrders} 笔订单，其中 {summary.pendingPaymentOrders.length} 笔待支付/
                      支付中，{summary.pendingFulfillmentOrders.length} 笔待履约。
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                    <Link href={`/admin/collections/products/${summary.productId}`} style={buttonPrimary}>
                      编辑商品
                    </Link>
                    <Link href={`/admin/inventory-occupancy?productId=${summary.productId}`} style={buttonSecondary}>
                      查看库存占用
                    </Link>
                    {summary.slug ? (
                      <Link href={`/shop/${summary.slug}`} style={buttonSecondary}>
                        前台商品页
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <MetricCard label="关联订单" value={String(summary.totalOrders)} note="当前商品全部订单" tone="#1d1a17" />
                  <MetricCard label="待支付/支付中" value={String(summary.pendingPaymentOrders.length)} note="适合催付和查单" tone={summary.pendingPaymentOrders.length ? '#8a5b12' : '#265b35'} />
                  <MetricCard label="待履约" value={String(summary.pendingFulfillmentOrders.length)} note="已支付待交付" tone={summary.pendingFulfillmentOrders.length ? '#265b35' : '#1d1a17'} />
                  <MetricCard label="异常/处理中" value={String(summary.exceptionOrders.length)} note="支付失败或处理异常" tone={summary.exceptionOrders.length ? '#b42318' : '#265b35'} />
                  <MetricCard label="已完成" value={String(summary.completedOrders.length)} note="已支付且已完成交付" tone="#265b35" />
                  <MetricCard label="已支付收入" value={`¥${summary.paidRevenue.toLocaleString('zh-CN')}`} note="按当前商品相关订单汇总" tone="#1d1a17" />
                  <MetricCard label="库存占用" value={String(summary.totalReserved)} note={`未支付 ${summary.unpaidReserved} / 支付中 ${summary.processingReserved} / 已支付 ${summary.paidReserved}`} tone="#b42318" />
                  <MetricCard label="剩余可售" value={String(summary.availableQuantity)} note={summary.allowBackorder ? '允许缺货接单' : '库存策略正常生效'} tone={summary.availableQuantity > 5 ? '#265b35' : '#8a2f16'} />
                </div>
              </section>

              <BatchOrderQueue
                title="待支付 / 支付中"
                description="按商品聚焦待支付与支付中的订单，适合催付、取消或转去支付复核。"
                emptyText="当前商品没有待支付或支付中的订单。"
                orders={summary.pendingPaymentOrders}
                viewAllHref={`/admin/product-orders?productId=${summary.productId}`}
                allowCommerceActions={canManageCommerce}
                batchActions={[{ label: '批量取消订单', action: 'cancel', tone: 'danger' }]}
              />

              <BatchOrderQueue
                title="待履约"
                description="已支付但尚未完成交付的订单，适合集中推进同一商品的履约。"
                emptyText="当前商品没有待履约订单。"
                orders={summary.pendingFulfillmentOrders}
                viewAllHref={`/admin/product-orders?productId=${summary.productId}`}
                renderMode="fulfillment"
                allowCommerceActions={canManageCommerce}
                batchActions={[
                  { label: '批量标记准备中', action: 'mark-processing', tone: 'primary' },
                  { label: '批量标记已完成', action: 'mark-completed', tone: 'success' },
                ]}
              />

              <BatchOrderQueue
                title="异常 / 处理中"
                description="适合同一商品维度排查支付失败、处理中和链路异常订单。"
                emptyText="当前商品没有异常或处理中订单。"
                orders={summary.exceptionOrders}
                viewAllHref={`/admin/product-orders?productId=${summary.productId}`}
                renderMode="review"
                allowCommerceActions={canManageCommerce}
                batchActions={[
                  { label: '批量确认已支付', action: 'mark-paid', tone: 'success' },
                  { label: '批量标记失败', action: 'mark-failed', tone: 'danger' },
                ]}
              />

              <BatchOrderQueue
                title="已完成"
                description="已经支付且履约完成的订单，可用来回看单品成交和售后上下文。"
                emptyText="当前商品还没有已完成订单。"
                orders={summary.completedOrders}
                viewAllHref={`/admin/product-orders?productId=${summary.productId}`}
                allowCommerceActions={canManageCommerce}
              />
            </>
          ) : (
            <EmptyPanel text="当前没有可展示的商品订单数据。" />
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
