import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { listProducts } from '@/lib/frontend-data'

export default async function ShopPage() {
  const products = await listProducts()
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

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
            marginTop: 28,
          }}
        >
          {products.map((product) => (
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
              <p style={{ margin: '14px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{product.summary}</p>
              <p style={{ margin: '18px 0 0', color: '#1d1a17', fontWeight: 700, fontSize: 22 }}>
                {product.currency === 'CNY' ? '¥' : ''}
                {product.price.toLocaleString('zh-CN')}
              </p>
              <div style={{ marginTop: 16 }}>
                <Link
                  href={`/shop/${product.slug}`}
                  style={{
                    color: 'var(--gc-accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  查看详情
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  )
}
