import type { BeforeListServerProps } from 'payload'

type CategorySummary = {
  id: number
  name: string
  slug: string
  total: number
}

export default async function ProductTaxonomyOpsPanel(props: BeforeListServerProps) {
  const [categoriesResult, productsResult] = await Promise.all([
    props.payload
      .find({
        collection: 'product-categories',
        depth: 0,
        limit: 100,
        pagination: false,
        sort: 'name',
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload
      .find({
        collection: 'products',
        depth: 1,
        limit: 200,
        pagination: false,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
  ])

  const categoryCounts = new Map<number, number>()

  for (const product of productsResult.docs) {
    const categoryId = getRelationshipId(product.primaryCategory)

    if (!categoryId) {
      continue
    }

    categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1)
  }

  const categorySummaries: CategorySummary[] = categoriesResult.docs
    .map((category) => {
      const id = typeof category.id === 'number' ? category.id : 0
      const name = typeof category.name === 'string' ? category.name : ''
      const slug = typeof category.slug === 'string' ? category.slug : ''

      if (!id || !name || !slug) {
        return null
      }

      return {
        id,
        name,
        slug,
        total: categoryCounts.get(id) || 0,
      }
    })
    .filter((item): item is CategorySummary => Boolean(item))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'zh-CN'))

  const uncategorizedCount = productsResult.docs.filter((product) => !getRelationshipId(product.primaryCategory)).length
  const activeCount = productsResult.docs.filter((product) => product.status === 'active').length

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
            Taxonomy Ops
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>商品分类运营</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            这里汇总商品主分类使用情况，并提供原生列表的快捷筛选入口，方便按品类推进商城维护。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/collections/product-categories" style={buttonPrimary}>
            管理商品分类
          </a>
          <a href="/shop" style={buttonSecondary}>
            查看商城前台
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="分类总数" value={String(categorySummaries.length)} note="已创建的商品分类数量" tone="#265b35" />
        <MetricCard label="商品总数" value={String(productsResult.docs.length)} note={`其中上架 ${activeCount} 个`} tone="#1d1a17" />
        <MetricCard
          label="未分类商品"
          value={String(uncategorizedCount)}
          note={uncategorizedCount ? '建议尽快补齐主分类' : '当前所有商品都有主分类'}
          tone={uncategorizedCount ? '#b42318' : '#265b35'}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href="/admin/collections/products" style={chipPrimary}>
          全部商品
        </a>
        {categorySummaries.map((category) => (
          <a key={category.id} href={buildProductsFilterHref(category.id)} style={chipSecondary}>
            {category.name} ({category.total})
          </a>
        ))}
      </div>
    </section>
  )
}

function getRelationshipId(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return 0
  }

  const id = 'id' in value ? value.id : 0
  return typeof id === 'number' ? id : 0
}

function buildProductsFilterHref(categoryId: number) {
  return `/admin/collections/products?where[primaryCategory][equals]=${encodeURIComponent(String(categoryId))}`
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

const chipPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  borderRadius: 999,
  background: '#b42318',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
} as const

const chipSecondary = {
  ...chipPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
} as const
