import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { listProductCategories, listProductTags, listProducts } from '@/lib/frontend-data'

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; tag?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const products = await listProducts()
  const categories = await listProductCategories()
  const tags = await listProductTags()
  const activeCategory = typeof resolvedSearchParams?.category === 'string' ? resolvedSearchParams.category : ''
  const activeTag = typeof resolvedSearchParams?.tag === 'string' ? resolvedSearchParams.tag : ''
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory ? product.categories?.some((item) => item.slug === activeCategory) : true
    const matchesTag = activeTag ? product.tags?.some((item) => item.slug === activeTag) : true
    return Boolean(matchesCategory && matchesTag)
  })

  return (
    <PageShell>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section style={{ maxWidth: 760 }}>
          <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            Commerce
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(34px, 5vw, 56px)' }}>商品与服务方案</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9, fontSize: 18 }}>
            当前商品列表已经直接读取 Payload 商品集合，适合作为服务报价、专题方案和标准产品的统一入口。
          </p>
        </section>

        <section style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/shop" style={!activeCategory && !activeTag ? chipPrimary : chipSecondary}>
            全部商品
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              style={activeCategory === category.slug ? chipPrimary : chipSecondary}
            >
              {category.name} {category.count ? `(${category.count})` : ''}
            </Link>
          ))}
        </section>

        <section style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/shop${activeCategory ? `?category=${encodeURIComponent(activeCategory)}&` : '?'}tag=${encodeURIComponent(tag.slug)}`}
              style={activeTag === tag.slug ? chipPrimary : chipSecondary}
            >
              #{tag.name} {tag.count ? `(${tag.count})` : ''}
            </Link>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
            marginTop: 28,
          }}
        >
          {filteredProducts.map((product) => (
            <article
              key={product.name}
              style={{
                background: '#fff',
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 24,
                padding: 20,
              }}
            >
              {product.cover ? (
                <img
                  src={product.cover.url}
                  alt={product.cover.alt}
                  style={{
                    width: '100%',
                    height: 220,
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: 18,
                    border: '1px solid rgba(20,20,20,0.08)',
                  }}
                />
              ) : null}
              <h2 style={{ margin: product.cover ? '18px 0 0' : 0, fontSize: 24, lineHeight: 1.25 }}>{product.name}</h2>
              {product.category && product.categorySlug ? (
                <div style={{ marginTop: 10 }}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(product.categorySlug)}`}
                    style={{ color: 'var(--gc-accent)', fontSize: 13, textDecoration: 'none' }}
                  >
                    {product.category}
                  </Link>
                </div>
              ) : null}
              {product.tags?.length ? (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.tags.map((tag) => (
                    <Link
                      key={`${product.slug}-${tag.slug}`}
                      href={`/shop?tag=${encodeURIComponent(tag.slug)}`}
                      style={{ color: '#6f6661', fontSize: 12, textDecoration: 'none' }}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              ) : null}
              <p style={{ margin: '14px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{product.summary}</p>
              <p style={{ margin: '18px 0 0', color: '#1d1a17', fontWeight: 700, fontSize: 22 }}>
                {product.currency === 'CNY' ? '¥' : ''}
                {product.price.toLocaleString('zh-CN')}
              </p>
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 16,
                  background: product.isSoldOut ? '#fff1f0' : '#faf5f3',
                  padding: '12px 14px',
                }}
              >
                <p style={{ margin: 0, color: product.isSoldOut ? '#b42318' : '#1d1a17', fontWeight: 700, fontSize: 14 }}>
                  {product.isSoldOut ? '已售罄' : '可下单'}
                </p>
                <p style={{ margin: '8px 0 0', color: '#6f6661', lineHeight: 1.7, fontSize: 13 }}>
                  {product.purchaseMessage || '当前可直接下单。'}
                </p>
              </div>
              <div style={{ marginTop: 16 }}>
                <Link
                  href={`/shop/${product.slug}`}
                  style={{
                    color: 'var(--gc-accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {product.isSoldOut ? '查看详情' : '查看并下单'}
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  )
}

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
