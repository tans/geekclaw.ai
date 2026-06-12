import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { buildContentGovernanceSummary, type GovernanceIssue } from '@/lib/content-governance'
import type { Media, Page, Post, Product, SiteSetting } from '@/payload-types'

export default async function ContentGovernancePage() {
  const payload = await getPayload({ config })
  const [siteSettings, pages, posts, products, media] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null),
    payload.find({ collection: 'pages', depth: 1, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.find({ collection: 'posts', depth: 1, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.find({ collection: 'products', depth: 1, limit: 200, pagination: false, sort: '-updatedAt' }),
    payload.find({ collection: 'media', depth: 0, limit: 200, pagination: false, sort: '-updatedAt' }),
  ])

  const summary = buildContentGovernanceSummary({
    pages: pages.docs as Page[],
    posts: posts.docs as Post[],
    products: products.docs as Product[],
    media: media.docs as Media[],
    siteSettings: siteSettings as SiteSetting | null,
  })

  const totalIssues =
    summary.metrics.pages.total + summary.metrics.posts.total + summary.metrics.products.total + summary.metrics.media.total
  const totalErrors =
    summary.metrics.pages.errors + summary.metrics.posts.errors + summary.metrics.products.errors + summary.metrics.media.errors
  const totalWarnings =
    summary.metrics.pages.warnings + summary.metrics.posts.warnings + summary.metrics.products.warnings + summary.metrics.media.warnings

  return (
    <main
      style={{
        padding: 24,
        display: 'grid',
        gap: 20,
        background: '#f5f5f3',
        minHeight: '100vh',
      }}
    >
      <section
        style={{
          border: '1px solid rgba(20,20,20,0.08)',
          borderRadius: 24,
          background: '#fff',
          padding: 24,
          display: 'grid',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={eyebrowStyle}>Content Governance</p>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, lineHeight: 1.2 }}>内容治理台</h1>
            <p style={descStyle}>
              把页面、文章、商品和素材库的问题集中成一个可处理的后台页面，优先解决影响前台首屏、SEO 和转化的内容短板。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Link href="/admin/collections/pages" style={buttonPrimary}>
              管理页面
            </Link>
            <Link href="/admin/collections/posts" style={buttonSecondary}>
              管理文章
            </Link>
            <Link href="/admin/collections/products" style={buttonSecondary}>
              管理商品
            </Link>
            <Link href="/admin/media-governance" style={buttonSecondary}>
              素材治理台
            </Link>
            <Link href="/admin/collections/media" style={buttonSecondary}>
              管理素材
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <MetricCard label="总问题数" value={String(totalIssues)} note="全部内容与素材问题" tone={totalIssues ? '#b42318' : '#265b35'} />
          <MetricCard label="高优先级" value={String(totalErrors)} note="已发布/已上架内容中的硬问题" tone={totalErrors ? '#b42318' : '#265b35'} />
          <MetricCard label="一般优化项" value={String(totalWarnings)} note="封面、SEO、摘要与素材质量" tone={totalWarnings ? '#8a5b12' : '#265b35'} />
          <MetricCard label="素材问题" value={String(summary.metrics.media.total)} note="alt 与尺寸问题" tone={summary.metrics.media.total ? '#8a2f16' : '#265b35'} />
          <MetricCard label="未引用素材" value={String(summary.metrics.unusedMediaCount)} note="还没有被任何内容使用" tone={summary.metrics.unusedMediaCount ? '#b42318' : '#265b35'} />
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <SummaryCard title="页面" total={summary.metrics.pages.total} errors={summary.metrics.pages.errors} warnings={summary.metrics.pages.warnings} />
          <SummaryCard title="文章" total={summary.metrics.posts.total} errors={summary.metrics.posts.errors} warnings={summary.metrics.posts.warnings} />
          <SummaryCard title="商品" total={summary.metrics.products.total} errors={summary.metrics.products.errors} warnings={summary.metrics.products.warnings} />
          <SummaryCard title="素材" total={summary.metrics.media.total} errors={summary.metrics.media.errors} warnings={summary.metrics.media.warnings} />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <IssueColumn title="页面待处理" items={summary.pageIssues} emptyText="当前没有明显的页面质量问题。" footerHref="/admin/collections/pages" footerLabel="查看全部页面" />
        <IssueColumn title="文章待处理" items={summary.postIssues} emptyText="当前没有明显的文章质量问题。" footerHref="/admin/collections/posts" footerLabel="查看全部文章" />
        <IssueColumn title="商品待处理" items={summary.productIssues} emptyText="当前没有明显的商品质量问题。" footerHref="/admin/collections/products" footerLabel="查看全部商品" />
        <IssueColumn title="素材待处理" items={summary.mediaIssues} emptyText="当前没有明显的素材质量问题。" footerHref="/admin/collections/media" footerLabel="查看全部素材" />
      </section>
    </main>
  )
}

function IssueColumn({
  title,
  items,
  emptyText,
  footerHref,
  footerLabel,
}: {
  title: string
  items: GovernanceIssue[]
  emptyText: string
  footerHref: string
  footerLabel: string
}) {
  return (
    <section
      style={{
        borderRadius: 20,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: 18,
        display: 'grid',
        gap: 12,
        alignContent: 'start',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
        <p style={{ margin: '8px 0 0', color: '#5c5048', lineHeight: 1.7 }}>先处理红色硬问题，再处理橙色优化项。</p>
      </div>
      {items.length ? (
        items.slice(0, 12).map((item) => (
          <Link
            key={`${item.href}-${item.title}`}
            href={item.href}
            style={{
              borderRadius: 16,
              border: item.severity === 'error' ? '1px solid rgba(180,35,24,0.18)' : '1px solid rgba(138,91,18,0.16)',
              background: item.severity === 'error' ? '#fff5f3' : '#fffaf2',
              padding: '12px 14px',
              textDecoration: 'none',
              color: '#1d1a17',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{item.title}</strong>
            <span style={{ color: item.severity === 'error' ? '#b42318' : '#8a5b12', fontSize: 13 }}>{item.note}</span>
          </Link>
        ))
      ) : (
        <div style={{ borderRadius: 14, background: '#f7f4f3', padding: '12px 14px', color: '#5c5048', lineHeight: 1.7 }}>{emptyText}</div>
      )}
      <Link href={footerHref} style={footerButton}>
        {footerLabel}
      </Link>
    </section>
  )
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
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(20,20,20,0.08)',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <p style={{ margin: 0, color: '#6f6661', fontSize: 13 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: tone }}>{value}</p>
      <p style={{ margin: 0, color: '#4f4742', fontSize: 13, lineHeight: 1.7 }}>{note}</p>
    </article>
  )
}

function SummaryCard({
  title,
  total,
  errors,
  warnings,
}: {
  title: string
  total: number
  errors: number
  warnings: number
}) {
  return (
    <article
      style={{
        borderRadius: 18,
        background: '#faf8f7',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <strong>{title}</strong>
      <p style={{ margin: 0, color: '#4f4742', lineHeight: 1.7 }}>
        共 {total} 项，硬问题 {errors}，优化项 {warnings}。
      </p>
    </article>
  )
}

const eyebrowStyle = {
  margin: 0,
  color: '#b42318',
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
} as const

const descStyle = {
  margin: '12px 0 0',
  color: '#5c5048',
  lineHeight: 1.8,
} as const

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

const footerButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: 999,
  background: '#fff',
  color: '#1d1a17',
  border: '1px solid rgba(20,20,20,0.12)',
  textDecoration: 'none',
  fontWeight: 600,
} as const
