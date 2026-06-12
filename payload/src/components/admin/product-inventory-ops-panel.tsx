import type { BeforeListServerProps } from 'payload'

export default async function ProductInventoryOpsPanel(props: BeforeListServerProps) {
  const products = Array.isArray(props.data?.docs) ? props.data.docs : []

  const trackedCount = products.filter((product) => Boolean(product.trackInventory)).length
  const blockedCount = products.filter((product) => {
    const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
    return Boolean(product.trackInventory) && stockQuantity <= 0 && !product.allowBackorder
  }).length
  const lowStockCount = products.filter((product) => {
    const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
    return Boolean(product.trackInventory) && stockQuantity > 0 && stockQuantity <= 5
  }).length

  return (
    <section
      style={{
        marginBottom: 20,
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
            Inventory Ops
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>商品库存摘要</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            当前原生列表结果里的库存跟踪、低库存和阻断下单情况会在这里直接汇总，方便运营边筛边处理。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/inventory-occupancy" style={buttonPrimary}>
            库存占用明细
          </a>
          <a href="/admin/product-orders" style={buttonPrimary}>
            单品订单台
          </a>
          <a href="/admin/orders-workbench" style={buttonPrimary}>
            查看订单工作台
          </a>
          <a href="/shop" style={buttonSecondary}>
            查看商城前台
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="当前页商品数" value={String(products.length)} note="当前原生列表结果数量" tone="#1d1a17" />
        <MetricCard label="库存跟踪" value={String(trackedCount)} note="开启 trackInventory 的商品" tone="#265b35" />
        <MetricCard label="低库存" value={String(lowStockCount)} note="库存 1-5 件的商品" tone={lowStockCount ? '#8a2f16' : '#265b35'} />
        <MetricCard label="阻断下单" value={String(blockedCount)} note="库存为 0 且不允许缺货接单" tone={blockedCount ? '#b42318' : '#265b35'} />
      </div>
    </section>
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
