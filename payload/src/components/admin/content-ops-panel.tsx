import { headers } from 'next/headers'
import type { ServerProps } from 'payload'
import { hasAnyRole } from '@/lib/access'
export default async function ContentOpsPanel(props: ServerProps) {
  const auth = await props.payload.auth({ headers: await headers() })
  const [siteSettings, pages, posts, products, postCategories, productCategories] = await Promise.all([
    props.payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
    }).catch(() => null),
    props.payload.find({
      collection: 'pages',
      depth: 0,
      limit: 6,
      sort: '-updatedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    }).catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload.find({
      collection: 'posts',
      depth: 0,
      limit: 6,
      sort: '-updatedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    }).catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload.find({
      collection: 'products',
      depth: 0,
      limit: 6,
      sort: '-updatedAt',
      where: {
        status: {
          equals: 'active',
        },
      },
    }).catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload.find({
      collection: 'post-categories',
      depth: 0,
      limit: 12,
      pagination: false,
      sort: 'name',
    }).catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    props.payload.find({
      collection: 'product-categories',
      depth: 0,
      limit: 12,
      pagination: false,
      sort: 'name',
    }).catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
  ])

  const home = (siteSettings?.home || {}) as Record<string, unknown>
  const featuredPagesCount = Array.isArray(home.featuredPages) ? home.featuredPages.length : 0
  const featuredPostsCount = Array.isArray(home.featuredPosts) ? home.featuredPosts.length : 0
  const featuredProductsCount = Array.isArray(home.featuredProducts) ? home.featuredProducts.length : 0
  const user = auth.user
  const role = user && typeof user === 'object' && 'role' in user ? user.role : null
  const canSeeContent = hasAnyRole({ user: { role } } as never, ['super-admin', 'editor'])
  const canSeeCommerce = hasAnyRole({ user: { role } } as never, ['super-admin', 'ops'])

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
          <p style={{ margin: 0, color: '#b42318', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Content Ops
          </p>
          <h1 style={{ margin: '12px 0 0', fontSize: 30, lineHeight: 1.2 }}>内容运营面板</h1>
          <p style={{ margin: '12px 0 0', color: '#5c5048', lineHeight: 1.8 }}>
            把首页编排、专题页、文章和商品入口集中到后台首页，减少在 `site-settings`、页面、文章、商品集合之间来回跳。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <a href="/admin/ops-center" style={buttonPrimary}>
            打开运营中枢
          </a>
          {canSeeContent ? (
            <>
              <a href="/admin/globals/site-settings" style={buttonPrimary}>
                编辑首页配置
              </a>
              <a href="/admin/content-governance" style={buttonSecondary}>
                内容治理台
              </a>
              <a href="/admin/collections/pages" style={buttonSecondary}>
                管理页面
              </a>
              <a href="/admin/collections/posts" style={buttonSecondary}>
                管理文章
              </a>
            </>
          ) : null}
          {canSeeCommerce ? (
            <a href="/admin/collections/products" style={buttonSecondary}>
              管理商品
            </a>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="首页标题" value={asText(home.heroTitle) || '未填写'} hint={asText(home.eyebrow) || '无 eyebrow'} />
        <MetricCard
          label="推荐专题页"
          value={String(featuredPagesCount)}
          hint={featuredPagesCount ? '已手动配置' : '未手动配置，将按前台回退规则取已发布页面'}
          tone={featuredPagesCount ? '#265b35' : '#8a5b12'}
        />
        <MetricCard
          label="推荐文章"
          value={String(featuredPostsCount)}
          hint={featuredPostsCount ? '已手动配置' : '未手动配置，将回退到最新文章'}
          tone={featuredPostsCount ? '#265b35' : '#8a5b12'}
        />
        <MetricCard
          label="推荐商品"
          value={String(featuredProductsCount)}
          hint={featuredProductsCount ? '已手动配置' : '未手动配置，将回退到上架商品'}
          tone={featuredProductsCount ? '#265b35' : '#8a5b12'}
        />
        <MetricCard
          label="文章分类"
          value={String(postCategories.docs.length)}
          hint={postCategories.docs.length ? '博客分类已可运营' : '建议先建立文章分类'}
          tone={postCategories.docs.length ? '#265b35' : '#8a5b12'}
        />
        <MetricCard
          label="商品分类"
          value={String(productCategories.docs.length)}
          hint={productCategories.docs.length ? '商城分类已可运营' : '建议先建立商品分类'}
          tone={productCategories.docs.length ? '#265b35' : '#8a5b12'}
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <ContentListCard
          title="最近页面"
          emptyText="当前没有已发布页面。"
          footerHref="/admin/collections/pages"
          footerLabel="查看全部页面"
          items={pages.docs.map((page) => ({
            key: `page-${page.id}`,
            title: asText(page.title) || '未命名页面',
            meta: asText(page.slug) ? `slug: ${asText(page.slug)}` : '未设置 slug',
            detail: page.updatedAt ? `更新于 ${formatDate(String(page.updatedAt))}` : '最近更新未知',
            href: `/admin/collections/pages/${page.id}`,
          }))}
        />
        <ContentListCard
          title="最近文章"
          emptyText="当前没有已发布文章。"
          footerHref="/admin/collections/posts"
          footerLabel="查看全部文章"
          items={posts.docs.map((post) => ({
            key: `post-${post.id}`,
            title: asText(post.title) || '未命名文章',
            meta: getRelationshipName(post.primaryCategory) || '未分类',
            detail: post.updatedAt ? `更新于 ${formatDate(String(post.updatedAt))}` : '最近更新未知',
            href: `/admin/collections/posts/${post.id}`,
          }))}
        />
        <ContentListCard
          title="最近商品"
          emptyText="当前没有上架商品。"
          footerHref="/admin/collections/products"
          footerLabel="查看全部商品"
          items={products.docs.map((product) => ({
            key: `product-${product.id}`,
            title: asText(product.name) || '未命名商品',
            meta: [getRelationshipName(product.primaryCategory), typeof product.price === 'number' ? `¥${product.price.toLocaleString('zh-CN')}` : '未设置价格']
              .filter(Boolean)
              .join(' · '),
            detail: product.updatedAt ? `更新于 ${formatDate(String(product.updatedAt))}` : '最近更新未知',
            href: `/admin/collections/products/${product.id}`,
          }))}
        />
        <ContentListCard
          title="文章分类"
          emptyText="当前还没有文章分类。"
          footerHref="/admin/collections/post-categories"
          footerLabel="管理文章分类"
          items={postCategories.docs.map((category) => ({
            key: `post-category-${category.id}`,
            title: asText(category.name) || '未命名分类',
            meta: asText(category.slug) ? `slug: ${asText(category.slug)}` : '未设置 slug',
            detail: category.updatedAt ? `更新于 ${formatDate(String(category.updatedAt))}` : '最近更新未知',
            href: `/admin/collections/post-categories/${category.id}`,
          }))}
        />
        <ContentListCard
          title="商品分类"
          emptyText="当前还没有商品分类。"
          footerHref="/admin/collections/product-categories"
          footerLabel="管理商品分类"
          items={productCategories.docs.map((category) => ({
            key: `product-category-${category.id}`,
            title: asText(category.name) || '未命名分类',
            meta: asText(category.slug) ? `slug: ${asText(category.slug)}` : '未设置 slug',
            detail: category.updatedAt ? `更新于 ${formatDate(String(category.updatedAt))}` : '最近更新未知',
            href: `/admin/collections/product-categories/${category.id}`,
          }))}
        />
      </div>

      <div
        style={{
          borderRadius: 16,
          background: '#faf8f7',
          padding: '14px 16px',
          color: '#4f4742',
          lineHeight: 1.7,
        }}
      >
        当前首页 CTA：{asText(home.ctaLabel) || '未填写'} → {asText(home.ctaHref) || '未填写'}。如果今天需要临时调整官网导流方向，优先修改首页配置和推荐内容，不必改前台代码。
      </div>
    </section>
  )
}

function ContentListCard({
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
            <span style={{ color: '#5c5048', fontSize: 13 }}>{item.meta}</span>
            <span style={{ color: '#8d827a', fontSize: 12 }}>{item.detail}</span>
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

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getRelationshipName(value: unknown) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const name = 'name' in value ? value.name : ''
  return typeof name === 'string' ? name.trim() : ''
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

const smallButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 96,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid rgba(20,20,20,0.12)',
  textDecoration: 'none',
  color: '#1d1a17',
  fontWeight: 600,
  fontSize: 13,
} as const
