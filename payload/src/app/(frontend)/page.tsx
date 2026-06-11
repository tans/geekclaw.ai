import type { CSSProperties } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { getPageBySlug, listPosts, listProducts } from '@/lib/frontend-data'
import { getSiteData } from '@/lib/site'

export default async function HomePage() {
  const [page, site, posts, products] = await Promise.all([
    getPageBySlug('home'),
    getSiteData(),
    listPosts(),
    listProducts(),
  ])
  const featuredPosts = posts.slice(0, 2)
  const featuredProducts = products.slice(0, 2)

  return (
    <PageShell>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: '1.2fr 0.8fr',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 40,
              boxShadow: '0 24px 80px rgba(40, 20, 10, 0.06)',
            }}
          >
            <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.26em', textTransform: 'uppercase' }}>
              {site.siteName}
            </p>
            <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(40px, 7vw, 76px)', lineHeight: 1.02 }}>
              {page?.heroTitle ?? `${site.siteName} 专业内容站与商城后台`}
            </h1>
            <p style={{ margin: '18px 0 0', fontSize: 18, color: '#6f6661', lineHeight: 1.9, maxWidth: 720 }}>
              {page?.heroDescription ??
                '这一版开始不再做临时页，而是直接按 Payload 体系建设完整后台，统一管理官网、博客、专题页和商品。'}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 26 }}>
              <Link href="/bailongma" style={buttonPrimary}>
                查看白龙马专题页
              </Link>
              <Link href="/blog" style={buttonSecondary}>
                查看博客结构
              </Link>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #fff, #faf5f3)',
              border: '1px solid rgba(20,20,20,0.08)',
              borderRadius: 28,
              padding: 32,
              boxShadow: '0 24px 80px rgba(40, 20, 10, 0.06)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24 }}>当前范围</h2>
            <ul style={{ margin: '18px 0 0', paddingLeft: 20, color: '#6f6661', lineHeight: 1.9 }}>
              <li>页面后台：普通页、专题页、二级页</li>
              <li>博客后台：发布、分类、封面、SEO</li>
              <li>商品后台：商品、价格、状态、详情</li>
              <li>订单后台：订单号、状态、收货信息</li>
            </ul>
            <div
              style={{
                marginTop: 22,
                paddingTop: 20,
                borderTop: '1px solid rgba(20,20,20,0.08)',
                display: 'grid',
                gap: 10,
              }}
            >
              <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>后台入口</p>
              <Link href="/admin" style={{ color: 'var(--gc-accent)', textDecoration: 'none', fontWeight: 600 }}>
                打开管理后台
              </Link>
              <Link href="/payment-diagnostics" style={{ color: '#6f6661', textDecoration: 'none' }}>
                查看支付配置诊断
              </Link>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {[
            {
              title: '内容站与博客',
              body: '用统一的文章模型发布观点、公告、案例和专题延伸内容。',
            },
            {
              title: '专题页与二级页',
              body: '通过 pages 集合管理白龙马这类落地页，支持后续继续扩展区块。',
            },
            {
              title: '商品与支付链路',
              body: '商品、订单、支付诊断和 mock/支付宝流程已经串成闭环。',
            },
          ].map((item) => (
            <article
              key={item.title}
              style={{
                background: '#fff',
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22 }}>{item.title}</h2>
              <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{item.body}</p>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                Latest Posts
              </p>
              <h2 style={{ margin: '14px 0 0', fontSize: 30 }}>最新内容</h2>
            </div>
            <Link href="/blog" style={{ color: 'var(--gc-accent)', textDecoration: 'none', fontWeight: 600 }}>
              查看全部文章
            </Link>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {featuredPosts.map((post) => (
              <article
                key={post.slug}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(20,20,20,0.08)',
                  borderRadius: 24,
                  padding: 20,
                }}
              >
                {post.cover ? (
                  <img
                    src={post.cover.url}
                    alt={post.cover.alt}
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
                <div style={{ marginTop: post.cover ? 18 : 0 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {post.category ? <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 13 }}>{post.category}</p> : null}
                    {post.publishedAt ? <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{formatDate(post.publishedAt)}</p> : null}
                  </div>
                  <h3 style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.2 }}>{post.title}</h3>
                  <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{post.excerpt}</p>
                  <div style={{ marginTop: 16 }}>
                    <Link href={`/blog/${post.slug}`} style={{ color: 'var(--gc-accent)', textDecoration: 'none', fontWeight: 600 }}>
                      阅读全文
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                Featured Products
              </p>
              <h2 style={{ margin: '14px 0 0', fontSize: 30 }}>精选方案</h2>
            </div>
            <Link href="/shop" style={{ color: 'var(--gc-accent)', textDecoration: 'none', fontWeight: 600 }}>
              查看全部商品
            </Link>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {featuredProducts.map((product) => (
              <article
                key={product.slug}
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
                <h3 style={{ margin: product.cover ? '18px 0 0' : 0, fontSize: 26, lineHeight: 1.2 }}>{product.name}</h3>
                <p style={{ margin: '14px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{product.summary}</p>
                <p style={{ margin: '18px 0 0', color: '#1d1a17', fontWeight: 700, fontSize: 24 }}>
                  {product.currency === 'CNY' ? '¥' : ''}
                  {product.price.toLocaleString('zh-CN')}
                </p>
                <div style={{ marginTop: 16 }}>
                  <Link href={`/shop/${product.slug}`} style={{ color: 'var(--gc-accent)', textDecoration: 'none', fontWeight: 600 }}>
                    查看详情
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 34,
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 28,
            padding: 28,
          }}
        >
          <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
            Workflow
          </p>
          <h2 style={{ margin: '14px 0 0', fontSize: 30 }}>后台工作流已经可用</h2>
          <div style={{ marginTop: 18, display: 'grid', gap: 14, color: '#4f4742', lineHeight: 1.8 }}>
            <p style={{ margin: 0 }}>1. 在 `/admin` 管理页面、文章、商品、媒体和订单。</p>
            <p style={{ margin: 0 }}>2. 前台自动读取 Payload 内容，专题页、博客和商品详情已形成链路。</p>
            <p style={{ margin: 0 }}>3. 下单后可进入 mock 或真实支付宝流程，并用 `/payment-diagnostics` 排查配置。</p>
          </div>
        </section>
      </main>
    </PageShell>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
}

const buttonPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 160,
  padding: '12px 18px',
  borderRadius: 999,
  background: 'var(--gc-accent)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
}

const buttonSecondary: CSSProperties = {
  ...buttonPrimary,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
}
