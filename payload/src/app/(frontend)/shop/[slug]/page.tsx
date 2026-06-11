import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { OrderForm } from '@/components/order-form'
import { getProductBySlug } from '@/lib/frontend-data'
import { getSiteData, siteFallback } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const [{ slug }, site] = await Promise.all([params, getSiteData().catch(() => siteFallback)])
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: site.seoTitle,
      description: site.seoDescription,
    }
  }

  const description = product.summary || product.content || site.seoDescription

  return {
    title: `${product.name} | ${site.siteName}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.cover ? [{ url: product.cover.url, alt: product.cover.alt }] : undefined,
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <PageShell>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '64px 20px 40px' }}>
        <article
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 0.8fr',
            gap: 24,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 32,
            }}
          >
            {product.cover ? (
              <img
                src={product.cover.url}
                alt={product.cover.alt}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 24,
                  border: '1px solid rgba(20,20,20,0.08)',
                  marginBottom: 24,
                }}
              />
            ) : null}
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.08 }}>{product.name}</h1>
            {product.summary ? (
              <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9, fontSize: 18 }}>{product.summary}</p>
            ) : null}
            <div
              style={{
                marginTop: 20,
                color: '#3f3935',
                lineHeight: 1.95,
                fontSize: 17,
                whiteSpace: 'pre-wrap',
              }}
            >
              {product.content}
            </div>
            {product.gallery?.length ? (
              <section style={{ marginTop: 28 }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>相关展示</h2>
                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gap: 16,
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  }}
                >
                  {product.gallery.map((image) => (
                    <img
                      key={`${image.url}-${image.alt}`}
                      src={image.url}
                      alt={image.alt}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: 20,
                        border: '1px solid rgba(20,20,20,0.08)',
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <aside
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 28,
              alignSelf: 'start',
            }}
          >
            <p style={{ margin: 0, color: '#6f6661' }}>价格</p>
            <p style={{ margin: '10px 0 0', fontSize: 34, fontWeight: 700 }}>
              {product.currency === 'CNY' ? '¥' : ''}
              {product.price.toLocaleString('zh-CN')}
            </p>
            <div
              style={{
                marginTop: 16,
                borderRadius: 18,
                background: product.isSoldOut ? '#fff1f0' : '#faf5f3',
                padding: 16,
              }}
            >
              <p style={{ margin: 0, color: product.isSoldOut ? '#b42318' : '#1d1a17', fontWeight: 700 }}>
                {product.isSoldOut ? '当前已售罄' : '可售状态'}
              </p>
              <p style={{ margin: '8px 0 0', color: '#4f4742', lineHeight: 1.8 }}>
                {product.purchaseMessage || '当前可直接下单。'}
              </p>
              {product.sku ? <p style={{ margin: '8px 0 0', color: '#6f6661', fontSize: 13 }}>SKU：{product.sku}</p> : null}
            </div>
            <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{product.summary}</p>
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(20,20,20,0.08)', paddingTop: 20 }}>
              <OrderForm
                availableQuantity={product.availableQuantity}
                allowBackorder={product.allowBackorder}
                currency={product.currency}
                isSoldOut={product.isSoldOut}
                limitPerOrder={product.limitPerOrder}
                productName={product.name}
                productSlug={product.slug}
                purchaseMessage={product.purchaseMessage}
                sku={product.sku}
                unitPrice={product.price}
              />
            </div>
          </aside>
        </article>
      </main>
    </PageShell>
  )
}
