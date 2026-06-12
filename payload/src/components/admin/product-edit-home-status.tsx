import type { BeforeDocumentControlsServerProps } from 'payload'
import { HomeFeatureToggle } from '@/components/admin/home-feature-toggle'
import { PublishReadinessCard } from '@/components/admin/publish-readiness-card'

export default async function ProductEditHomeStatus(props: BeforeDocumentControlsServerProps) {
  const id = typeof props.id === 'number' || typeof props.id === 'string' ? Number(props.id) : 0

  if (!id) {
    return null
  }

  const [product, siteSettings] = await Promise.all([
    props.payload.findByID({
      collection: 'products',
      id,
      depth: 0,
    }).catch(() => null),
    props.payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
    }).catch(() => null),
  ])

  if (!product) {
    return null
  }

  const featuredProducts = Array.isArray(siteSettings?.home?.featuredProducts) ? siteSettings.home.featuredProducts : []
  const isFeatured = featuredProducts.some((item) => typeof item === 'object' && item && Number(item.id) === product.id)
  const slug = typeof product.slug === 'string' ? product.slug : ''
  const frontendHref = slug ? `/shop/${slug}` : null
  const isPublished = product.status === 'active'
  const publishStatus = typeof product.status === 'string' ? product.status : 'unknown'
  const hasSummary = typeof product.summary === 'string' && product.summary.trim().length > 0
  const hasPrice = typeof product.price === 'number' && product.price >= 0
  const hasCurrency = typeof product.currency === 'string' && product.currency.trim().length > 0
  const hasContent = Boolean(product.content && typeof product.content === 'object')
  const hasStock = !product.trackInventory || product.allowBackorder || (typeof product.stockQuantity === 'number' && product.stockQuantity > 0)
  const hasCover = Boolean(product.cover)
  const hasGallery = Array.isArray(product.gallery) && product.gallery.length > 0
  const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0
  const hasInventoryRisk = Boolean(product.trackInventory) && stockQuantity <= 5
  const issues = [
    slug
      ? { label: `slug 已就绪：${slug}`, tone: 'success' as const }
      : { label: '缺少 slug，商品详情页无法访问。', tone: 'error' as const },
    hasPrice
      ? { label: `价格已填写：${product.currency === 'CNY' ? '¥' : ''}${typeof product.price === 'number' ? product.price.toLocaleString('zh-CN') : '0'}`, tone: 'success' as const }
      : { label: '缺少有效价格，商品不能上架。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasCurrency
      ? { label: `币种已填写：${product.currency}`, tone: 'success' as const }
      : { label: '缺少币种配置。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasSummary
      ? { label: '商品摘要已填写。', tone: 'success' as const }
      : { label: '缺少商品摘要，列表和详情页转化会偏弱。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasContent
      ? { label: '商品详情内容已填写。', tone: 'success' as const }
      : { label: '缺少商品详情内容，上架后信息不足。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasStock
      ? { label: product.trackInventory ? '库存/缺货接单策略已满足。' : '当前未启用库存跟踪，可直接接单。', tone: 'success' as const }
      : { label: '已启用库存跟踪，但库存为 0 且未允许缺货接单，当前不适合上架。', tone: isPublished ? ('error' as const) : ('warning' as const) },
    hasCover
      ? { label: '商品封面已配置。', tone: 'success' as const }
      : { label: '建议补齐商品封面，列表页和详情页首屏会更完整。', tone: 'warning' as const },
    hasGallery
      ? { label: '商品图库已配置。', tone: 'success' as const }
      : { label: '建议补齐商品图库，详情页说服力会更强。', tone: 'warning' as const },
    hasInventoryRisk
      ? {
          label: stockQuantity <= 0 && !product.allowBackorder ? '库存为 0 且不允许缺货接单，会直接阻断下单。' : `当前库存仅剩 ${stockQuantity} 件，建议尽快补货或调整策略。`,
          tone: stockQuantity <= 0 && !product.allowBackorder ? ('error' as const) : ('warning' as const),
        }
      : { label: '当前库存风险可控。', tone: 'success' as const },
  ]
  const blockingIssues = issues.filter((issue) => issue.tone === 'error').length
  const readinessTone = blockingIssues ? 'error' : issues.some((issue) => issue.tone === 'warning') ? 'warning' : 'success'
  const readinessLabel = blockingIssues ? '当前不可稳妥上架' : readinessTone === 'warning' ? '可上架但建议补齐' : '上架就绪'

  return (
    <>
      <PublishReadinessCard
        title="商品上架就绪度"
        description="这里按商品详情页、下单入口和库存规则检查商品是否已经适合正式上架。"
        statusLabel={readinessLabel}
        statusTone={readinessTone}
        issues={issues}
      />

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
            Home Featured Status
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>首页推荐协同</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            当前商品 {isFeatured ? '已进入首页推荐' : '尚未进入首页推荐'}。如果需要把这个商品放到首页精选区，请去首页配置维护推荐商品。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/globals/site-settings" style={buttonPrimary}>
            编辑首页推荐
          </a>
          <a href={`/admin/inventory-occupancy?productId=${product.id}`} style={buttonSecondary}>
            查看库存占用
          </a>
          <a href={`/admin/product-orders?productId=${product.id}`} style={buttonSecondary}>
            查看关联订单
          </a>
          {frontendHref ? (
            <a href={frontendHref} style={buttonSecondary}>
              打开前台商品
            </a>
          ) : null}
        </div>
      </div>

      {!isPublished && isFeatured ? (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid rgba(180,35,24,0.24)',
            background: '#fff3f1',
            padding: '14px 16px',
            color: '#7a271a',
            lineHeight: 1.7,
          }}
        >
          当前商品未上架，但仍保留在首页推荐里。前台可能回退到其他可售商品，建议先上架或从首页推荐移除。
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="推荐状态" value={isFeatured ? '已推荐' : '未推荐'} note={isFeatured ? '首页会优先使用这个商品' : '当前只能通过商品列表或回退规则进入首页'} tone={isFeatured ? '#265b35' : '#8a5b12'} />
        <MetricCard
          label="上架状态"
          value={isPublished ? '已上架' : '未上架'}
          note={isPublished ? '允许加入首页推荐' : '未上架商品不能再加入首页推荐'}
          tone={isPublished ? '#265b35' : '#b42318'}
        />
        <MetricCard label="商品名称" value={typeof product.name === 'string' ? product.name : '未命名商品'} note={slug ? `slug: ${slug}` : '未设置 slug'} />
        <MetricCard label="当前状态值" value={publishStatus} note="用于核对商品保存状态和首页推荐资格" tone={isPublished ? '#1d1a17' : '#b42318'} />
      </div>

      <HomeFeatureToggle entityType="product" id={product.id} isFeatured={isFeatured} />
      </section>
    </>
  )
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
