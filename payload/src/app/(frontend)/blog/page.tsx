import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { listPosts } from '@/lib/frontend-data'

export default async function BlogPage() {
  const posts = await listPosts()
  return (
    <PageShell>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 20px 40px' }}>
        <section style={{ maxWidth: 760 }}>
          <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            Blog
          </p>
          <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(34px, 5vw, 56px)' }}>博客与内容更新</h1>
          <p style={{ margin: '16px 0 0', color: '#6f6661', lineHeight: 1.9, fontSize: 18 }}>
            当前列表已经直接读取 Payload 文章集合，适合持续发布动态、观点和案例文章。
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 20,
            marginTop: 28,
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          {posts.map((post) => (
            <article
              key={post.title}
              style={{
                background: '#fff',
                border: '1px solid rgba(20,20,20,0.08)',
                borderRadius: 24,
                padding: 20,
                overflow: 'hidden',
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
                  {post.category ? (
                    <p style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 13 }}>{post.category}</p>
                  ) : null}
                  {post.publishedAt ? (
                    <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{formatDate(post.publishedAt)}</p>
                  ) : null}
                </div>
                <h2 style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.2 }}>{post.title}</h2>
                <p style={{ margin: '12px 0 0', color: '#6f6661', lineHeight: 1.8 }}>{post.excerpt}</p>
              </div>
              <div style={{ marginTop: 16 }}>
                <Link
                  href={`/blog/${post.slug}`}
                  style={{
                    color: 'var(--gc-accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  阅读全文
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
}
