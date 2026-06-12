import type { ServerProps } from 'payload'
import { buildInventoryOccupancySummary } from '@/lib/inventory-occupancy'

type InventoryRiskItem = {
  id: number
  name: string
  sku: string
  detail: string
  href: string
}

export default async function InventoryGovernancePanel(props: ServerProps) {
  const [productsResult, ordersResult] = await Promise.all([
    props.payload
      .find({
        collection: 'products',
        depth: 0,
        limit: 100,
        pagination: false,
        sort: 'stockQuantity',
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload
      .find({
        collection: 'orders',
        depth: 0,
        limit: 200,
        pagination: false,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
  ])

  const products = productsResult.docs
  const orders = ordersResult.docs

  const trackedProducts = products.filter((product) => Boolean(product.trackInventory))
  const activeTrackedProducts = trackedProducts.filter((product) => product.status === 'active')
  const lowStockProducts = trackedProducts.filter((product) => {
    const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
    return stockQuantity <= 5
  })
  const blockedProducts = trackedProducts.filter((product) => {
    const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
    return product.status === 'active' && stockQuantity <= 0 && !product.allowBackorder
  })

  const occupancy = buildInventoryOccupancySummary(products as never[], orders as never[])

  const riskItems: InventoryRiskItem[] = trackedProducts
    .map((product) => {
      const id = typeof product.id === 'number' ? product.id : 0
      const name = typeof product.name === 'string' ? product.name : '未命名商品'
      const sku = typeof product.sku === 'string' && product.sku.trim() ? product.sku : '未设置 SKU'
      const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
      const reserved = occupancy.find((item) => item.productId === id)?.totalReserved || 0
      const available = Math.max(0, stockQuantity - reserved)
      const detailParts = [`库存 ${stockQuantity}`, `占用 ${reserved}`, `可售 ${available}`]

      if (available <= 0 && !product.allowBackorder) {
        detailParts.push('会阻止下单')
      } else if (available <= 5) {
        detailParts.push('低库存风险')
      }

      return {
        id,
        name,
        sku,
        detail: detailParts.join(' · '),
        href: `/admin/collections/products/${id}`,
      }
    })
    .filter((item) => item.detail.includes('低库存风险') || item.detail.includes('会阻止下单'))
    .sort((a, b) => a.detail.localeCompare(b.detail, 'zh-CN'))

  return (
    <section
      style={{
        marginBottom: 24,
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 24,
        background: '#fff',
        padding: 24,
        display: 'grid',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={eyebrowStyle}>Inventory Governance</p>
          <h1 style={{ margin: '12px 0 0', fontSize: 30, lineHeight: 1.2 }}>库存与商品运营治理</h1>
          <p style={descStyle}>
            这里集中查看低库存、零库存阻断、库存占用和跟踪商品规模，帮助运营快速判断今天需要补货、下架还是允许缺货接单。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/collections/products" style={buttonPrimary}>
            管理商品
          </a>
          <a href="/admin/inventory-occupancy" style={buttonSecondary}>
            单品占用明细
          </a>
          <a href="/admin/orders-workbench" style={buttonSecondary}>
            查看订单工作台
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="库存跟踪商品" value={String(trackedProducts.length)} tone="#1d1a17" />
        <MetricCard label="上架跟踪商品" value={String(activeTrackedProducts.length)} tone="#265b35" />
        <MetricCard label="低库存商品" value={String(lowStockProducts.length)} tone={lowStockProducts.length ? '#8a2f16' : '#265b35'} />
        <MetricCard label="阻断下单商品" value={String(blockedProducts.length)} tone={blockedProducts.length ? '#b42318' : '#265b35'} />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <IssueCard
          title="库存风险商品"
          emptyText="当前没有明显的库存风险商品。"
          items={riskItems.slice(0, 8)}
        />
      </div>
    </section>
  )
}

function IssueCard({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: InventoryRiskItem[]
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
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      {items.length ? (
        items.map((item) => (
          <a
            key={`${item.id}-${item.sku}`}
            href={item.href}
            style={{
              borderRadius: 16,
              border: '1px solid rgba(180,35,24,0.12)',
              background: '#fff8f7',
              padding: '12px 14px',
              textDecoration: 'none',
              color: '#1d1a17',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{item.name}</strong>
            <span style={{ color: '#6f6661', fontSize: 13 }}>{item.sku}</span>
            <span style={{ color: '#8a2f16', fontSize: 13 }}>{item.detail}</span>
          </a>
        ))
      ) : (
        <div style={{ borderRadius: 14, background: '#f7f4f3', padding: '12px 14px', color: '#5c5048', lineHeight: 1.7 }}>{emptyText}</div>
      )}
    </div>
  )
}

function MetricCard({
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
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '16px 18px',
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: '#6f6661' }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
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
