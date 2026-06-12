import type { BeforeDocumentControlsServerProps } from 'payload'
import { HomeFeatureSortActions } from '@/components/admin/home-feature-sort-actions'

type FeaturedItem = {
  id: number
  title: string
  href: string
  note: string
  entityType: 'page' | 'post' | 'product'
  isPublished: boolean
}

export default async function SiteSettingsHomeSummary(props: BeforeDocumentControlsServerProps) {
  const siteSettings = await props.payload
    .findGlobal({
      slug: 'site-settings',
      depth: 1,
    })
    .catch(() => null)

  if (!siteSettings) {
    return null
  }

  const pages = await props.payload
    .find({
      collection: 'pages',
      depth: 0,
      limit: 50,
      pagination: false,
      where: {
        status: {
          equals: 'published',
        },
      },
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  const posts = await props.payload
    .find({
      collection: 'posts',
      depth: 0,
      limit: 50,
      pagination: false,
      where: {
        status: {
          equals: 'published',
        },
      },
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  const products = await props.payload
    .find({
      collection: 'products',
      depth: 0,
      limit: 50,
      pagination: false,
      where: {
        status: {
          equals: 'active',
        },
      },
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  const home = siteSettings.home || {}
  const featuredPages = normalizeFeaturedPages(home.featuredPages)
  const featuredPosts = normalizeRelationshipTitles(home.featuredPosts, 'title', 'post')
  const featuredProducts = normalizeRelationshipTitles(home.featuredProducts, 'name', 'product')
  const hasUnpublishedFeatured = [...featuredPages, ...featuredPosts, ...featuredProducts].some((item) => !item.isPublished)

  return (
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
            Home Ops Summary
          </p>
          <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>首页运营摘要</h2>
          <p style={{ margin: '10px 0 0', color: '#4f4742', lineHeight: 1.7 }}>
            这里汇总当前首页主文案、推荐内容选择情况，以及未配置时前台会采用的回退规则。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/" style={buttonPrimary}>
            打开前台首页
          </a>
          <a href="/admin/collections/pages" style={buttonSecondary}>
            管理页面
          </a>
          <a href="/admin/collections/products" style={buttonSecondary}>
            管理商品
          </a>
        </div>
      </div>

      {hasUnpublishedFeatured ? (
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
          当前首页推荐中存在未发布页面、未发布文章或未上架商品。它们不会再允许通过快捷操作重新加入，建议尽快替换或移除。
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="首页标题" value={safeText(home.heroTitle) || '未填写'} note={safeText(home.eyebrow) || '无 eyebrow'} />
        <MetricCard
          label="推荐专题页"
          value={String(featuredPages.length)}
          note={featuredPages.length ? '已显式选择' : `未选择时会回退到已发布页面，当前可用 ${pages.docs.length} 个`}
          tone={featuredPages.length ? '#265b35' : '#8a5b12'}
        />
        <MetricCard
          label="推荐文章"
          value={String(featuredPosts.length)}
          note={featuredPosts.length ? '已显式选择' : `未选择时会回退到最新文章，当前可用 ${posts.docs.length} 篇`}
          tone={featuredPosts.length ? '#265b35' : '#8a5b12'}
        />
        <MetricCard
          label="推荐商品"
          value={String(featuredProducts.length)}
          note={featuredProducts.length ? '已显式选择' : `未选择时会回退到上架商品，当前可用 ${products.docs.length} 个`}
          tone={featuredProducts.length ? '#265b35' : '#8a5b12'}
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <FeaturedListCard
          title="已选专题页"
          emptyText="当前没有手动选择专题页。前台会优先尝试 `bailongma` 和 `home`，再回退到已发布页面。"
          items={featuredPages}
        />
        <FeaturedListCard
          title="已选文章"
          emptyText="当前没有手动选择文章。前台会回退到最新发布的文章。"
          items={featuredPosts}
        />
        <FeaturedListCard
          title="已选商品"
          emptyText="当前没有手动选择商品。前台会回退到上架商品列表中的前几项。"
          items={featuredProducts}
        />
      </div>

      <div
        style={{
          borderRadius: 14,
          background: '#faf8f7',
          padding: '12px 14px',
          color: '#4f4742',
          lineHeight: 1.7,
        }}
      >
        当前首页 CTA：{safeText(home.ctaLabel) || '未填写'} → {safeText(home.ctaHref) || '未填写'}。如果需要临时改首页重点导流方向，优先改推荐内容和 CTA，
        不必改前台代码。
      </div>
    </section>
  )
}

function normalizeFeaturedPages(value: unknown): FeaturedItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  const items: Array<FeaturedItem | null> = value.map((item) => {
    if (!item || typeof item !== 'object') {
      return null
    }

    const title = typeof item.title === 'string' ? item.title : '未命名页面'
    const slug = typeof item.slug === 'string' ? item.slug : ''
    const id = typeof item.id === 'number' ? item.id : 0

    if (id <= 0) {
      return null
    }

    return {
      id,
      title,
      href: slug ? (slug === 'home' ? '/' : `/${slug}`) : '/admin/collections/pages',
      note:
        typeof item.status === 'string' && item.status !== 'published'
          ? `草稿状态: ${item.status}`
          : slug
            ? `slug: ${slug}`
            : '未读取到 slug',
      entityType: 'page',
      isPublished: item.status === 'published',
    }
  })

  return items.filter((item): item is FeaturedItem => Boolean(item))
}

function normalizeRelationshipTitles(
  value: unknown,
  titleKey: 'title' | 'name',
  entityType: 'post' | 'product',
): FeaturedItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  const items: Array<FeaturedItem | null> = value.map((item) => {
    if (!item || typeof item !== 'object') {
      return null
    }

    const title = item[titleKey]
    const id = typeof item.id === 'number' ? item.id : 0

    if (typeof title !== 'string' || id <= 0) {
      return null
    }

    const status = typeof item.status === 'string' ? item.status : ''
    const isPublished = entityType === 'post' ? status === 'published' : status === 'active'

    return {
      id,
      title,
      href: entityType === 'post' ? '/admin/collections/posts' : '/admin/collections/products',
      note: isPublished
        ? entityType === 'post'
          ? '来自首页推荐文章配置'
          : '来自首页推荐商品配置'
        : entityType === 'post'
          ? `未发布状态: ${status || 'unknown'}`
          : `未上架状态: ${status || 'unknown'}`,
      entityType,
      isPublished,
    }
  })

  return items.filter((item): item is FeaturedItem => Boolean(item))
}

function safeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function FeaturedListCard({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: FeaturedItem[]
}) {
  return (
    <article
      style={{
        border: '1px solid rgba(20,20,20,0.08)',
        borderRadius: 18,
        background: '#fff',
        padding: 16,
        display: 'grid',
        gap: 12,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
        <p style={{ margin: '8px 0 0', color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>{emptyText}</p>
      </div>

      {items.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item, index) => (
            <div
              key={`${item.entityType}-${item.id}`}
              style={{
                borderRadius: 14,
                border: item.isPublished ? '1px solid rgba(20,20,20,0.08)' : '1px solid rgba(180,35,24,0.24)',
                background: item.isPublished ? '#faf8f7' : '#fff3f1',
                padding: '12px 14px',
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <a href={item.href} style={{ color: '#1d1a17', fontWeight: 600, textDecoration: 'none' }}>
                    {item.title}
                  </a>
                  <p style={{ margin: 0, color: '#6f6661', fontSize: 13, lineHeight: 1.7 }}>{item.note}</p>
                  {!item.isPublished ? (
                    <p style={{ margin: 0, color: '#b42318', fontSize: 13, fontWeight: 600 }}>当前内容未发布/未上架，建议尽快替换或移除。</p>
                  ) : null}
                </div>
                <HomeFeatureSortActions
                  entityType={item.entityType}
                  id={item.id}
                  disableMoveUp={index === 0}
                  disableMoveDown={index === items.length - 1}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: '#6f6661', lineHeight: 1.7 }}>{emptyText}</p>
      )}
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
