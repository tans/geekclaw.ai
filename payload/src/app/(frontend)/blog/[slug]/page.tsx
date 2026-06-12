import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { getPostBySlug } from '@/lib/frontend-data'
import { getSiteData, siteFallback } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const [{ slug }, site] = await Promise.all([params, getSiteData().catch(() => siteFallback)])
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: site.seoTitle,
      description: site.seoDescription,
    }
  }

  const description = post.excerpt || post.content || site.seoDescription

  return {
    title: `${post.title} | ${site.siteName}`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: post.cover ? [{ url: post.cover.url, alt: post.cover.alt }] : undefined,
    },
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <PageShell>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '64px 20px 40px' }}>
        <article
          style={{
            background: '#fff',
            border: '1px solid rgba(20,20,20,0.08)',
            borderRadius: 28,
            padding: 32,
          }}
        >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {post.category && post.categorySlug ? (
              <a
                href={`/blog?category=${encodeURIComponent(post.categorySlug)}`}
                style={{ margin: 0, color: 'var(--gc-accent)', fontSize: 13, textDecoration: 'none' }}
              >
                {post.category}
              </a>
            ) : null}
            {post.publishedAt ? (
              <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{formatDate(post.publishedAt)}</p>
            ) : null}
          </div>
          <h1 style={{ margin: '14px 0 0', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.08 }}>{post.title}</h1>
          {post.excerpt ? (
            <p style={{ margin: '18px 0 0', color: '#6f6661', lineHeight: 1.9, fontSize: 18 }}>{post.excerpt}</p>
          ) : null}
          {post.tags?.length ? (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {post.tags.map((tag) => (
                <a
                  key={`${post.slug}-${tag.slug}`}
                  href={`/blog?tag=${encodeURIComponent(tag.slug)}`}
                  style={{ color: '#6f6661', fontSize: 13, textDecoration: 'none' }}
                >
                  #{tag.name}
                </a>
              ))}
            </div>
          ) : null}
          {post.cover ? (
            <div style={{ marginTop: 24 }}>
              <img
                src={post.cover.url}
                alt={post.cover.alt}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 24,
                  border: '1px solid rgba(20,20,20,0.08)',
                }}
              />
            </div>
          ) : null}
          <div
            style={{
              marginTop: 24,
              color: '#3f3935',
              lineHeight: 1.95,
              fontSize: 17,
              whiteSpace: 'pre-wrap',
            }}
          >
            {post.content}
          </div>
        </article>
      </main>
    </PageShell>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
}
